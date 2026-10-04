import { createStore, ms, ts } from "../../data/sync";

const LEGACY_KEY = "projects-app:data";

/** What this app used to keep in localStorage (read once to move it to the database). */
function legacy() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (parsed && Array.isArray(parsed.projects)) return parsed.projects;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

/** Tables: projects, project_milestones, project_tasks, project_notes. The state is the array of projects. */
export const projectsStore = createStore({
  key: "projects",
  legacy,
  tables: [
    { name: "projects", order: "position.asc" },
    { name: "project_milestones", order: "position.asc" },
    { name: "project_tasks", order: "position.asc" },
    { name: "project_notes", order: "position.asc" },
  ],
  toRows: (projects) => {
    const out = { projects: [], project_milestones: [], project_tasks: [], project_notes: [] };
    projects.forEach((p, pi) => {
      out.projects.push({ id: p.id, name: p.name, tagline: p.tagline ?? "", stage: p.stage ?? "Idea", hue: p.hue ?? 285, position: pi, created_at: ts(p.createdAt), updated_at: ts(p.updatedAt) });
      (p.milestones ?? []).forEach((m, i) => out.project_milestones.push({ id: m.id, project_id: p.id, title: m.title, due: m.due || null, position: i }));
      (p.tasks ?? []).forEach((t, i) => out.project_tasks.push({ id: t.id, project_id: p.id, milestone_id: t.milestoneId || null, title: t.title, area: t.area ?? "product", details: t.details ?? "", due: t.due || null, status: t.status ?? "todo", position: i }));
      (p.notes ?? []).forEach((n, i) => out.project_notes.push({ id: n.id, project_id: p.id, title: n.title, kind: n.kind ?? "note", body: n.body ?? "", created_at: ts(n.createdAt), position: i }));
    });
    return out;
  },
  fromRows: (r) => {
    const group = (rows, map) => {
      const by = new Map();
      for (const row of rows) {
        if (!by.has(row.project_id)) by.set(row.project_id, []);
        by.get(row.project_id).push(map(row));
      }
      return by;
    };
    const milestones = group(r.project_milestones, (m) => ({ id: m.id, title: m.title, due: m.due ?? "" }));
    const tasks = group(r.project_tasks, (t) => ({ id: t.id, title: t.title, area: t.area, milestoneId: t.milestone_id ?? null, due: t.due ?? "", details: t.details ?? "", status: t.status }));
    const notes = group(r.project_notes, (n) => ({ id: n.id, title: n.title, kind: n.kind, body: n.body ?? "", createdAt: ms(n.created_at) }));
    return r.projects.map((p) => ({
      id: p.id, name: p.name, tagline: p.tagline ?? "", stage: p.stage, hue: p.hue,
      milestones: milestones.get(p.id) ?? [], tasks: tasks.get(p.id) ?? [], notes: notes.get(p.id) ?? [],
      createdAt: ms(p.created_at), updatedAt: ms(p.updated_at),
    }));
  },
});
