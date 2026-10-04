import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { blankChapters, seedLibrary, uid } from "./model";
import { loadLibrary, saveLibrary } from "./storage";

const DocsContext = createContext(null);
export const useDocs = () => useContext(DocsContext);

/** Owns the library of books. Changes are saved to localStorage shortly after, and flushed on exit. */
export default function DocsProvider({ children }) {
  const [books, setBooks] = useState(() => loadLibrary() ?? seedLibrary());
  const latest = useRef(books);
  latest.current = books;

  useEffect(() => {
    const t = setTimeout(() => saveLibrary(books), 300);
    return () => clearTimeout(t);
  }, [books]);

  useEffect(() => {
    const flush = () => saveLibrary(latest.current);
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  const createBook = useCallback((data) => {
    const now = Date.now();
    const book = { id: uid("bk"), title: data.title, tags: data.tags, type: data.type || "book", chapters: blankChapters(), createdAt: now, updatedAt: now };
    setBooks((p) => [...p, book]);
    return book;
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
    () => ({ books, createBook, updateBook, editChapters, deleteBook, restoreBook }),
    [books, createBook, updateBook, editChapters, deleteBook, restoreBook]
  );
  return <DocsContext.Provider value={value}>{children}</DocsContext.Provider>;
}
