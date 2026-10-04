import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ListTree, Pencil, Plus } from "lucide-react";
import { Button, EmptyState, Fab, IconButton, TopAppBar, useScrollingDown, useSnackbar } from "../../../design/components";
import { useMediaQuery } from "../../../design/useMediaQuery";
import { blankChapter, countWords, typeInfo, uid, wordsInChapters } from "../model";
import { useDocs } from "../DocsProvider";
import { FormattingDock, SelectionToolbar, useFormatting } from "../components/formatting";
import { OutlineModal, OutlinePanel } from "../components/Outline";
import NodeSheet from "../components/NodeSheet";
import BookSheet from "../components/BookSheet";

export default function BookScreen() {
  const { bookId } = useParams();
  const { books } = useDocs();
  const book = books.find((b) => b.id === bookId);
  if (!book) return <Navigate to="/docs" replace />;
  return <Editor key={book.id} book={book} />;
}

function Editor({ book }) {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const { updateBook, editChapters } = useDocs();
  const wide = useMediaQuery("(min-width: 840px)");
  const finePointer = useMediaQuery("(pointer: fine)");
  const scrollingDown = useScrollingDown();
  const type = typeInfo(book.type);
  const { chapters } = book;

  const [chapterId, setChapterId] = useState(chapters[0]?.id ?? null);
  const [subId, setSubId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [editing, setEditing] = useState(false);
  const [outlineOpen, setOutlineOpen] = useState(wide);
  const [sheet, setSheet] = useState(null); // { kind: "node", chapterId, subId } | { kind: "book" }
  const editorRef = useRef(null);

  useLayoutEffect(() => window.scrollTo(0, 0), []);
  useEffect(() => setOutlineOpen(wide), [wide]);

  // what is on screen (falls back gracefully if the active item was deleted)
  const chapter = chapters.find((c) => c.id === chapterId) ?? chapters[0] ?? null;
  const sub = subId && chapter ? chapter.subs.find((s) => s.id === subId) ?? null : null;
  const activeKey = sub ? sub.id : chapter?.id ?? null;
  const content = sub ? sub.content : chapter?.content ?? "";
  const title = sub ? sub.title : chapter?.title ?? "";
  const chapterIndex = chapter ? chapters.indexOf(chapter) : -1;
  const sectionIndex = sub ? chapter.subs.indexOf(sub) : -1;

  const active = useRef({});
  active.current = { chapterId: chapter?.id, subId: sub?.id };

  // The editor is uncontrolled: set its HTML only when the item changes, never while typing.
  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKey]);

  useEffect(() => {
    if (editing) editorRef.current?.focus();
  }, [editing, activeKey]);

  const setContent = useCallback((html) => {
    const { chapterId: cid, subId: sid } = active.current;
    editChapters(book.id, (cs) =>
      cs.map((c) => {
        if (c.id !== cid) return c;
        return sid ? { ...c, subs: c.subs.map((s) => (s.id === sid ? { ...s, content: html } : s)) } : { ...c, content: html };
      })
    );
  }, [book.id, editChapters]);

  const format = useFormatting(editorRef, setContent);

  const select = (cid, sid) => {
    setChapterId(cid);
    setSubId(sid);
    if (!wide) setOutlineOpen(false);
  };

  const setTitle = (cid, sid, value) =>
    editChapters(book.id, (cs) =>
      cs.map((c) => {
        if (c.id !== cid) return c;
        return sid ? { ...c, subs: c.subs.map((s) => (s.id === sid ? { ...s, title: value } : s)) } : { ...c, title: value };
      })
    );

  const setDescription = (value) =>
    editChapters(book.id, (cs) => cs.map((c) => (c.id === chapter.id ? { ...c, description: value } : c)));

  const addChapter = () => {
    const ch = blankChapter(chapters.length + 1);
    editChapters(book.id, (cs) => [...cs, ch]);
    select(ch.id, null);
  };

  const addSub = (cid) => {
    const target = chapters.find((c) => c.id === cid);
    const s = { id: uid(), title: `Section ${target.subs.length + 1}`, content: "" };
    editChapters(book.id, (cs) => cs.map((c) => (c.id === cid ? { ...c, subs: [...c.subs, s] } : c)));
    setCollapsed((m) => ({ ...m, [cid]: false }));
    select(cid, s.id);
  };

  const move = (arr, id, dir) => {
    const i = arr.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return arr;
    const next = [...arr];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  };

  const moveNode = (cid, sid, dir) =>
    editChapters(book.id, (cs) => (sid ? cs.map((c) => (c.id === cid ? { ...c, subs: move(c.subs, sid, dir) } : c)) : move(cs, cid, dir)));

  const deleteNode = (cid, sid) => {
    const ch = chapters.find((c) => c.id === cid);
    if (sid) {
      const index = ch.subs.findIndex((s) => s.id === sid);
      const removed = ch.subs[index];
      editChapters(book.id, (cs) => cs.map((c) => (c.id === cid ? { ...c, subs: c.subs.filter((s) => s.id !== sid) } : c)));
      if (subId === sid) setSubId(null);
      snackbar.show({
        message: `Deleted “${removed.title}”`,
        actionLabel: "Undo",
        onAction: () =>
          editChapters(book.id, (cs) =>
            cs.map((c) => {
              if (c.id !== cid || c.subs.some((s) => s.id === removed.id)) return c;
              const subs = [...c.subs];
              subs.splice(Math.min(index, subs.length), 0, removed);
              return { ...c, subs };
            })
          ),
      });
    } else {
      const index = chapters.findIndex((c) => c.id === cid);
      editChapters(book.id, (cs) => cs.filter((c) => c.id !== cid));
      if (chapter?.id === cid) { setChapterId(chapters[index === 0 ? 1 : 0]?.id ?? null); setSubId(null); }
      snackbar.show({
        message: `Deleted “${ch.title}”`,
        actionLabel: "Undo",
        onAction: () =>
          editChapters(book.id, (cs) => {
            if (cs.some((c) => c.id === ch.id)) return cs;
            const next = [...cs];
            next.splice(Math.min(index, next.length), 0, ch);
            return next;
          }),
      });
    }
  };

  const totalWords = wordsInChapters(chapters);
  const activeWords = countWords(content);

  const outline = (
    <OutlinePanel
      book={book}
      type={type}
      words={totalWords}
      activeChapterId={chapter?.id}
      activeSubId={sub?.id}
      collapsed={collapsed}
      onToggle={(id) => setCollapsed((m) => ({ ...m, [id]: !m[id] }))}
      onSelect={select}
      onEditNode={(cid, sid) => setSheet({ kind: "node", chapterId: cid, subId: sid })}
      onAddChapter={addChapter}
      onEditBook={() => setSheet({ kind: "book" })}
    />
  );

  // sheet target
  let nodeSheet = null;
  if (sheet?.kind === "node") {
    const ch = chapters.find((c) => c.id === sheet.chapterId);
    const s = sheet.subId ? ch?.subs.find((x) => x.id === sheet.subId) : null;
    if (ch && (!sheet.subId || s)) {
      const list = s ? ch.subs : chapters;
      const id = s ? s.id : ch.id;
      const i = list.findIndex((x) => x.id === id);
      nodeSheet = (
        <NodeSheet
          node={s ?? ch}
          isSection={!!s}
          canMoveUp={i > 0}
          canMoveDown={i < list.length - 1}
          canDelete={!!s || chapters.length > 1}
          onClose={() => setSheet(null)}
          onRename={(value) => setTitle(ch.id, s?.id ?? null, value)}
          onAddSub={() => addSub(ch.id)}
          onMove={(dir) => moveNode(ch.id, s?.id ?? null, dir)}
          onDelete={() => deleteNode(ch.id, s?.id ?? null)}
        />
      );
    }
  }

  return (
    <div className={`doc acc${editing ? " is-editing" : ""}${wide && outlineOpen ? " has-outline" : ""}`} style={{ "--hue": type.hue }}>
      <TopAppBar
        persistentTitle
        title={title || "Untitled"}
        leading={<IconButton label="Back to library" onClick={() => navigate("/docs")}><ArrowLeft size={24} /></IconButton>}
        actions={
          <>
            <span className="words-pill label-md" aria-label={`${activeWords} words in this page`}>{activeWords.toLocaleString()} words</span>
            <IconButton label={outlineOpen ? "Hide outline" : "Show outline"} className={outlineOpen ? "is-on" : ""} aria-pressed={outlineOpen} onClick={() => setOutlineOpen((o) => !o)}>
              <ListTree size={22} />
            </IconButton>
            <IconButton label={editing ? "Done editing" : "Edit"} className={editing ? "is-on" : ""} onClick={() => setEditing((e) => !e)}>
              {editing ? <Check size={22} /> : <Pencil size={22} />}
            </IconButton>
          </>
        }
      />

      <div className="doc-body">
        {wide && outlineOpen && <aside className="outline-docked" aria-label="Outline">{outline}</aside>}

        <main className="doc-main">
          {chapter ? (
            <article className="doc-page">
              <p className="overline muted">{sub ? `Chapter ${chapterIndex + 1} · Section ${sectionIndex + 1}` : `Chapter ${chapterIndex + 1}`}</p>
              <input
                className="doc-title"
                aria-label="Title"
                value={title}
                readOnly={!editing}
                onChange={(e) => setTitle(chapter.id, sub?.id ?? null, e.target.value)}
              />
              {!sub && (editing || chapter.description) && (
                <input
                  className="doc-desc body-lg"
                  aria-label="Short intro"
                  value={chapter.description || ""}
                  readOnly={!editing}
                  placeholder="Add a short intro (optional)"
                  onChange={(e) => setDescription(e.target.value)}
                />
              )}
              <div
                ref={editorRef}
                className="prose"
                role="textbox"
                aria-multiline="true"
                aria-label="Content"
                contentEditable={editing}
                suppressContentEditableWarning
                spellCheck={editing}
                data-placeholder={editing ? (sub ? `Write “${title}” here…` : "Begin writing…") : "Nothing here yet — tap Edit to start writing."}
                onInput={() => editing && editorRef.current && setContent(editorRef.current.innerHTML)}
                onDoubleClick={() => !editing && setEditing(true)}
              />
            </article>
          ) : (
            <EmptyState icon={<Plus size={52} />} title="No chapters yet" action={<Button onClick={addChapter}>Add first chapter</Button>}>
              Every book starts with a chapter.
            </EmptyState>
          )}
        </main>
      </div>

      {!wide && <OutlineModal open={outlineOpen} onClose={() => setOutlineOpen(false)}>{outline}</OutlineModal>}

      {!editing && chapter && (
        <Fab className="docs-fab" icon={<Pencil size={24} />} label="Edit" extended={!scrollingDown} onClick={() => setEditing(true)} />
      )}
      {editing && <FormattingDock format={format} />}
      <SelectionToolbar editorRef={editorRef} enabled={editing && finePointer} format={format} />

      {nodeSheet}
      {sheet?.kind === "book" && (
        <BookSheet
          book={book}
          onClose={() => setSheet(null)}
          onSave={(data) => { updateBook(book.id, data); setSheet(null); }}
        />
      )}
    </div>
  );
}
