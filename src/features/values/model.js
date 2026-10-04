import { AlertCircle, Briefcase, CheckCircle2, HeartPulse, Lightbulb, Quote, Shield, Sprout, Users, Wallet } from "lucide-react";

export const uid = (prefix = "vl") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Areas of life a value or principle belongs to. */
export const CATEGORIES = [
  { id: "character", label: "Character", hue: 285, icon: Shield },
  { id: "people", label: "People", hue: 350, icon: Users },
  { id: "work", label: "Work", hue: 235, icon: Briefcase },
  { id: "money", label: "Money", hue: 85, icon: Wallet },
  { id: "body", label: "Body & mind", hue: 155, icon: HeartPulse },
  { id: "growth", label: "Growth", hue: 190, icon: Sprout },
];
export const categoryInfo = (id) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

/** Journal entry types. "lived" and "short" feed the score on each value. */
export const REFLECTION_KINDS = [
  { id: "lived", label: "Lived it", hue: 155, icon: CheckCircle2 },
  { id: "short", label: "Fell short", hue: 25, icon: AlertCircle },
  { id: "lesson", label: "Lesson", hue: 85, icon: Lightbulb },
  { id: "quote", label: "Quote", hue: 285, icon: Quote },
];
export const kindInfo = (id) => REFLECTION_KINDS.find((k) => k.id === id) ?? REFLECTION_KINDS[2];

/** Replace the item with the same id, or append it. */
export const upsert = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

/** How often a value was lived or fell short, from the journal. */
export const tally = (reflections, valueId) => ({
  lived: reflections.filter((r) => r.valueId === valueId && r.kind === "lived").length,
  short: reflections.filter((r) => r.valueId === valueId && r.kind === "short").length,
});

/** Things worth being reminded of: every value and every principle. */
export function reminders(data) {
  return [
    ...data.values.map((v) => ({ id: v.id, label: "Value", title: v.title, body: v.meaning, hue: categoryInfo(v.category).hue })),
    ...data.principles.map((p) => ({ id: p.id, label: "Principle", title: p.title, body: p.why, hue: categoryInfo(p.category).hue })),
  ];
}

/** A few examples to start from; edit or delete them freely. */
export function seedValues() {
  const now = Date.now();
  const v = (title, category, meaning) => ({ id: uid("vl"), title, category, meaning, createdAt: now });
  const values = [
    v("Honesty", "character", "Say what is true, kindly. Don’t promise what I won’t do."),
    v("Kindness", "people", "Assume good intent and leave people better off than I found them."),
    v("Courage", "character", "Do the right thing even when it is uncomfortable."),
    v("Family first", "people", "Time and attention for the people closest to me come before status."),
    v("Always learning", "growth", "Stay curious, ask questions and admit when I am wrong."),
  ];
  const id = (t) => values.find((x) => x.title === t).id;
  const p = (title, category, why, valueId) => ({ id: uid("pr"), title, category, why, valueId });
  const principles = [
    p("Keep my word, or say early that I can’t", "character", "Trust is built from small promises kept.", id("Honesty")),
    p("Listen fully before I answer", "people", "People feel respected when they are heard first.", id("Kindness")),
    p("Spend less than I earn and give some away", "money", "Money is a tool for a good life, not the goal.", null),
    p("Sleep, move and rest before I push harder", "body", "I treat people better when I look after myself.", null),
  ];
  const r = (kind, title, body, valueId, ago) => ({ id: uid("rf"), kind, title, body, valueId, createdAt: now - ago * 864e5 });
  const reflections = [
    r("lived", "Told the client about my mistake", "It was awkward for a minute, then they thanked me for being straight.", id("Honesty"), 2),
    r("short", "Snapped at my brother", "I was tired and stressed. Apologise tonight and listen next time.", id("Kindness"), 1),
    r("lesson", "Rest is part of the work", "Tired decisions cost more than the hour I saved.", null, 0),
  ];
  return { values, principles, reflections };
}
