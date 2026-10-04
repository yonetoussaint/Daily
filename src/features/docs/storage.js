import { createStore, ms, ts } from "../../data/sync";

const LEGACY_KEY = "docs-app:library";

/** What this app used to keep in localStorage (read once to move it to the database). */
function legacy() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (parsed && Array.isArray(parsed.books)) return parsed.books;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

/** Tables: docs_books, docs_chapters, docs_sections. The state is the array of books. */
export const docsStore = createStore({
  key: "docs",
  legacy,
  tables: [
    { name: "docs_books", order: "created_at.asc.nullsfirst" },
    { name: "docs_chapters", order: "position.asc", chunk: 25 },
    { name: "docs_sections", order: "position.asc", chunk: 25 },
  ],
  toRows: (books) => {
    const out = { docs_books: [], docs_chapters: [], docs_sections: [] };
    for (const b of books) {
      out.docs_books.push({ id: b.id, title: b.title, type: b.type ?? "book", tags: b.tags ?? [], created_at: ts(b.createdAt), updated_at: ts(b.updatedAt) });
      (b.chapters ?? []).forEach((c, ci) => {
        out.docs_chapters.push({ id: c.id, book_id: b.id, title: c.title ?? "", description: c.description ?? "", content: c.content ?? "", position: ci });
        (c.subs ?? []).forEach((s, si) => {
          out.docs_sections.push({ id: s.id, chapter_id: c.id, title: s.title ?? "", content: s.content ?? "", position: si });
        });
      });
    }
    return out;
  },
  fromRows: (r) => {
    const subsOf = new Map();
    for (const s of r.docs_sections) {
      if (!subsOf.has(s.chapter_id)) subsOf.set(s.chapter_id, []);
      subsOf.get(s.chapter_id).push({ id: s.id, title: s.title, content: s.content });
    }
    const chaptersOf = new Map();
    for (const c of r.docs_chapters) {
      if (!chaptersOf.has(c.book_id)) chaptersOf.set(c.book_id, []);
      chaptersOf.get(c.book_id).push({ id: c.id, title: c.title, description: c.description, content: c.content, subs: subsOf.get(c.id) ?? [] });
    }
    return r.docs_books.map((b) => ({
      id: b.id, title: b.title, type: b.type, tags: b.tags ?? [], chapters: chaptersOf.get(b.id) ?? [],
      createdAt: ms(b.created_at), updatedAt: ms(b.updated_at),
    }));
  },
});
