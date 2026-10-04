const KEY = "values-app:data";

/** The saved data ({ values, principles, reflections }), or null when nothing (valid) is stored yet. */
export function loadValues() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || "null");
    if (p && Array.isArray(p.values) && Array.isArray(p.principles) && Array.isArray(p.reflections)) return p;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

export function saveValues(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or unavailable */ }
}
