import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import SyncGate from "../../data/SyncGate";
import useStore from "../../data/useStore";
import { uid } from "./model";
import { wardrobeStore } from "./storage";

const Ctx = createContext(null);
export const useWardrobe = () => useContext(Ctx);

const EMPTY = { items: [] };

/** Owns the clothes. Stored in Supabase (wardrobe_items); changes are saved shortly after and flushed on exit. */
export default function WardrobeProvider({ children }) {
  const [loaded, setData, status, reload] = useStore(wardrobeStore);
  const data = loaded ?? EMPTY;
  const latest = useRef(data);
  latest.current = data;

  /** Add an item (no id) or replace one (same id). */
  const saveItem = useCallback((item) => {
    setData((d) => {
      const exists = item.id && d.items.some((x) => x.id === item.id);
      if (exists) return { ...d, items: d.items.map((x) => (x.id === item.id ? { ...x, ...item } : x)) };
      return { ...d, items: [{ ...item, id: uid("wd"), createdAt: Date.now() }, ...d.items] };
    });
  }, []);

  const removeItem = useCallback((id) => {
    const index = latest.current.items.findIndex((x) => x.id === id);
    setData((d) => ({ ...d, items: d.items.filter((x) => x.id !== id) }));
    return index;
  }, []);

  const restoreItem = useCallback((item, index) => {
    setData((d) => {
      if (d.items.some((x) => x.id === item.id)) return d;
      const items = [...d.items];
      items.splice(Math.min(index, items.length), 0, item);
      return { ...d, items };
    });
  }, []);

  /**
   * Bring in many items at once (JSON import). An item whose id already exists replaces it;
   * everything else is added. Returns { added, updated } and the previous state for undo.
   */
  const importItems = useCallback((incoming) => {
    const before = latest.current.items;
    const known = new Set(before.map((x) => x.id));
    const now = Date.now();
    const seen = new Set();
    const fresh = [];
    const updates = new Map();
    incoming.forEach((it, n) => {
      if (it.id && known.has(it.id)) { updates.set(it.id, it); return; }
      let id = it.id && !seen.has(it.id) ? it.id : uid("wd");
      while (seen.has(id) || known.has(id)) id = uid("wd");
      seen.add(id);
      fresh.push({ ...it, id, createdAt: now - n }); // keeps the file's order when sorted newest first
    });
    setData((d) => ({
      ...d,
      items: [...fresh, ...d.items.map((x) => (updates.has(x.id) ? { ...x, ...updates.get(x.id), image: updates.get(x.id).image || x.image, images: updates.get(x.id).images?.length ? updates.get(x.id).images : x.images, id: x.id, createdAt: x.createdAt } : x))],
    }));
    return { added: fresh.length, updated: updates.size, undo: before };
  }, []);

  const restoreAll = useCallback((items) => setData((d) => ({ ...d, items })), []);

  const value = useMemo(
    () => ({ ...data, saveItem, removeItem, restoreItem, importItems, restoreAll }),
    [data, saveItem, removeItem, restoreItem, importItems, restoreAll]
  );
  return (
    <Ctx.Provider value={value}>
      <SyncGate status={status} onRetry={reload}>{children}</SyncGate>
    </Ctx.Provider>
  );
}
