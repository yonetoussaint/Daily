import { BookOpen, FileCode2, StickyNote } from "lucide-react";

export const WORD_GOAL = 3000;

export const uid = (prefix = "ch") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Kinds of document. `hue` tints the card, `lobes`/`amp` shape its scalloped icon tile. */
export const CONTENT_TYPES = [
  { id: "note", label: "Note", icon: StickyNote, hue: 75, lobes: 5, amp: 0.12 },
  { id: "book", label: "Book", icon: BookOpen, hue: 335, lobes: 6, amp: 0.1 },
  { id: "documentation", label: "Documentation", icon: FileCode2, hue: 155, lobes: 8, amp: 0.08 },
];
export const typeInfo = (id) => CONTENT_TYPES.find((t) => t.id === id) || CONTENT_TYPES[1];

const stripHtml = (h) => (h || "").replace(/<[^>]*>/g, " ").trim();
export const countWords = (html) => stripHtml(html).split(/\s+/).filter(Boolean).length;

export const wordsInChapters = (chapters) =>
  (chapters || []).reduce(
    (total, ch) => total + countWords(ch.content) + (ch.subs || []).reduce((a, s) => a + countWords(s.content), 0),
    0
  );

export function relativeTime(ts) {
  if (!ts) return "";
  const min = Math.floor((Date.now() - ts) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.floor(mo / 12)}y ago`;
}

export const blankChapter = (n = 1) => ({ id: uid(), title: `Chapter ${n}`, description: "", content: "", subs: [] });
export const blankChapters = () => [blankChapter(1)];
