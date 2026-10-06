export const uid = (prefix = "gz") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Accent hue of the app (the same orange Easy Gaz Plus had as a list in Todo). */
export const HUE = 25;

export const todayIso = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
};
export const plusDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
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
