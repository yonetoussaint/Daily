import { CONTENT_TYPES, uid } from "./model";

/* ── Paste-in JSON import ────────────────────────────────────────────────────
 * Turns JSON (typically written by an AI) into a book the Docs app can store.
 * Content is HTML, which the editor renders directly, so it is sanitized here.
 */

/** Prompt the user can hand to an AI so it answers in the format `parseDocJson` expects. */
export const AI_PROMPT = `Write documentation for: <DESCRIBE YOUR TOPIC HERE>

Reply with ONLY valid JSON (no markdown code fences, no commentary) in exactly this shape:

{
  "title": "Document title",
  "type": "documentation",
  "tags": ["tag1", "tag2"],
  "chapters": [
    {
      "title": "Chapter title",
      "description": "One-line summary (optional)",
      "content": "<p>Intro for the chapter as HTML.</p>",
      "subs": [
        { "title": "Section title", "content": "<p>Section body as HTML.</p><pre>code goes here</pre>" }
      ]
    }
  ]
}

Rules:
- "type" is one of: "documentation", "book", "note".
- "content" is HTML. Allowed tags only: p, h2, h3, h4, strong, em, u, s, code, pre, blockquote, ul, ol, li, br, hr, a (href).
- Put code samples in <pre>...</pre> and inline code in <code>...</code>. Escape < > & inside code as &lt; &gt; &amp;.
- Chapters are top-level pages. "subs" are sections nested inside a chapter (one level only). "subs" may be empty.
- Do not repeat the chapter or section title as a heading inside its own content.
- Make sure the JSON is valid: double quotes, no trailing commas, and escape any double quote inside a string as \\".`;

const MAX_TITLE = 120;

