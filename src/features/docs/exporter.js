/* ── JSON export ─────────────────────────────────────────────────────────────
 * The reverse of importer.js: turns saved docs into the same JSON shape
 * `parseDocJson` accepts, so an export can be uploaded to an AI, edited there,
 * and pasted straight back into Import.
 */

const slug = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

/** One book as a plain, import-compatible object (no ids or timestamps). */
export function bookToJson(book) {
  return {
    title: book.title,
    type: book.type,
    tags: book.tags || [],
    chapters: (book.chapters || []).map((c) => ({
      title: c.title,
      description: c.description || "",
      content: c.content || "",
      subs: (c.subs || []).map((s) => ({ title: s.title, content: s.content || "" })),
    })),
  };
}

/** JSON text for one book, or `{ "books": [...] }` for several. */
export function exportJson(books) {
  const data = books.length === 1 ? bookToJson(books[0]) : { books: books.map(bookToJson) };
  return JSON.stringify(data, null, 2);
}

export function exportFilename(books) {
  return books.length === 1 ? `${slug(books[0].title) || "doc"}.json` : `docs-${new Date().toISOString().slice(0, 10)}.json`;
}

/** Save text as a .json file via a temporary link. */
export function downloadJson(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
