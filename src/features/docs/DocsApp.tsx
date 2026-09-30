import { useState, useEffect, useRef } from 'react';

const ACCENT = '#57d38c';
const WORD_GOAL = 3000;
const LIBRARY_KEY = 'docs-app:library';

function generateId(prefix = 'ch') {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

const stripHtml = h => (h || '').replace(/<[^>]*>/g, ' ').trim();

function wordsInChapters(chapters) {
  return (chapters || []).reduce((acc, ch) => {
    const cw = ch.content ? stripHtml(ch.content).split(/\s+/).filter(Boolean).length : 0;
    const sw = (ch.subs || []).reduce((a, s) => a + (s.content ? stripHtml(s.content).split(/\s+/).filter(Boolean).length : 0), 0);
    return acc + cw + sw;
  }, 0);
}

function relativeTime(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

function seedChapters() {
  return [
    {
      id: generateId(),
      title: "Getting Started",
      description: "A quick primer before you dive in.",
      content: "<p>This is your documentation workspace. Each <strong>chapter</strong> in the sidebar is a top-level page, and each chapter can hold nested <strong>sections</strong> — just like a real docs site.</p><p>Double-click any text to start editing it.</p>",
      subs: [
        {
          id: generateId(),
          title: "Installation",
          content: "<p>Add the package to your project:</p><pre>npm install your-package</pre><p>Then import it wherever you need it.</p>",
        },
        {
          id: generateId(),
          title: "Quick Start",
          content: "<p>Create your first entry, give it a title, and start writing. Formatting is available from the toolbar at the bottom of the editor, or by selecting text.</p>",
        },
      ],
    },
    {
      id: generateId(),
      title: "API Reference",
      description: "",
      content: "",
      subs: [
        {
          id: generateId(),
          title: "Authentication",
          content: "<p>Requests are authenticated with a bearer token in the <code>Authorization</code> header.</p><pre>Authorization: Bearer sk_live_xxxxxxxx</pre><p>Old keys stay valid for 24 hours after a new one is issued.</p>",
        },
      ],
    },
  ];
}

function blankChapters() {
  return [
    { id: generateId(), title: "Chapter 1", description: "", content: "", subs: [] },
  ];
}

function seedLibrary() {
  const now = Date.now();
  return [
    {
      id: generateId('bk'),
      title: "Project Docs",
      tags: ["v1", "internal"],
      type: "documentation",
      chapters: seedChapters(),
      createdAt: now,
      updatedAt: now,
    },
  ];
}

// ── Content types ────────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: "note",          label: "Note",          symbol: "✎" },
  { id: "book",          label: "Book",          symbol: "§" },
  { id: "documentation", label: "Documentation", symbol: "⌘" },
];
const typeInfo = (id) => CONTENT_TYPES.find(t => t.id === id) || CONTENT_TYPES[1];


// ── Formatting toolbar ───────────────────────────────────────────────────────
function FormattingToolbar({ editorRef, accent, onUpdate }) {
  const exec = (cmd, value = null) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, value);
    setTimeout(() => {
      if (editorRef.current) onUpdate(editorRef.current.innerHTML);
    }, 0);
  };

  const applyBlock = (tag) => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const block = node.nodeType === 3 ? node.parentElement : node;
      const current = block?.closest('h1,h2,h3,h4,blockquote,pre,p,div');
      if (current && current.tagName.toLowerCase() === tag) {
        document.execCommand('formatBlock', false, 'p');
      } else {
        document.execCommand('formatBlock', false, tag);
      }
    } else {
      document.execCommand('formatBlock', false, tag);
    }
    setTimeout(() => {
      if (editorRef.current) onUpdate(editorRef.current.innerHTML);
    }, 0);
  };

  const insertHR = () => {
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, '<hr style="border:none;border-top:1px solid #1a1a1a;margin:20px 0;"/>');
    setTimeout(() => { if (editorRef.current) onUpdate(editorRef.current.innerHTML); }, 0);
  };

  const Divider = () => (
    <div style={{ width: 1, height: 18, background: '#1e1e1e', margin: '0 3px', flexShrink: 0 }} />
  );

  const Btn = ({ title, onMouseDown, children, wide }) => (
    <button
      title={title}
      onMouseDown={onMouseDown}
      style={{
        background: 'transparent',
        border: '1px solid #181818',
        color: '#484848',
        width: wide ? 36 : 28,
        height: 26,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        fontFamily: "'Courier New', Courier, monospace",
        transition: 'border-color 0.12s, color 0.12s, background 0.12s',
        flexShrink: 0,
        padding: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent + '77';
        e.currentTarget.style.color = accent;
        e.currentTarget.style.background = accent + '0d';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#181818';
        e.currentTarget.style.color = '#484848';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      borderTop: '1px solid #111',
      marginTop: 16,
      paddingTop: 8,
      paddingBottom: 4,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: 4,
        paddingLeft: 8,
        paddingRight: 8,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
        className="toolbar-scroll"
      >
        <Btn title="Bold" onMouseDown={e => { e.preventDefault(); exec('bold'); }}>
          <span style={{ fontWeight: 800, fontFamily: 'serif', fontSize: 13 }}>B</span>
        </Btn>
        <Btn title="Italic" onMouseDown={e => { e.preventDefault(); exec('italic'); }}>
          <span style={{ fontStyle: 'italic', fontFamily: 'serif', fontSize: 13 }}>I</span>
        </Btn>
        <Btn title="Underline" onMouseDown={e => { e.preventDefault(); exec('underline'); }}>
          <span style={{ textDecoration: 'underline', fontSize: 12 }}>U</span>
        </Btn>
        <Btn title="Strikethrough" onMouseDown={e => { e.preventDefault(); exec('strikeThrough'); }}>
          <span style={{ textDecoration: 'line-through', fontSize: 12 }}>S</span>
        </Btn>
        <Btn title="Superscript" onMouseDown={e => { e.preventDefault(); exec('superscript'); }}>
          <span style={{ fontSize: 10 }}>x<sup style={{ fontSize: 8 }}>2</sup></span>
        </Btn>
        <Btn title="Subscript" onMouseDown={e => { e.preventDefault(); exec('subscript'); }}>
          <span style={{ fontSize: 10 }}>x<sub style={{ fontSize: 8 }}>2</sub></span>
        </Btn>

        <Divider />

        <Btn title="Heading 1" wide onMouseDown={e => { e.preventDefault(); applyBlock('h1'); }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>H1</span>
        </Btn>
        <Btn title="Heading 2" wide onMouseDown={e => { e.preventDefault(); applyBlock('h2'); }}>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>H2</span>
        </Btn>
        <Btn title="Heading 3" wide onMouseDown={e => { e.preventDefault(); applyBlock('h3'); }}>
          <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.3 }}>H3</span>
        </Btn>
        <Btn title="Heading 4" wide onMouseDown={e => { e.preventDefault(); applyBlock('h4'); }}>
          <span style={{ fontSize: 10, fontWeight: 400, letterSpacing: 0.3 }}>H4</span>
        </Btn>
        <Btn title="Paragraph" wide onMouseDown={e => { e.preventDefault(); applyBlock('p'); }}>
          <span style={{ fontSize: 9, letterSpacing: 0.2 }}>P</span>
        </Btn>

        <Divider />

        <Btn title="Bullet list" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <circle cx="2" cy="4" r="1.4" fill="currentColor"/>
            <circle cx="2" cy="8" r="1.4" fill="currentColor"/>
            <circle cx="2" cy="12" r="1.4" fill="currentColor"/>
            <rect x="5" y="3" width="10" height="1.8" rx="0.9" fill="currentColor"/>
            <rect x="5" y="7" width="10" height="1.8" rx="0.9" fill="currentColor"/>
            <rect x="5" y="11" width="10" height="1.8" rx="0.9" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Numbered list" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <text x="0" y="5" fontSize="5" fill="currentColor">1.</text>
            <text x="0" y="9.5" fontSize="5" fill="currentColor">2.</text>
            <text x="0" y="14" fontSize="5" fill="currentColor">3.</text>
            <rect x="6" y="3" width="9" height="1.8" rx="0.9" fill="currentColor"/>
            <rect x="6" y="7.5" width="9" height="1.8" rx="0.9" fill="currentColor"/>
            <rect x="6" y="12" width="9" height="1.8" rx="0.9" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Indent" onMouseDown={e => { e.preventDefault(); exec('indent'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="4" y="6" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="4" y="10" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="14" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Outdent" onMouseDown={e => { e.preventDefault(); exec('outdent'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="6" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="10" width="12" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="14" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>

        <Divider />

        <Btn title="Align left" onMouseDown={e => { e.preventDefault(); exec('justifyLeft'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="6" width="10" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="10" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="14" width="8" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Align center" onMouseDown={e => { e.preventDefault(); exec('justifyCenter'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="3" y="6" width="10" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="1" y="10" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="4" y="14" width="8" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Align right" onMouseDown={e => { e.preventDefault(); exec('justifyRight'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="6" y="6" width="10" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="2" y="10" width="14" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="8" y="14" width="8" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Justify" onMouseDown={e => { e.preventDefault(); exec('justifyFull'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="2" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="6" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="10" width="16" height="1.5" rx="0.75" fill="currentColor"/>
            <rect x="0" y="14" width="10" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>

        <Divider />

        <Btn title="Blockquote" wide onMouseDown={e => { e.preventDefault(); applyBlock('blockquote'); }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>"</span>
        </Btn>
        <Btn title="Code block" wide onMouseDown={e => { e.preventDefault(); applyBlock('pre'); }}>
          <span style={{ fontSize: 9, fontFamily: 'monospace', letterSpacing: 0 }}>{`</>`}</span>
        </Btn>

        <Divider />

        <Btn title="Smaller text" onMouseDown={e => { e.preventDefault(); exec('fontSize', '2'); }}>
          <span style={{ fontSize: 9 }}>A</span>
        </Btn>
        <Btn title="Normal text" onMouseDown={e => { e.preventDefault(); exec('fontSize', '3'); }}>
          <span style={{ fontSize: 11 }}>A</span>
        </Btn>
        <Btn title="Larger text" onMouseDown={e => { e.preventDefault(); exec('fontSize', '5'); }}>
          <span style={{ fontSize: 14 }}>A</span>
        </Btn>

        <Divider />

        <Btn title="Horizontal rule" onMouseDown={e => { e.preventDefault(); insertHR(); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="0" y="7" width="16" height="1.5" rx="0.75" fill="currentColor"/>
          </svg>
        </Btn>
        <Btn title="Remove formatting" onMouseDown={e => { e.preventDefault(); exec('removeFormat'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </Btn>
        <Btn title="Undo" onMouseDown={e => { e.preventDefault(); exec('undo'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M3 7 C3 4 6 2 9 2 C12 2 14 4 14 7 C14 10 12 12 9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M3 7 L1 4.5 M3 7 L5.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Btn>
        <Btn title="Redo" onMouseDown={e => { e.preventDefault(); exec('redo'); }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M13 7 C13 4 10 2 7 2 C4 2 2 4 2 7 C2 10 4 12 7 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
            <path d="M13 7 L15 4.5 M13 7 L10.5 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Btn>
      </div>
    </div>
  );
}

// ── Book editor (chapters / sections / rich text) ───────────────────────────
function BookEditor({ book, onUpdate, onBack }) {
  const isMobile = useIsMobile();
  const accent = ACCENT;

  const [projectTitle, setProjectTitle] = useState(book.title);
  const [tags, setTags] = useState(book.tags);
  const [chapters, setChapters] = useState(book.chapters);
  const [activeChapterId, setActiveChapterId] = useState(book.chapters[0]?.id || null);
  const [activeSubId, setActiveSubId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [editingTitleId, setEditingTitleId] = useState(null);
  const [editingTitleVal, setEditingTitleVal] = useState("");
  const [expandedIds, setExpandedIds] = useState(() => {
    const m = {};
    book.chapters.forEach(c => { m[c.id] = true; });
    return m;
  });
  const [readMode, setReadMode] = useState(true);
  const [editingProjectTitle, setEditingProjectTitle] = useState(false);
  const [projectTitleVal, setProjectTitleVal] = useState(book.title);
  const [addingTag, setAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const editorRef = useRef(null);
  const saveTimer = useRef(null);
  const firstRun = useRef(true);

  // ── Push changes up to the library (debounced) ──
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      onUpdate({ title: projectTitle, tags, chapters });
    }, 400);
    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTitle, tags, chapters]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);

  const activeChapter = chapters.find(c => c.id === activeChapterId);
  const activeSub = activeSubId ? activeChapter?.subs.find(s => s.id === activeSubId) : null;
  const activeContent = activeSub ? activeSub.content : (activeChapter?.content || "");
  const activeTitle = activeSub ? activeSub.title : (activeChapter?.title || "");

  // Only set innerHTML on mount/chapter-switch, never on re-render (avoids backwards typing)
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = activeContent;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterId, activeSubId]);

  useEffect(() => {
    if (!readMode) editorRef.current?.focus();
  }, [activeChapterId, activeSubId, readMode]);

  const handleSelectionChange = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setToolbarVisible(false);
      return;
    }
    const range = sel.getRangeAt(0);
    if (!editorRef.current?.contains(range.commonAncestorContainer)) {
      setToolbarVisible(false);
      return;
    }
    const rect = range.getBoundingClientRect();
    setToolbarPos({
      top: rect.top + window.scrollY - 44,
      left: rect.left + window.scrollX + rect.width / 2,
    });
    setToolbarVisible(true);
  };

  useEffect(() => {
    const dismiss = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setToolbarVisible(false);
    };
    document.addEventListener('mousedown', dismiss);
    return () => document.removeEventListener('mousedown', dismiss);
  }, []);

  const totalWords = wordsInChapters(chapters);
  const progress = Math.min(100, Math.round((totalWords / WORD_GOAL) * 100));
  const readTime = Math.max(1, Math.ceil(totalWords / 200));

  // ── Chapter mutations ──
  const addChapter = () => {
    const id = generateId();
    const ch = { id, title: `Chapter ${chapters.length + 1}`, description: "", content: "", subs: [] };
    setChapters(p => [...p, ch]);
    setActiveChapterId(id);
    setActiveSubId(null);
    setExpandedIds(p => ({ ...p, [id]: true }));
  };

  const addSub = (chId) => {
    const id = generateId();
    setChapters(p => p.map(ch => ch.id === chId
      ? { ...ch, subs: [...ch.subs, { id, title: `Section ${ch.subs.length + 1}`, content: "" }] }
      : ch
    ));
    setActiveChapterId(chId);
    setActiveSubId(id);
    setExpandedIds(p => ({ ...p, [chId]: true }));
  };

  const deleteChapter = (chId) => {
    setChapters(p => {
      const next = p.filter(c => c.id !== chId);
      if (next.length === 0) {
        const fallback = { id: generateId(), title: "Chapter 1", description: "", content: "", subs: [] };
        setActiveChapterId(fallback.id);
        setActiveSubId(null);
        return [fallback];
      }
      if (activeChapterId === chId) {
        setActiveChapterId(next[0].id);
        setActiveSubId(null);
      }
      return next;
    });
  };

  const deleteSub = (chId, subId) => {
    setChapters(p => p.map(ch => ch.id === chId
      ? { ...ch, subs: ch.subs.filter(s => s.id !== subId) }
      : ch
    ));
    if (activeSubId === subId) setActiveSubId(null);
  };

  const moveChapter = (chId, dir) => {
    setChapters(p => {
      const idx = p.findIndex(c => c.id === chId);
      if (idx < 0) return p;
      const next = [...p];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return p;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const updateContent = (val) => {
    setChapters(p => p.map(ch => {
      if (activeSubId) {
        if (ch.id !== activeChapterId) return ch;
        return { ...ch, subs: ch.subs.map(s => s.id === activeSubId ? { ...s, content: val } : s) };
      }
      return ch.id === activeChapterId ? { ...ch, content: val } : ch;
    }));
  };

  const updateDescription = (val) => {
    setChapters(p => p.map(ch => ch.id === activeChapterId ? { ...ch, description: val } : ch));
  };

  const startRename = (id, current) => { setEditingTitleId(id); setEditingTitleVal(current); };
  const commitRename = (chId, subId) => {
    const val = editingTitleVal.trim() || (subId ? "Untitled Section" : "Untitled Chapter");
    setChapters(p => p.map(ch => {
      if (subId) {
        if (ch.id !== chId) return ch;
        return { ...ch, subs: ch.subs.map(s => s.id === subId ? { ...s, title: val } : s) };
      }
      return ch.id === chId ? { ...ch, title: val } : ch;
    }));
    setEditingTitleId(null);
  };

  const commitProjectTitle = () => {
    setProjectTitle(projectTitleVal.trim() || "Untitled Book");
    setEditingProjectTitle(false);
  };

  const addTag = () => {
    const val = newTag.trim();
    if (val && !tags.includes(val)) setTags(p => [...p, val]);
    setNewTag("");
    setAddingTag(false);
  };

  const removeTag = (t) => setTags(p => p.filter(x => x !== t));

  const activeWordCount = activeContent ? stripHtml(activeContent).split(/\s+/).filter(Boolean).length : 0;

  const Sidebar = () => (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"#07090b" }}>
      <div style={{ padding:"14px 14px 10px", borderBottom:"1px solid #111", flexShrink:0 }}>
        <div style={{ fontSize:9, color:accent+"88", letterSpacing:1.2, textTransform:"uppercase", marginBottom:5 }}>
          § Documentation
        </div>
        {editingProjectTitle ? (
          <input
            autoFocus
            value={projectTitleVal}
            onChange={e => setProjectTitleVal(e.target.value)}
            onBlur={commitProjectTitle}
            onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") commitProjectTitle(); }}
            style={{ width:"100%", background:"transparent", border:"none", outline:`1px solid ${accent}44`, color:"#aaa", fontSize:12, fontWeight:700, padding:"1px 4px", fontFamily:"inherit", marginBottom:8 }}
          />
        ) : (
          <div
            style={{ fontSize:12, fontWeight:700, color:"#aaa", lineHeight:1.4, marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"pointer" }}
            onDoubleClick={() => { setEditingProjectTitle(true); setProjectTitleVal(projectTitle); }}
            title="Double-click to rename"
          >
            {projectTitle}
          </div>
        )}
        <div style={{ height:2, background:"#111", borderRadius:1, overflow:"hidden", marginBottom:4 }}>
          <div style={{ width:`${progress}%`, height:"100%", background:accent, transition:"width 0.3s" }}/>
        </div>
        <div style={{ fontSize:9, color:"#333", display:"flex", justifyContent:"space-between" }}>
          <span>{totalWords}w · ~{readTime}m read</span>
          <span style={{ color: progress>=100 ? accent : "#333" }}>{progress}%</span>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"8px 0" }}>
        <div style={{ padding:"6px 14px 4px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:9, color:"#2a2a2a", letterSpacing:1.1, textTransform:"uppercase" }}>Chapters</span>
        </div>

        {chapters.map((ch, ci) => {
          const chActive = activeChapterId === ch.id && !activeSubId;
          const expanded = expandedIds[ch.id];
          return (
            <div key={ch.id}>
              <div style={{ display:"flex", alignItems:"center", gap:0, padding:"0 8px 0 10px", cursor:"pointer", userSelect:"none",
                borderLeft:`2px solid ${chActive ? accent : "transparent"}`,
                background: chActive ? accent+"0d" : "transparent", transition:"all 0.12s", minHeight:36 }}>
                <div onClick={() => setExpandedIds(p => ({...p, [ch.id]: !p[ch.id]}))}
                  style={{ width:18, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#2a2a2a", fontSize:9 }}>
                  {ch.subs.length > 0 ? (
                    <svg width="9" height="9" viewBox="0 0 10 10" style={{ transform: expanded ? "rotate(90deg)" : "none", transition:"transform 0.15s" }}>
                      <path d="M3 2l4 3-4 3" stroke="#444" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : <span style={{width:9}}/>}
                </div>
                <span style={{ fontSize:9, color:accent+"44", width:18, flexShrink:0, fontWeight:700, textAlign:"center" }}>{ci+1}</span>
                <div style={{ flex:1, overflow:"hidden" }} onClick={() => { setActiveChapterId(ch.id); setActiveSubId(null); if(isMobile) setSidebarOpen(false); }}>
                  {editingTitleId === ch.id ? (
                    <input autoFocus value={editingTitleVal}
                      onChange={e => setEditingTitleVal(e.target.value)}
                      onBlur={() => commitRename(ch.id, null)}
                      onKeyDown={e => { if(e.key==="Enter"||e.key==="Escape") commitRename(ch.id, null); }}
                      onClick={e => e.stopPropagation()}
                      style={{ width:"100%", background:"transparent", border:"none", outline:`1px solid ${accent}44`, color:"#bbb", fontSize:11, padding:"1px 4px", fontFamily:"inherit" }}
                    />
                  ) : (
                    <span style={{ fontSize:11, fontWeight:chActive?600:400, color:chActive?accent:"#555",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block" }}
                      onDoubleClick={() => startRename(ch.id, ch.title)}
                    >{ch.title}</span>
                  )}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:2, flexShrink:0, opacity:0 }} className="ch-actions">
                  <div onClick={e=>{e.stopPropagation();addSub(ch.id);}} title="Add section"
                    style={{ width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", color:"#333", fontSize:11, cursor:"pointer" }}>+</div>
                  <div onClick={e=>{e.stopPropagation();moveChapter(ch.id,-1);}} title="Move up"
                    style={{ width:16, height:18, display:"flex", alignItems:"center", justifyContent:"center", color:"#333", fontSize:9, cursor:"pointer" }}>↑</div>
                  <div onClick={e=>{e.stopPropagation();moveChapter(ch.id,1);}} title="Move down"
                    style={{ width:16, height:18, display:"flex", alignItems:"center", justifyContent:"center", color:"#333", fontSize:9, cursor:"pointer" }}>↓</div>
                  {chapters.length > 1 && (
                    <div onClick={e=>{e.stopPropagation();deleteChapter(ch.id);}} title="Delete chapter"
                      style={{ width:18, height:18, display:"flex", alignItems:"center", justifyContent:"center", color:"#ef5350", fontSize:10, cursor:"pointer" }}>x</div>
                  )}
                </div>
              </div>

              {expanded && ch.subs.map((sub, si) => {
                const subActive = activeChapterId === ch.id && activeSubId === sub.id;
                return (
                  <div key={sub.id}
                    style={{ display:"flex", alignItems:"center", gap:0, padding:"0 8px 0 30px", minHeight:30,
                      cursor:"pointer", userSelect:"none",
                      borderLeft:`2px solid ${subActive ? accent+"88" : "transparent"}`,
                      background: subActive ? accent+"08" : "transparent", transition:"all 0.12s" }}
                    onClick={() => { setActiveChapterId(ch.id); setActiveSubId(sub.id); if(isMobile) setSidebarOpen(false); }}
                  >
                    <span style={{ fontSize:8, color:"#2a2a2a", width:28, flexShrink:0 }}>{ci+1}.{si+1}</span>
                    {editingTitleId === sub.id ? (
                      <input autoFocus value={editingTitleVal}
                        onChange={e => setEditingTitleVal(e.target.value)}
                        onBlur={() => commitRename(ch.id, sub.id)}
                        onKeyDown={e => { if(e.key==="Enter"||e.key==="Escape") commitRename(ch.id, sub.id); }}
                        onClick={e => e.stopPropagation()}
                        style={{ flex:1, background:"transparent", border:"none", outline:`1px solid ${accent}44`, color:"#999", fontSize:10, padding:"1px 4px", fontFamily:"inherit" }}
                      />
                    ) : (
                      <span
                        style={{ flex:1, fontSize:10, color:subActive?accent+"cc":"#444", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}
                        onDoubleClick={e=>{e.stopPropagation(); startRename(sub.id, sub.title);}}
                      >{sub.title}</span>
                    )}
                    <div onClick={e=>{e.stopPropagation(); deleteSub(ch.id, sub.id);}}
                      style={{ width:16, height:20, display:"flex", alignItems:"center", justifyContent:"center", color:"#ef535033", fontSize:10, cursor:"pointer", flexShrink:0 }}>x</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ padding:"12px 14px", borderTop:"1px solid #0f0f0f", flexShrink:0 }}>
        <div style={{ fontSize:9, color:"#222", letterSpacing:1.1, textTransform:"uppercase", marginBottom:6 }}>Tags</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:4, alignItems:"center" }}>
          {tags.map(t => (
            <span key={t} className="tag-chip" style={{ fontSize:9, color:"#333", border:"1px solid #1a1a1a", padding:"2px 6px", display:"flex", alignItems:"center", gap:4 }}>
              #{t}
              <span onClick={() => removeTag(t)} style={{ cursor:"pointer", color:"#ef535055" }}>x</span>
            </span>
          ))}
          {addingTag ? (
            <input
              autoFocus
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onBlur={addTag}
              onKeyDown={e => { if (e.key === "Enter") addTag(); if (e.key === "Escape") { setNewTag(""); setAddingTag(false); } }}
              style={{ width:60, background:"transparent", border:"none", outline:`1px solid ${accent}44`, color:"#999", fontSize:9, padding:"2px 4px", fontFamily:"inherit" }}
            />
          ) : (
            <span onClick={() => setAddingTag(true)} style={{ fontSize:9, color:"#333", cursor:"pointer", padding:"2px 6px" }}>+ tag</span>
          )}
        </div>
      </div>

      <div style={{ padding:"10px 14px", borderTop:"1px solid #0f0f0f", flexShrink:0, display:"flex", flexDirection:"column", gap:6 }}>
        {activeChapter && (
          <div
            onClick={() => addSub(activeChapterId)}
            style={{ fontSize:9, color:"#333", cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:"5px 0", userSelect:"none", letterSpacing:0.4, transition:"color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = accent}
            onMouseLeave={e => e.currentTarget.style.color = '#333'}
          >
            <span style={{ color:accent+"55", fontSize:12, lineHeight:1 }}>+</span> Add section to chapter
          </div>
        )}
        <div
          onClick={addChapter}
          style={{ fontSize:9, color:"#333", cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:"5px 0", userSelect:"none", letterSpacing:0.4, transition:"color 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.color = accent}
          onMouseLeave={e => e.currentTarget.style.color = '#333'}
        >
          <span style={{ color:accent+"55", fontSize:12, lineHeight:1 }}>+</span> New chapter
        </div>
      </div>
    </div>
  );

  return (
    <>
      {!readMode && toolbarVisible && (
        <div
          ref={toolbarRef}
          className="floating-toolbar"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
          onMouseDown={e => e.preventDefault()}
        >
          {[
            { title:"Bold", icon:<b style={{fontSize:12,fontFamily:'serif'}}>B</b>, cmd:'bold' },
            { title:"Italic", icon:<i style={{fontSize:12,fontFamily:'serif'}}>I</i>, cmd:'italic' },
            { title:"Underline", icon:<u style={{fontSize:11}}>U</u>, cmd:'underline' },
            { title:"Strike", icon:<s style={{fontSize:11}}>S</s>, cmd:'strikeThrough' },
          ].map(({title,icon,cmd}) => (
            <button key={cmd} title={title} onClick={() => { document.execCommand(cmd,false,null); setToolbarVisible(false); }}>
              {icon}
            </button>
          ))}
          <div className="ft-div"/>
          {[
            { title:"H1", icon:<span style={{fontSize:9,fontWeight:700,letterSpacing:.3}}>H1</span>, tag:'h1' },
            { title:"H2", icon:<span style={{fontSize:9,fontWeight:600,letterSpacing:.3}}>H2</span>, tag:'h2' },
            { title:"P",  icon:<span style={{fontSize:10}}>P</span>, tag:'p' },
          ].map(({title,icon,tag}) => (
            <button key={tag} title={title} onClick={() => { document.execCommand('formatBlock',false,tag); setToolbarVisible(false); }}>
              {icon}
            </button>
          ))}
          <div className="ft-div"/>
          <button title="Quote" onClick={() => { document.execCommand('formatBlock',false,'blockquote'); setToolbarVisible(false); }}>
            <span style={{fontSize:13,lineHeight:1}}>"</span>
          </button>
          <button title="Remove formatting" onClick={() => { document.execCommand('removeFormat'); setToolbarVisible(false); }}>
            <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M3 13L13 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}
      <div style={{
        height:"100vh", width:"100%",
        background:"#06080a",
        display:"flex", flexDirection:"column",
        fontFamily:"'Courier New', Courier, monospace",
      }}>
        <style>{`
          .doc-content-area::-webkit-scrollbar { width:3px; }
          .doc-content-area::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:2px; }
          .doc-sidebar-scroll::-webkit-scrollbar { width:2px; }
          .doc-sidebar-scroll::-webkit-scrollbar-thumb { background:#111; }
          .doc-editor-div::-webkit-scrollbar { display:none; }
          .doc-editor-div:empty:before { content: attr(data-placeholder); color: #252525; pointer-events:none; display:block; font-style: italic; }
          .doc-editor-div:focus { outline:none; }
          .doc-editor-div p { margin: 0 0 1.1em; }
          .doc-editor-div h1 { font-size: 26px; font-weight: 700; color: #d4d4d8; margin: 2em 0 0.5em; letter-spacing: -0.4px; line-height: 1.2; font-family: Georgia, 'Times New Roman', serif; }
          .doc-editor-div h2 { font-size: 20px; font-weight: 600; color: #aaa; margin: 1.8em 0 0.4em; line-height: 1.3; font-family: Georgia, 'Times New Roman', serif; }
          .doc-editor-div h3 { font-size: 16px; font-weight: 600; color: #888; margin: 1.5em 0 0.35em; line-height: 1.35; font-family: Georgia, 'Times New Roman', serif; }
          .doc-editor-div h4 { font-size: 13px; font-weight: 600; color: #666; margin: 1.3em 0 0.3em; text-transform: uppercase; letter-spacing: 1px; }
          .doc-editor-div ul { padding-left: 1.5em; margin: 0 0 1.1em; }
          .doc-editor-div ol { padding-left: 1.5em; margin: 0 0 1.1em; }
          .doc-editor-div li { margin-bottom: 0.3em; }
          .doc-editor-div strong { color: #c8c8cc; font-weight: 600; }
          .doc-editor-div em { color: #999; font-style: italic; }
          .doc-editor-div s { color: #3a3a3a; }
          .doc-editor-div code { background:#0d0f11; border:1px solid #1a1a1a; padding:1px 5px; color:#7a9a7a; font-size:0.9em; }
          .doc-editor-div blockquote { border-left: 2px solid #222; margin: 1.5em 0; padding: 4px 20px; color: #666; font-style: italic; }
          .doc-editor-div pre { background: #0d0f11; border: 1px solid #1a1a1a; padding: 14px 18px; margin: 1.2em 0; font-size: 12px; color: #7a9a7a; overflow-x: auto; font-family: 'Courier New', monospace; border-radius: 2px; }
          .floating-toolbar { position:fixed; display:flex; align-items:center; gap:1px; background:#111; border:1px solid #222; padding:3px 4px; pointer-events:all; transform:translateX(-50%); z-index:99999; box-shadow: 0 4px 20px rgba(0,0,0,0.7); }
          .floating-toolbar button { background:transparent; border:none; color:#666; width:26px; height:24px; cursor:pointer; display:flex; align-items:center; justify-content:center; font-family:'Courier New',monospace; transition:color 0.1s,background 0.1s; border-radius:1px; }
          .floating-toolbar button:hover { color:#ccc; background:#1a1a1a; }
          .floating-toolbar .ft-div { width:1px; height:14px; background:#222; margin:0 2px; flex-shrink:0; }
          .doc-mobile-overlay { animation:sideSlide 0.22s ease; }
          @keyframes sideSlide { from { transform:translateX(-100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
          div:hover > .ch-actions { opacity:1 !important; }
          .tag-chip:hover span:last-child { color:#ef5350 !important; }
          .back-btn { transition: color 0.12s, border-color 0.12s; }
          .back-btn:hover { color: ${accent} !important; border-color: ${accent}55 !important; }
        `}</style>

        {/* ── TOP BAR ── */}
        <div style={{ display:"flex", alignItems:"center", height:44, borderBottom:"1px solid #111", background:"#07090b", flexShrink:0, zIndex:3 }}>
          <div
            className="back-btn"
            onClick={onBack}
            title="Back to library"
            style={{ width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer", borderRight:"1px solid #111", flexShrink:0, color:"#555" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>

          <div onClick={() => setSidebarOpen(s=>!s)}
            style={{ width:44, height:44, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, cursor:"pointer", borderRight:"1px solid #111", flexShrink:0 }}>
            <div style={{ width:16, height:1.5, background:sidebarOpen?accent:"#444", transition:"all 0.2s", transform:sidebarOpen?"rotate(45deg) translate(2px, 4px)":"none" }}/>
            <div style={{ width:16, height:1.5, background:"#444", opacity:sidebarOpen?0:1, transition:"opacity 0.15s" }}/>
            <div style={{ width:16, height:1.5, background:sidebarOpen?accent:"#444", transition:"all 0.2s", transform:sidebarOpen?"rotate(-45deg) translate(2px, -4px)":"none" }}/>
          </div>

          <div style={{ flex:1, display:"flex", alignItems:"center", gap:6, padding:"0 12px", overflow:"hidden" }}>
            <span style={{ fontSize:11, color:accent, fontWeight:700, flexShrink:0 }}>§</span>
            <span style={{ fontSize:11, color:"#333", flexShrink:0 }}>{projectTitle}</span>
            {activeChapter && (<>
              <span style={{ fontSize:11, color:"#1e1e1e", flexShrink:0 }}>/</span>
              <span style={{ fontSize:11, color:"#666", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activeChapter.title}</span>
            </>)}
            {activeSub && (<>
              <span style={{ fontSize:11, color:"#1e1e1e", flexShrink:0 }}>/</span>
              <span style={{ fontSize:11, color:"#444", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{activeSub.title}</span>
            </>)}
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 12px", borderLeft:"1px solid #111", flexShrink:0 }}>
            <span style={{ fontSize:9, color:"#2a2a2a" }}>{activeWordCount}w</span>
            <div
              onClick={() => setReadMode(r => !r)}
              style={{ fontSize:9, color:"#555", cursor:"pointer", padding:"3px 10px", border:"1px solid #1e1e1e", userSelect:"none", letterSpacing:0.5, transition:"color 0.15s, border-color 0.15s", display:"flex", alignItems:"center", gap:5 }}
              onMouseEnter={e => { e.currentTarget.style.color = accent; e.currentTarget.style.borderColor = accent + '55'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
            >
              {readMode ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                  Read
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div style={{ flex:1, display:"flex", overflow:"hidden", position:"relative" }}>

          {!isMobile && sidebarOpen && (
            <div className="doc-sidebar-scroll" style={{ width:220, flexShrink:0, borderRight:"1px solid #111", overflowY:"auto", display:"flex", flexDirection:"column" }}>
              <Sidebar/>
            </div>
          )}

          {isMobile && sidebarOpen && (
            <div style={{ position:"absolute", inset:0, zIndex:20, display:"flex" }}>
              <div className="doc-mobile-overlay" style={{ width:"80%", maxWidth:280, background:"#07090b", borderRight:`1px solid ${accent}22`, overflowY:"auto", display:"flex", flexDirection:"column", height:"100%" }}>
                <Sidebar/>
              </div>
              <div onClick={() => setSidebarOpen(false)} style={{ flex:1, background:"rgba(0,0,0,0.65)" }}/>
            </div>
          )}

          <div className="doc-content-area" style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
            {activeChapter ? (
              <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>

                <div style={{ flex:1, overflowY:"auto", padding: isMobile ? "20px 18px 24px" : "32px 40px 32px", maxWidth:760, width:"100%", boxSizing:"border-box" }}>

                <div style={{ marginBottom:24, paddingBottom:16, borderBottom:`1px solid #0f0f0f` }}>
                  <div style={{ fontSize:9, color:accent+"55", letterSpacing:1.4, textTransform:"uppercase", marginBottom:8 }}>
                    {activeSub
                      ? `Ch. ${chapters.indexOf(activeChapter)+1} · Section ${activeChapter.subs.indexOf(activeSub)+1}`
                      : `Chapter ${chapters.indexOf(activeChapter)+1}`}
                  </div>
                  <input
                    value={activeTitle}
                    readOnly={readMode}
                    onChange={e => {
                      if (readMode) return;
                      const val = e.target.value;
                      setChapters(p => p.map(ch => {
                        if (activeSub) {
                          if (ch.id !== activeChapterId) return ch;
                          return { ...ch, subs: ch.subs.map(s => s.id === activeSubId ? { ...s, title: val } : s) };
                        }
                        return ch.id === activeChapterId ? { ...ch, title: val } : ch;
                      }));
                    }}
                    style={{
                      width:"100%", background:"transparent", border:"none", outline:"none",
                      color:"#d4d4d8", fontSize: isMobile ? 18 : 22, fontWeight:700,
                      letterSpacing:-0.5, lineHeight:1.2, fontFamily:"inherit",
                      caretColor: readMode ? "transparent" : accent, boxSizing:"border-box",
                      cursor: readMode ? "default" : "text",
                    }}
                  />
                  {!activeSub && (
                    <input
                      value={activeChapter.description || ""}
                      readOnly={readMode}
                      placeholder={readMode ? "" : "Add a short intro for this chapter (optional)"}
                      onChange={e => { if (!readMode) updateDescription(e.target.value); }}
                      style={{
                        width:"100%", background:"transparent", border:"none", outline:"none",
                        fontSize:12, color:"#3a3a3a", marginTop:8, fontStyle:"italic", lineHeight:1.6,
                        fontFamily:"inherit", cursor: readMode ? "default" : "text",
                      }}
                    />
                  )}
                </div>

                <div style={{ flex:1, position:"relative", marginTop:8 }}>
                  <div
                    ref={editorRef}
                    className="doc-editor-div"
                    contentEditable={!readMode}
                    suppressContentEditableWarning
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    data-placeholder={activeSub
                      ? `Write the content of "${activeTitle}" here…`
                      : `Begin writing…`}
                    onInput={() => {
                      if (editorRef.current && !readMode) updateContent(editorRef.current.innerHTML);
                    }}
                    onMouseUp={handleSelectionChange}
                    onKeyUp={handleSelectionChange}
                    onDoubleClick={() => { if (readMode) setReadMode(false); }}
                    style={{
                      minHeight: isMobile ? 300 : 460,
                      color:"#b0b0b4",
                      fontSize: isMobile ? 13 : 14,
                      lineHeight: 1.9,
                      fontFamily:"Georgia, 'Times New Roman', serif",
                      padding: isMobile ? "4px 0 40px" : "4px 0 60px",
                      boxSizing:"border-box",
                      caretColor: readMode ? "transparent" : accent,
                      WebkitTapHighlightColor:"transparent",
                      cursor: readMode ? "default" : "text",
                      userSelect: "text",
                    }}
                  />
                  {readMode && (
                    <div style={{
                      position:"absolute", bottom:8, right:0,
                      fontSize:9, color:"#222", letterSpacing:0.8,
                      pointerEvents:"none", userSelect:"none",
                    }}>double-click to edit</div>
                  )}
                </div>

                </div>

                {!readMode && (
                  <div style={{ flexShrink:0 }}>
                    <FormattingToolbar
                      editorRef={editorRef}
                      accent={accent}
                      onUpdate={updateContent}
                    />
                  </div>
                )}

              </div>
            ) : (
              <div style={{ textAlign:"center", padding:"80px 24px", color:"#222" }}>
                <div style={{ fontSize:32, marginBottom:12 }}>§</div>
                <div style={{ fontSize:13, fontStyle:"italic" }}>No chapters yet</div>
                <div onClick={addChapter} style={{ marginTop:20, fontSize:11, color:accent, border:`1px solid ${accent}44`, padding:"8px 20px", cursor:"pointer", display:"inline-block" }}>
                  + Add first chapter
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── BookFormModal (bottom sheet, new/edit) ──────────────────────────────────
// ── Type picker (choose content type before creating) ──────────────────────
function TypePickerModal({ onClose, onChoose, accent }) {
  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9998, animation:"overlayFade 0.2s ease" }} />
      <div style={{
        position:"fixed", left:0, right:0, bottom:0, top:"auto", maxWidth:420, margin:"0 auto", width:"100%",
        background:"#07090b", border:"1px solid #1a1a1a", borderBottom:"none",
        zIndex:9999, padding:20, display:"flex", flexDirection:"column", gap:14,
        animation:"sheetUp 0.25s cubic-bezier(0.32,0.72,0,1)", boxSizing:"border-box",
      }}>
        <div style={{ display:"flex", justifyContent:"center", marginTop:-6, marginBottom:-4 }}>
          <div style={{ width:36, height:3, background:"#1e1e1e" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#d4d4d8" }}>New…</div>
          <div onClick={onClose} style={{ fontSize:18, color:"#555", cursor:"pointer", lineHeight:1, padding:"0 4px" }}>×</div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {CONTENT_TYPES.map(t => (
            <div key={t.id} onClick={() => onChoose(t.id)}
              style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", cursor:"pointer",
                border:"1px solid #1e1e1e", background:"#0d0f11", transition:"border-color 0.12s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accent + "77"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e1e"; }}
            >
              <div style={{ width:32, height:32, flexShrink:0, display:"flex", alignItems:"center",
                justifyContent:"center", background:accent+"0d", border:`1px solid ${accent}22` }}>
                <span style={{ fontSize:14, color:accent, lineHeight:1 }}>{t.symbol}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:600, color:"#d4d4d8" }}>{t.label}</div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0, marginLeft:"auto" }}>
                <path d="M9 18l6-6-6-6" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BookFormModal({ onClose, onSave, editBook, contentType, saving, accent }) {
  const isEdit = !!editBook;
  const type = typeInfo(contentType);
  const [form, setForm] = useState(isEdit ? {
    title: editBook.title,
    tags:  (editBook.tags || []).join(", "),
  } : { title:"", tags:"" });
  const [error, setError] = useState("");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit() {
    if (!form.title.trim()) { setError("Title is required"); return; }
    await onSave({
      title: form.title.trim(),
      tags:  form.tags.split(",").map(t => t.trim()).filter(Boolean),
      type:  contentType,
    });
  }

  const inputSt = {
    width:"100%", boxSizing:"border-box",
    background:"#0d0f11", border:"1px solid #1e1e1e",
    color:"#d4d4d8", fontSize:13, padding:"9px 11px",
    outline:"none", fontFamily:"inherit",
  };
  const labelSt = {
    fontSize:9, color:"#444", letterSpacing:1, textTransform:"uppercase",
    marginBottom:6, display:"block",
  };

  return (
    <>
      <div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", zIndex:9998, animation:"overlayFade 0.2s ease" }} />
      <div style={{
        position:"fixed", left:0, right:0, bottom:0, top:"auto", maxWidth:420, margin:"0 auto", width:"100%",
        background:"#07090b", border:"1px solid #1a1a1a", borderBottom:"none",
        zIndex:9999, padding:20, display:"flex", flexDirection:"column", gap:16,
        animation:"sheetUp 0.25s cubic-bezier(0.32,0.72,0,1)", boxSizing:"border-box",
      }}>
        <div style={{ display:"flex", justifyContent:"center", marginTop:-6, marginBottom:-4 }}>
          <div style={{ width:36, height:3, background:"#1e1e1e" }} />
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"#d4d4d8" }}>{isEdit ? `Edit ${type.label}` : `New ${type.label}`}</div>
          <div onClick={onClose} style={{ fontSize:18, color:"#555", cursor:"pointer", lineHeight:1, padding:"0 4px" }}>×</div>
        </div>

        <div>
          <label style={labelSt}>Title *</label>
          <input autoFocus value={form.title}
            onChange={e => { set("title", e.target.value); setError(""); }}
            placeholder={`${type.label} title…`} style={inputSt} />
          {error && <div style={{ fontSize:11, color:"#ef5350", marginTop:4 }}>{error}</div>}
        </div>

        <div>
          <label style={labelSt}>Tags (comma-separated)</label>
          <input value={form.tags} onChange={e => set("tags", e.target.value)}
            placeholder="e.g. v1, internal" style={inputSt} />
        </div>

        <div style={{ display:"flex", gap:10, marginTop:4 }}>
          <div onClick={onClose} style={{
            flex:1, padding:"11px 0", textAlign:"center",
            border:"1px solid #1e1e1e", color:"#555", fontSize:12, cursor:"pointer", userSelect:"none",
          }}>Cancel</div>
          <div onClick={saving ? undefined : handleSubmit} style={{
            flex:2, padding:"11px 0", textAlign:"center",
            background: saving ? "#141414" : accent,
            color: saving ? "#444" : "#04150c", fontSize:12,
            fontWeight:700, cursor: saving ? "default" : "pointer", userSelect:"none",
            letterSpacing:0.3, transition:"background 0.15s",
          }}>
            {saving ? "Saving…" : isEdit ? "Save Changes" : `Create ${type.label}`}
          </div>
        </div>
      </div>
    </>
  );
}

// ── SwipeableRow (swipe-to-reveal edit/delete) ──────────────────────────────
function SwipeableRow({ book, onEdit, onDelete, accent, children }) {
  const ACTION_W  = 140;
  const SNAP_AT   = ACTION_W * 0.4;
  const startX    = useRef(null);
  const startY    = useRef(null);
  const dragging  = useRef(false);
  const locked    = useRef(false);
  const [offset,  setOffset]  = useState(0);
  const [isOpen,  setIsOpen]  = useState(false);
  const [animate, setAnimate] = useState(true);

  const open  = () => { setAnimate(true); setOffset(ACTION_W); setIsOpen(true); };
  const close = () => { setAnimate(true); setOffset(0);        setIsOpen(false); };

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    dragging.current = true; locked.current = false;
    setAnimate(false);
  }
  function onTouchMove(e) {
    if (!dragging.current) return;
    const dx = startX.current - e.touches[0].clientX;
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (!locked.current) {
      if (dy > Math.abs(dx) + 4) { dragging.current = false; setAnimate(true); return; }
      if (Math.abs(dx) > 6) locked.current = true;
    }
    if (!locked.current) return;
    e.preventDefault();
    const base = isOpen ? ACTION_W : 0;
    const raw  = base + dx;
    if (raw <= 0)            setOffset(Math.max(raw * 0.15, -12));
    else if (raw > ACTION_W) setOffset(ACTION_W + (raw - ACTION_W) * 0.15);
    else                     setOffset(raw);
  }
  function onTouchEnd() {
    if (!dragging.current) return;
    dragging.current = false; setAnimate(true);
    if (offset >= SNAP_AT) open(); else close();
  }

  const ActionBtn = ({ onClick, bg, border, color, icon, label }) => (
    <div onClick={onClick} style={{
      flex:1, display:"flex", flexDirection:"column", alignItems:"center",
      justifyContent:"center", gap:5, background:bg,
      borderLeft:`1px solid ${border}`, cursor:"pointer", userSelect:"none",
      transition:"filter 0.12s",
    }}
      onMouseDown={e => e.currentTarget.style.filter = "brightness(1.4)"}
      onMouseUp={e => e.currentTarget.style.filter = "none"}
      onTouchStart={e => e.currentTarget.style.filter = "brightness(1.4)"}
      onTouchEnd={e => e.currentTarget.style.filter = "none"}
    >
      {icon}
      <span style={{ fontSize:9, color, letterSpacing:0.8, fontWeight:600 }}>{label}</span>
    </div>
  );

  return (
    <div style={{ position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", top:0, right:0, bottom:0, width:ACTION_W, display:"flex" }}>
        <ActionBtn
          onClick={e => { e.stopPropagation(); close(); setTimeout(() => onEdit(book), 180); }}
          bg={accent+"14"} border={accent+"22"} color={accent} label="Edit"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>}
        />
        <ActionBtn
          onClick={e => { e.stopPropagation(); close(); setTimeout(() => onDelete(book.id), 180); }}
          bg="#2a0d0d" border="#ef535022" color="#ef5350" label="Delete"
          icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef5350" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>}
        />
      </div>
      <div
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}
        onClick={isOpen ? e => { e.stopPropagation(); close(); } : undefined}
        style={{
          transform:`translateX(-${offset}px)`,
          transition: animate ? "transform 0.28s cubic-bezier(0.25,1,0.5,1)" : "none",
          willChange:"transform",
          boxShadow: isOpen ? "none" : "inset -3px 0 0 #ffffff08",
        }}
      >{children}</div>
    </div>
  );
}

// ── Home (library) screen ───────────────────────────────────────────────────
function Home({ books, accent, onOpen, onCreateBook, onUpdateBookMeta, onDeleteBook }) {
  const [search,      setSearch]      = useState("");
  const [pickerOpen,  setPickerOpen]  = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [editBook,    setEditBook]    = useState(null);
  const [newType,     setNewType]     = useState("book");
  const [saving,      setSaving]      = useState(false);

  const openTypePicker = () => setPickerOpen(true);
  const chooseType     = (t) => { setNewType(t); setPickerOpen(false); setEditBook(null); setAddOpen(true); };
  const closeAddModal  = () => { setAddOpen(false); setEditBook(null); };

  async function handleSave(formData) {
    setSaving(true);
    try {
      if (editBook) onUpdateBookMeta(editBook.id, formData);
      else onCreateBook(formData);
      closeAddModal();
    } finally {
      setSaving(false);
    }
  }

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    return !q || (b.title + " " + b.tags.join(" ")).toLowerCase().includes(q);
  });

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100vh", background:"#06080a",
      color:"#d4d4d8", fontFamily:"'Courier New', Courier, monospace", overflow:"hidden", position:"relative" }}>
      <style>{`
        .book-row:active { background:#0d0f11 !important; }
        @keyframes booksFade    { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes overlayFade  { from{opacity:0} to{opacity:1} }
        @keyframes sheetUp      { from{transform:translateY(100%)} to{transform:translateY(0)} }
        .hdr-btn:hover { border-color:${accent}55 !important; color:${accent} !important; }
      `}</style>

      {/* Header */}
      <div style={{ flexShrink:0, padding:"16px 20px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, background:"#0d0f11",
          border:"1px solid #1e1e1e", padding:"8px 12px", marginBottom:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search books or tags…"
            style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"#bbb", fontSize:12, fontFamily:"inherit" }}/>
          {search && <div onClick={()=>setSearch("")} style={{ fontSize:15, color:"#333", cursor:"pointer", lineHeight:1 }}>×</div>}
        </div>

      </div>

      {/* Book list */}
      <div style={{ flex:1, overflowY:"auto" }}>

        {/* Empty */}
        {filtered.length === 0 && (
          <div style={{ textAlign:"center", padding:"60px 24px", color:"#222" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>§</div>
            <div style={{ fontSize:13, fontStyle:"italic" }}>
              {books.length === 0 ? "No books yet" : "No books match this view"}
            </div>
            {books.length === 0 && (
              <div onClick={openTypePicker} style={{ marginTop:20, fontSize:11, color:accent, border:`1px solid ${accent}44`, padding:"8px 20px", cursor:"pointer", display:"inline-block" }}>
                + Create your first book
              </div>
            )}
          </div>
        )}

        {/* Books (flat list, no section grouping) */}
        {filtered
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .map((book, i) => {
            const totalWords = wordsInChapters(book.chapters);
            const progress = Math.min(100, Math.round((totalWords / WORD_GOAL) * 100));
            const chapterCount = book.chapters.length;
            const sectionCount = book.chapters.reduce((a, c) => a + (c.subs?.length || 0), 0);
            const type = typeInfo(book.type);

            const rowContent = (
              <div className="book-row" onClick={()=>onOpen(book.id)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", cursor:"pointer",
                  borderLeft:`3px solid ${accent}55`,
                  borderBottom:"1px solid #0a0a0a", background:"#06080a",
                  animation:`booksFade 0.15s ease ${Math.min(i,10)*0.03}s both`,
                }}>
                <div style={{ width:30, height:30, flexShrink:0, display:"flex", alignItems:"center",
                  justifyContent:"center", background:accent+"0d", border:`1px solid ${accent}22` }}>
                  <span style={{ fontSize:14, color:accent, lineHeight:1 }}>{type.symbol}</span>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"#d4d4d8", marginBottom:2,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {book.title}
                  </div>
                  <div style={{ fontSize:10, color:"#444" }}>
                    {type.label} · {chapterCount} chapter{chapterCount===1?"":"s"}{sectionCount > 0 ? ` · ${sectionCount} section${sectionCount===1?"":"s"}` : ""} · {relativeTime(book.updatedAt)}
                  </div>
                </div>

                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink:0 }}>
                  <path d="M9 18l6-6-6-6" stroke="#2a2a2a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            );

            return (
              <SwipeableRow key={book.id} book={book} accent={accent}
                onEdit={b => { setEditBook(b); setAddOpen(true); }}
                onDelete={onDeleteBook}
              >
                {rowContent}
              </SwipeableRow>
            );
          })}
      </div>

      {/* Floating add button */}
      <div onClick={openTypePicker}
        style={{ position:"absolute", right:20, bottom:24, width:48, height:48, background:accent,
          display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer",
          boxShadow:"0 4px 14px #00000066", zIndex:5 }}>
        <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#04150c" strokeWidth="2.5" strokeLinecap="round"/></svg>
      </div>

      {/* Type picker sheet */}
      {pickerOpen && (
        <TypePickerModal
          onClose={() => setPickerOpen(false)}
          onChoose={chooseType}
          accent={accent}
        />
      )}

      {/* Add / Edit modal */}
      {addOpen && (
        <BookFormModal
          onClose={closeAddModal}
          onSave={handleSave}
          editBook={editBook}
          contentType={editBook ? editBook.type : newType}
          saving={saving}
          accent={accent}
        />
      )}
    </div>
  );
}

// ── Root app ─────────────────────────────────────────────────────────────────
export default function App() {
  const accent = ACCENT;
  const [loaded, setLoaded] = useState(false);
  const [books, setBooks] = useState([]);
  const [activeBookId, setActiveBookId] = useState(null);
  const saveTimer = useRef(null);
  const firstRun = useRef(true);

  // ── Load library ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await window.storage.get(LIBRARY_KEY, false);
        if (cancelled) return;
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          if (parsed && Array.isArray(parsed.books)) {
            setBooks(parsed.books);
            setLoaded(true);
            return;
          }
        }
        setBooks(seedLibrary());
      } catch (e) {
        setBooks(seedLibrary());
      }
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Persist library on change ──
  useEffect(() => {
    if (!loaded) return;
    if (firstRun.current) { firstRun.current = false; return; }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await window.storage.set(LIBRARY_KEY, JSON.stringify({ books }), false);
      } catch (e) {}
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [books, loaded]);

  const activeBook = books.find(b => b.id === activeBookId) || null;

  const createBook = (data) => {
    const now = Date.now();
    const book = {
      id: generateId('bk'),
      title: data.title,
      tags: data.tags,
      type: data.type || 'book',
      chapters: blankChapters(),
      createdAt: now,
      updatedAt: now,
    };
    setBooks(p => [...p, book]);
    return book;
  };

  const updateBookMeta = (id, partial) => {
    setBooks(p => p.map(b => b.id === id ? { ...b, ...partial, updatedAt: Date.now() } : b));
  };

  const updateActiveBook = (partial) => {
    setBooks(p => p.map(b => b.id === activeBookId ? { ...b, ...partial, updatedAt: Date.now() } : b));
  };

  const deleteBook = (id) => {
    setBooks(p => p.filter(b => b.id !== id));
    if (activeBookId === id) setActiveBookId(null);
  };

  if (!loaded) {
    return (
      <div style={{ height:"100vh", width:"100%", background:"#06080a", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:11, color:"#333", fontFamily:"'Courier New', Courier, monospace" }}>§ loading…</div>
      </div>
    );
  }

  if (activeBook) {
    return (
      <BookEditor
        key={activeBook.id}
        book={activeBook}
        onUpdate={updateActiveBook}
        onBack={() => setActiveBookId(null)}
      />
    );
  }

  return (
    <Home
      books={books}
      accent={accent}
      onOpen={setActiveBookId}
      onCreateBook={createBook}
      onUpdateBookMeta={updateBookMeta}
      onDeleteBook={deleteBook}
    />
  );
}
