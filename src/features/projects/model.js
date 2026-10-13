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

/* ── Folders (nest without limit: a folder's parentId is another folder, or null for the top level) ── */
export const FOLDER_PREFIX = "fd";

export const childFolders = (folders, parentId = null) => folders.filter((f) => (f.parentId ?? null) === parentId);

/** Folders from the top level down to `id`, outermost first. */
export function folderPath(folders, id) {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const path = [];
  const seen = new Set();
  let at = id ? byId.get(id) : null;
  while (at && !seen.has(at.id)) {
    seen.add(at.id);
    path.unshift(at);
    at = at.parentId ? byId.get(at.parentId) : null;
  }
  return path;
}

/** `id` plus every folder below it, at any depth. */
export function folderTree(folders, id) {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) { ids.add(f.id); grew = true; }
  }
  return ids;
}

/** All folders as one depth-first list [{ folder, depth }], parents always before their children. Skips `exclude` and everything below it. */
export function flattenFolders(folders, exclude = null) {
  const out = [];
  const walk = (parentId, depth) => {
    for (const folder of childFolders(folders, parentId)) {
      if (folder.id === exclude) continue;
      out.push({ folder, depth });
      walk(folder.id, depth + 1);
    }
  };
  walk(null, 0);
  return out;
}

/** Tasks in a folder and every folder below it. */
export function folderTaskStats(project, id) {
  const ids = folderTree(project.folders, id);
  const tasks = project.tasks.filter((t) => t.folderId && ids.has(t.folderId));
  return { total: tasks.length, done: tasks.filter((t) => t.status === "done").length, folders: ids.size - 1 };
}
