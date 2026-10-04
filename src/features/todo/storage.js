import { createStore, ms, ts } from "../../data/sync";

const LEGACY_KEY = "todo-app:data";

/** What this app used to keep in localStorage (read once to move it to the database). */
function legacy() {
  try {
    const p = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (p && Array.isArray(p.lists) && Array.isArray(p.tasks)) return p;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

/** Tables: todo_lists, todo_tasks. */
export const todoStore = createStore({
  key: "todo",
  legacy,
  tables: [
    { name: "todo_lists", order: "position.asc" },
    { name: "todo_tasks", order: "created_at.desc.nullslast" },
  ],
  toRows: (d) => ({
    todo_lists: d.lists.map((l, i) => ({ id: l.id, name: l.name, hue: l.hue ?? 25, position: i })),
    todo_tasks: d.tasks.map((t) => ({
      id: t.id,
      list_id: t.listId,
      title: t.title,
      asked_by: t.askedBy ?? "",
      due: t.due || null,
      notes: t.notes ?? "",
      done: !!t.done,
      done_at: ts(t.doneAt),
      created_at: ts(t.createdAt),
    })),
  }),
  fromRows: (r) => ({
    lists: r.todo_lists.map((l) => ({ id: l.id, name: l.name, hue: l.hue })),
    tasks: r.todo_tasks.map((t) => ({
      id: t.id,
      listId: t.list_id,
      title: t.title,
      askedBy: t.asked_by ?? "",
      due: t.due ?? "",
      notes: t.notes ?? "",
      done: !!t.done,
      doneAt: t.done_at ? ms(t.done_at) : null,
      createdAt: ms(t.created_at),
    })),
  }),
});
