import { createStore, ms, ts } from "../../data/sync";

const LEGACY_KEY = "values-app:data";

/** What this app used to keep in localStorage (read once to move it to the database). */
function legacy() {
  try {
    const p = JSON.parse(localStorage.getItem(LEGACY_KEY) || "null");
    if (p && Array.isArray(p.values) && Array.isArray(p.principles) && Array.isArray(p.reflections)) return p;
  } catch { /* corrupt or unavailable storage */ }
  return null;
}

/** Tables: life_values, life_principles, life_reflections. The state is { values, principles, reflections }. */
export const valuesStore = createStore({
  key: "values",
  legacy,
  tables: [
    { name: "life_values", order: "position.asc" },
    { name: "life_principles", order: "position.asc" },
    { name: "life_reflections", order: "position.asc" },
  ],
  toRows: (d) => ({
    life_values: d.values.map((v, i) => ({ id: v.id, title: v.title, meaning: v.meaning ?? "", category: v.category ?? "character", position: i, created_at: ts(v.createdAt) })),
    life_principles: d.principles.map((p, i) => ({ id: p.id, title: p.title, why: p.why ?? "", category: p.category ?? "character", value_id: p.valueId || null, position: i, created_at: ts(p.createdAt) })),
    life_reflections: d.reflections.map((x, i) => ({ id: x.id, title: x.title, body: x.body ?? "", kind: x.kind ?? "lived", value_id: x.valueId || null, position: i, created_at: ts(x.createdAt) })),
  }),
  fromRows: (r) => ({
    values: r.life_values.map((v) => ({ id: v.id, title: v.title, meaning: v.meaning ?? "", category: v.category, createdAt: ms(v.created_at) })),
    principles: r.life_principles.map((p) => ({ id: p.id, title: p.title, why: p.why ?? "", category: p.category, valueId: p.value_id ?? null, createdAt: ms(p.created_at) })),
    reflections: r.life_reflections.map((x) => ({ id: x.id, title: x.title, body: x.body ?? "", kind: x.kind, valueId: x.value_id ?? null, createdAt: ms(x.created_at) })),
  }),
});
