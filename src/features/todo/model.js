export const uid = (prefix = "td") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const HUES = [25, 285, 155, 235, 350, 85];

export const todayIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};
export const fmtDate = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

/** Which group an open task falls in, by due date. */
export const GROUPS = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "soon", label: "Upcoming" },
  { id: "none", label: "No date" },
];
export function groupOf(task, today = todayIso()) {
  if (!task.due) return "none";
  if (task.due < today) return "overdue";
  return task.due === today ? "today" : "soon";
}

export const EASY_GAZ = "list_easygaz";

/** The two starting lists (containers only, no example tasks). */
export function seedTodo() {
  const lists = [
    { id: EASY_GAZ, name: "Easy Gaz Plus", hue: 25 },
    { id: "list_personal", name: "Personal", hue: 285 },
  ];
  return { lists, tasks: [] };
}
