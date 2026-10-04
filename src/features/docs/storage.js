const KEY = "docs-app:library";

/** The saved library, or null when nothing (valid) is stored yet. */
export function loadLibrary() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (parsed && Array.isArray(parsed.books)) return parsed.books;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

export function saveLibrary(books) {
  try { localStorage.setItem(KEY, JSON.stringify({ books })); } catch { /* storage full or unavailable */ }
}
