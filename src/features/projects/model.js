import { Code2, Gavel, Layers, Lightbulb, Megaphone, Scale, StickyNote, Truck, Wallet } from "lucide-react";

export const uid = (prefix = "pr") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const AREAS = [
  { id: "product", label: "Product", hue: 285, icon: Layers },
  { id: "tech", label: "Tech", hue: 235, icon: Code2 },
  { id: "marketing", label: "Marketing", hue: 350, icon: Megaphone },
  { id: "legal", label: "Legal", hue: 60, icon: Scale },
  { id: "ops", label: "Operations", hue: 155, icon: Truck },
  { id: "finance", label: "Finance", hue: 190, icon: Wallet },
];
export const areaInfo = (id) => AREAS.find((a) => a.id === id) ?? AREAS[0];

export const STATUSES = [
  { id: "doing", label: "In progress" },
  { id: "todo", label: "To do" },
  { id: "done", label: "Done" },
];
export const nextStatus = (s) => ({ todo: "doing", doing: "done", done: "todo" })[s] ?? "todo";

export const NOTE_KINDS = [
  { id: "decision", label: "Decision", hue: 285, icon: Gavel },
  { id: "idea", label: "Idea", hue: 85, icon: Lightbulb },
  { id: "note", label: "Note", hue: 190, icon: StickyNote },
];
export const kindInfo = (id) => NOTE_KINDS.find((k) => k.id === id) ?? NOTE_KINDS[2];

export const STAGES = ["Idea", "Building", "Launched"];

/** Replace the item with the same id, or append it. */
export const upsert = (list, item) => (list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item]);

export const progress = (p) => ({ done: p.tasks.filter((t) => t.status === "done").length, total: p.tasks.length });
export const milestoneProgress = (p, m) => progress({ tasks: p.tasks.filter((t) => t.milestoneId === m.id) });
