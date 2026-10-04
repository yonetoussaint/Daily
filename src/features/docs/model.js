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

function seedChapters() {
  return [
    {
      id: uid(),
      title: "Getting Started",
      description: "A quick primer before you dive in.",
      content:
        "<p>This is your documentation workspace. Each <strong>chapter</strong> in the outline is a top-level page, and each chapter can hold nested <strong>sections</strong> — just like a real docs site.</p><p>Tap <em>Edit</em> to start writing.</p>",
      subs: [
        { id: uid(), title: "Installation", content: "<p>Add the package to your project:</p><pre>npm install your-package</pre><p>Then import it wherever you need it.</p>" },
        { id: uid(), title: "Quick Start", content: "<p>Create your first entry, give it a title, and start writing. Formatting lives in the toolbar at the bottom of the editor.</p>" },
      ],
    },
    {
      id: uid(),
      title: "API Reference",
      description: "",
      content: "",
      subs: [
        {
          id: uid(),
          title: "Authentication",
          content: "<p>Requests are authenticated with a bearer token in the <code>Authorization</code> header.</p><pre>Authorization: Bearer sk_live_xxxxxxxx</pre><p>Old keys stay valid for 24 hours after a new one is issued.</p>",
        },
      ],
    },
  ];
}

export function seedLibrary() {
  const now = Date.now();
  return [{ id: uid("bk"), title: "Project Docs", tags: ["v1", "internal"], type: "documentation", chapters: seedChapters(), createdAt: now, updatedAt: now }];
}
