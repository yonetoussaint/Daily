const KEY = "projects-app:data";

/** The saved projects, or null when nothing (valid) is stored yet. */
export function loadProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "null");
    if (parsed && Array.isArray(parsed.projects)) return parsed.projects;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

export function saveProjects(projects) {
  try { localStorage.setItem(KEY, JSON.stringify({ projects })); } catch { /* storage full or unavailable */ }
}
