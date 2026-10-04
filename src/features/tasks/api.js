// Supabase REST client for the `home_organizer_items` table (id, name, room, priority, checked, created_at).
// Prefer env vars (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY); falls back to the original public project.
const URL_ = import.meta.env.VITE_SUPABASE_URL ?? "https://wkfzhcszhgewkvwukzes.supabase.co";
const KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrZnpoY3N6aGdld2t2d3VremVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3MDE1NzksImV4cCI6MjA1NDI3NzU3OX0.TzSh8M9NOTnsmVaNxquif4xzSxWaVZp9sePHcjrgCVI";
const TABLE = `${URL_}/rest/v1/home_organizer_items`;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const returning = { ...headers, Prefer: "return=representation" };

async function request(url, init, errorLabel) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${errorLabel} (${res.status})`);
  return res.status === 204 ? null : res.json();
}

export const fetchItems = () => request(`${TABLE}?select=*&order=created_at.asc`, { headers }, "Failed to load items");
export const insertItem = async (data) => (await request(TABLE, { method: "POST", headers: returning, body: JSON.stringify([data]) }, "Failed to add item"))[0];
export const updateItem = async (id, patch) => (await request(`${TABLE}?id=eq.${id}`, { method: "PATCH", headers: returning, body: JSON.stringify(patch) }, "Failed to update item"))[0];
// `keepalive` lets a pending delete finish even while the page is closing.
export const deleteItem = (id, { keepalive = false } = {}) => request(`${TABLE}?id=eq.${id}`, { method: "DELETE", headers, keepalive }, "Failed to delete item");
