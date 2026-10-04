import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpenText, Menu, Moon, Plus, Search, SearchX, Sun, SunMoon, X } from "lucide-react";
import { Button, Chip, EmptyState, Fab, IconButton, TextField, TopAppBar, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useTheme } from "../../../app/useTheme";
import { CONTENT_TYPES, wordsInChapters } from "../model";
import { useDocs } from "../DocsProvider";
import BookRow from "../components/BookRow";
import BookSheet from "../components/BookSheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function LibraryScreen() {
  const navigate = useNavigate();
  const drawer = useDrawer();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const { books, createBook, updateBook, deleteBook, restoreBook } = useDocs();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [swipeId, setSwipeId] = useState(null);
  const [sheet, setSheet] = useState(null); // { book } — book is undefined when creating
  const ThemeIcon = THEME_ICON[theme.mode];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books
      .filter((b) => type === "all" || b.type === type)
      .filter((b) => !q || `${b.title} ${(b.tags || []).join(" ")}`.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [books, query, type]);

  const totalWords = useMemo(() => books.reduce((n, b) => n + wordsInChapters(b.chapters), 0), [books]);
  const filtering = query.trim() || type !== "all";

  const save = (data) => {
    if (sheet.book) updateBook(sheet.book.id, data);
    else createBook(data);
    setSheet(null);
  };

  const remove = (book) => {
    const index = deleteBook(book.id);
    snackbar.show({ message: `Deleted “${book.title}”`, actionLabel: "Undo", onAction: () => restoreBook(book, index) });
  };

  let body;
  if (books.length === 0) {
    body = (
      <EmptyState icon={<BookOpenText size={52} />} title="Start writing" action={<Button onClick={() => setSheet({})}>New doc</Button>}>
        Notes, books and documentation all live here.
      </EmptyState>
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        icon={<SearchX size={52} />}
        title="Nothing matches"
        action={filtering && <Button variant="tonal" onClick={() => { setQuery(""); setType("all"); }}>Clear filters</Button>}
      >
        Try a different search or type.
      </EmptyState>
    );
  } else {
    body = (
      <ul className="lib-list">
        {rows.map((book) => (
          <BookRow
            key={book.id}
            book={book}
            swipeOpen={swipeId === book.id}
            onSwipe={setSwipeId}
            onOpen={(b) => navigate(`/docs/${b.id}`)}
            onEdit={(b) => setSheet({ book: b })}
            onDelete={remove}
          />
        ))}
      </ul>
    );
  }

  return (
    <>
      <TopAppBar
        title="Docs"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={
          <IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}>
            <ThemeIcon size={22} />
          </IconButton>
        }
      />
      <main className="docs-page">
        <header className="docs-head">
          <p className="overline muted">
            {books.length} doc{books.length === 1 ? "" : "s"} · {totalWords.toLocaleString()} words
          </p>
          <h1 className="display">Docs</h1>
        </header>

        <TextField
          type="search"
          label="Search docs or tags"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          leading={<Search size={22} />}
          trailing={query && <IconButton label="Clear search" onClick={() => setQuery("")}><X size={20} /></IconButton>}
          className="field-pill"
        />

        <nav className="chips-row" aria-label="Type">
          <Chip selected={type === "all"} onClick={() => setType("all")}>All</Chip>
          {CONTENT_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <Chip key={t.id} hue={t.hue} selected={type === t.id} icon={<Icon size={18} />} onClick={() => setType(t.id)}>
                {t.label}
              </Chip>
            );
          })}
        </nav>

        {body}
      </main>

      <Fab className="docs-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New doc" extended={!scrollingDown} onClick={() => setSheet({})} />
      {sheet && <BookSheet book={sheet.book} onClose={() => setSheet(null)} onSave={save} />}
    </>
  );
}
