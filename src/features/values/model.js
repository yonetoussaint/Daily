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
