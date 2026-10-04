// Supabase REST client for the `home_organizer_items` table (id, name, room, priority, checked, created_at).
import { SUPABASE_KEY as KEY, SUPABASE_URL as URL_ } from "../../data/db";
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