const ALLOWED = new Set([
  "p", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "strike", "del", "sub", "sup",
  "code", "pre", "blockquote", "ul", "ol", "li", "br", "hr", "a",
]);
const RENAME = { b: "strong", i: "em", strike: "s", del: "s", h5: "h4", h6: "h4" };
const BLOCKISH = new Set(["div", "section", "article", "table", "thead", "tbody", "tr", "figure", "details", "summary", "dl", "dt", "dd", "caption"]);
const DROP = new Set(["script", "style", "iframe", "object", "embed", "link", "meta", "noscript", "template", "svg", "math", "form", "input", "button", "textarea", "select", "img", "video", "audio", "canvas", "head", "title"]);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escAttr = (s) => esc(s).replace(/"/g, "&quot;");

function walk(node) {
  let out = "";
  for (const child of node.childNodes) {
    if (child.nodeType === 3) { out += esc(child.nodeValue); continue; }
    if (child.nodeType !== 1) continue;
    let tag = child.tagName.toLowerCase();
    if (DROP.has(tag)) continue;
    const inner = walk(child);
    tag = RENAME[tag] || tag;

    if (tag === "a") {
      const href = (child.getAttribute("href") || "").trim();
      out += /^(https?:|mailto:|#|\/)/i.test(href) ? `<a href="${escAttr(href)}" rel="noopener noreferrer" target="_blank">${inner}</a>` : inner;
    } else if (tag === "br" || tag === "hr") {
      out += `<${tag}>`;
    } else if (tag === "pre") {
      // Keep code verbatim: flatten to text so nothing inside can carry markup.
      out += `<pre>${esc(child.textContent || "")}</pre>`;
    } else if (ALLOWED.has(tag)) {
      out += `<${tag}>${inner}</${tag}>`;
    } else if (BLOCKISH.has(tag)) {
      out += inner.trim() ? `<p>${inner}</p>` : "";
    } else {
      out += inner; // unknown inline tag (span, font, …): keep its text
    }
  }
  return out;
}

/** Plain text / light markdown → HTML: blank-line paragraphs, ``` fences, `inline code`. */
function textToHtml(text) {
  const parts = text.replace(/\r\n?/g, "\n").split(/```[^\n]*\n([\s\S]*?)```/);
  let html = "";
  parts.forEach((part, i) => {
    if (i % 2) { html += `<pre>${esc(part.replace(/\n$/, ""))}</pre>`; return; }
    part.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).forEach((p) => {
      html += `<p>${esc(p).replace(/`([^`\n]+)`/g, "<code>$1</code>").replace(/\n/g, "<br>")}</p>`;
    });
  });
  return html;
}

/** Clean one content string into safe editor HTML. */
export function sanitizeHtml(input) {
  const raw = typeof input === "string" ? input : "";
  if (!raw.trim()) return "";
  if (!/<[a-z!/][^>]*>/i.test(raw)) return textToHtml(raw);
  const doc = new DOMParser().parseFromString(raw, "text/html"); // inert: scripts never run
  return walk(doc.body).trim();
}

const str = (v, max) => (typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "");

function toSub(s, n, at) {
  if (typeof s === "string") return { id: uid(), title: `Section ${n}`, content: sanitizeHtml(s) };
  if (!s || typeof s !== "object") throw new Error(`${at} must be an object with a "title" and "content".`);
  return { id: uid(), title: str(s.title, MAX_TITLE) || `Section ${n}`, content: sanitizeHtml(s.content ?? s.body ?? s.text) };
}

function toChapter(c, n, at) {
  if (typeof c === "string") return { id: uid(), title: `Chapter ${n}`, description: "", content: sanitizeHtml(c), subs: [] };
  if (!c || typeof c !== "object") throw new Error(`${at} must be an object with a "title" and "content".`);
  const rawSubs = c.subs ?? c.sections ?? [];
  if (!Array.isArray(rawSubs)) throw new Error(`${at}: "subs" must be a list.`);
  return {
    id: uid(),
    title: str(c.title, MAX_TITLE) || `Chapter ${n}`,
    description: str(c.description ?? c.summary, 300),
    content: sanitizeHtml(c.content ?? c.body ?? c.text),
    subs: rawSubs.map((s, i) => toSub(s, i + 1, `${at}, section ${i + 1}`)),
  };
}

function toBook(b, at) {
  if (!b || typeof b !== "object" || Array.isArray(b)) throw new Error(`${at} must be an object.`);
  const title = str(b.title ?? b.name, MAX_TITLE);
  if (!title) throw new Error(`${at} needs a "title".`);
  const rawChapters = b.chapters ?? b.pages ?? [];
  if (!Array.isArray(rawChapters)) throw new Error(`${at}: "chapters" must be a list.`);
  const chapters = rawChapters.map((c, i) => toChapter(c, i + 1, `Chapter ${i + 1}`));
  if (!chapters.length) throw new Error(`${at} needs at least one chapter in "chapters".`);

  const type = CONTENT_TYPES.some((t) => t.id === b.type) ? b.type : "documentation";
  const rawTags = Array.isArray(b.tags) ? b.tags : typeof b.tags === "string" ? b.tags.split(",") : [];
  const tags = [...new Set(rawTags.map((t) => str(t, 40).replace(/^#/, "")).filter(Boolean))];
  return { title, type, tags, chapters };
}

/** Pull the JSON out of whatever was pasted: tolerate ```json fences and text around them. */
function extractJson(text) {
  let s = text.trim().replace(/^\uFEFF/, "");
  const fence = s.match(/```(?:json)?\s*\n?([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  if (!/^[[{]/.test(s)) {
    const start = s.search(/[[{]/);
    const end = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (start !== -1 && end > start) s = s.slice(start, end + 1);
  }
  return s;
}

/**
 * Parse pasted JSON into book drafts `{ title, type, tags, chapters }`.
 * Accepts one book, a list of books, or `{ "books": [...] }`. Throws an Error with a readable message.
 */
export function parseDocJson(text) {
  if (!text || !text.trim()) throw new Error("Paste some JSON first.");
  let data;
  try {
    data = JSON.parse(extractJson(text));
  } catch (e) {
    throw new Error(`That isn’t valid JSON (${e.message.replace(/^JSON\.parse: /, "")}). Ask the AI to reply with valid JSON only.`);
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.books) ? data.books : [data];
  if (!list.length) throw new Error("No documents found in that JSON.");
  return list.map((b, i) => toBook(b, list.length > 1 ? `Document ${i + 1}` : "The document"));
}
