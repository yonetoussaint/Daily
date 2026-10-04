import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { blankChapters, uid } from "./model";
import SyncGate from "../../data/SyncGate";
import useStore from "../../data/useStore";
import { docsStore } from "./storage";

const DocsContext = createContext(null);
export const useDocs = () => useContext(DocsContext);

const NONE = [];

/** Owns the library of books. Stored in Supabase (docs_books, docs_chapters, docs_sections); changes are saved shortly after and flushed on exit. */
export default function DocsProvider({ children }) {
  const [loaded, setBooks, status, reload] = useStore(docsStore);
  const books = loaded ?? NONE;
  const latest = useRef(books);
  latest.current = books;

  const createBook = useCallback((data) => {
    const now = Date.now();
    const book = { id: uid("bk"), title: data.title, tags: data.tags, type: data.type || "book", chapters: blankChapters(), createdAt: now, updatedAt: now };
    setBooks((p) => [...p, book]);
    return book;
  }, []);

  /** Add fully-formed books (title, type, tags, chapters), e.g. from a JSON import. Returns the stored books. */
  const importBooks = useCallback((drafts) => {
    const now = Date.now();
    const added = drafts.map((d, i) => ({ id: uid("bk"), title: d.title, tags: d.tags, type: d.type, chapters: d.chapters, createdAt: now + i, updatedAt: now + i }));
    setBooks((p) => [...p, ...added]);
    return added;
  }, []);

  const updateBook = useCallback((id, patch) => {
    setBooks((p) => p.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b)));
  }, []);

  /** Change a book's chapters with a function: chapters → chapters. */
  const editChapters = useCallback((id, fn) => {
    setBooks((p) => p.map((b) => (b.id === id ? { ...b, chapters: fn(b.chapters), updatedAt: Date.now() } : b)));
  }, []);

  const deleteBook = useCallback((id) => {
    const index = latest.current.findIndex((b) => b.id === id);
    setBooks((p) => p.filter((b) => b.id !== id));
    return index;
  }, []);

  const restoreBook = useCallback((book, index) => {
    setBooks((p) => {
      if (p.some((b) => b.id === book.id)) return p;
      const next = [...p];
      next.splice(Math.min(index, next.length), 0, book);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ books, createBook, importBooks, updateBook, editChapters, deleteBook, restoreBook }),
    [books, createBook, importBooks, updateBook, editChapters, deleteBook, restoreBook]
  );
  return (
    <DocsContext.Provider value={value}>
      <SyncGate status={status} onRetry={reload}>{children}</SyncGate>
    </DocsContext.Provider>
  );
}
