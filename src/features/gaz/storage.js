import { createStore, ms, ts } from "../../data/sync";

/** Table: gaz_tasks. (Easy Gaz Plus used to be a list inside the Todo app.) */
export const gazStore = createStore({
  key: "gaz",
  tables: [{ name: "gaz_tasks", order: "created_at.desc.nullslast" }],
  toRows: (d) => ({
    gaz_tasks: d.tasks.map((t) => ({
      id: t.id,
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
    tasks: r.gaz_tasks.map((t) => ({
      id: t.id,
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
