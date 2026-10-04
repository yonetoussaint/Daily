const KEY = "todo-app:data";

/** The saved data ({ lists, tasks }), or null when nothing (valid) is stored yet. */
export function loadTodo() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    if (p && Array.isArray(p.lists) && Array.isArray(p.tasks)) return p;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

export function saveTodo(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or unavailable */ }
}
