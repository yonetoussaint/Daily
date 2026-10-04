// Supabase REST client shared by every app.
// Prefer env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY); falls back to the original public project.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://wkfzhcszhgewkvwukzes.supabase.co";
export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZnpoY3N6aGdld2t2d3VremVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MDE1NzksImV4cCI6MjA1NDI3NzU3OX0.TzSh8M9NOTnsmVaNxquif4xzSxWaVZp9sePHcjrgCVI";

const REST = `${SUPABASE_URL}/rest/v1`;
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" };
const PAGE = 1000; // Supabase returns at most 1000 rows per request

async function request(url, init, label) {
  const res = await fetch(url, init);
  if (!res.ok) {
    let detail = "";
    try { detail = (await res.json())?.message ?? ""; } catch { /* no body */ }
    throw new Error(`${label} (${res.status})${detail ? `: ${detail}` : ""}`);
  }
  return res.status === 204 ? null : res.json().catch(() => null);
}

/** Every row of a table, in the given order (e.g. "position.asc"), fetched page by page. */
export async function selectAll(table, order) {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const qs = `select=*${order ? `&order=${order}` : ""}&limit=${PAGE}&offset=${offset}`;
    const page = await request(`${REST}/${table}?${qs}`, { headers }, `Failed to load ${table}`);
    rows.push(...page);
    if (page.length < PAGE) return rows;
  }
}

/** Insert or update rows by primary key `id` (one request). */
export const upsertRows = (table, rows, { keepalive = false } = {}) =>
  request(
    `${REST}/${table}?on_conflict=id`,
    { method: "POST", headers: { ...headers, Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(rows), keepalive },
    `Failed to save ${table}`
  );

/** Delete rows by id (one request). */
export const deleteIds = (table, ids, { keepalive = false } = {}) =>
  request(
    `${REST}/${table}?id=in.(${ids.map((id) => `"${String(id).replace(/"/g, "")}"`).join(",")})`,
    { method: "DELETE", headers, keepalive },
    `Failed to delete from ${table}`
  );
