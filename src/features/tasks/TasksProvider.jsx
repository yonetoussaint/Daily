import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "../../design/components";
import { deleteItem, fetchItems, insertItem, updateItem } from "./api";
import { normalizePriority, PRIORITIES, ROOMS } from "./model";

const TasksContext = createContext(null);
export const useTasks = () => useContext(TasksContext);

const UNDO_WINDOW = 5000;
const byCreated = (a, b) => String(a.created_at).localeCompare(String(b.created_at));

/**
 * Single source of truth for tasks: server sync (optimistic updates with per-item rollback),
 * undoable deletes, filters, derived groups/stats, and the add/edit sheet state.
 */
export function TasksProvider({ children }) {
  const snackbar = useSnackbar();
  const [items, setItems] = useState([]);
  const itemsRef = useRef([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [room, setRoom] = useState("All");
  const [filter, setFilter] = useState("all"); // all | open | done
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(null); // null | { item: Task | null }

  const commit = useCallback((next) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const load = useCallback(() => {
    setStatus("loading");
    return fetchItems()
      .then((rows) => { commit(rows); setStatus("ready"); })
      .catch(() => setStatus("error"));
  }, [commit]);

  useEffect(() => { load(); }, [load]);

  const fail = useCallback((message) => snackbar.show({ message }), [snackbar]);

  /** Apply locally first, then sync; on failure undo only the change that failed. */
  const mutate = useCallback(async (apply, revert, request, message) => {
    commit(apply(itemsRef.current));
    try { await request(); } catch { commit(revert(itemsRef.current)); fail(message); }
  }, [commit, fail]);

  const patchOne = (id, patch) => (list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i));

  const toggle = useCallback((item) => {
    const checked = !item.checked;
    return mutate(patchOne(item.id, { checked }), patchOne(item.id, { checked: item.checked }), () => updateItem(item.id, { checked }), "Couldn't save that change");
  }, [mutate]);

  const setPriority = useCallback((item, priority) => {
    if (item.priority === priority) return;
    return mutate(patchOne(item.id, { priority }), patchOne(item.id, { priority: item.priority }), () => updateItem(item.id, { priority }), "Couldn't update priority");
  }, [mutate]);

  const update = useCallback((item, data) => {
    const before = { name: item.name, priority: item.priority, room: item.room };
    return mutate(patchOne(item.id, data), patchOne(item.id, before), () => updateItem(item.id, data), "Couldn't save changes");
  }, [mutate]);

  const create = useCallback(async (data) => {
    try {
      const created = await insertItem({ ...data, checked: false });
      commit([...itemsRef.current, created]);
    } catch { fail("Couldn't add that task"); }
  }, [commit, fail]);

  /* Deletes are deferred for a few seconds so they can be undone. */
  const pending = useRef(new Map()); // id -> { item, timer }

  const flushDelete = useCallback((id, opts) => {
    const entry = pending.current.get(id);
    if (!entry) return;
    clearTimeout(entry.timer);
    pending.current.delete(id);
    deleteItem(id, opts).catch(() => {
      commit([...itemsRef.current, entry.item].sort(byCreated));
      fail("Couldn't delete that task");
    });
  }, [commit, fail]);

  const remove = useCallback((item) => {
    commit(itemsRef.current.filter((i) => i.id !== item.id));
    const timer = setTimeout(() => flushDelete(item.id), UNDO_WINDOW);
    pending.current.set(item.id, { item, timer });
    snackbar.show({
      message: `Deleted “${item.name}”`,
      actionLabel: "Undo",
      duration: UNDO_WINDOW,
      onAction: () => {
        const entry = pending.current.get(item.id);
        if (!entry) return;
        clearTimeout(entry.timer);
        pending.current.delete(item.id);
        commit([...itemsRef.current, entry.item].sort(byCreated));
      },
    });
  }, [commit, flushDelete, snackbar]);

  // Never lose a delete the user didn't undo, even if the tab closes first.
  useEffect(() => {
    const flushAll = () => [...pending.current.keys()].forEach((id) => flushDelete(id, { keepalive: true }));
    window.addEventListener("pagehide", flushAll);
    return () => { window.removeEventListener("pagehide", flushAll); flushAll(); };
  }, [flushDelete]);

  /* ── derived view ── */
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => items.filter((i) =>
      (room === "All" || i.room === room) &&
      (filter === "all" || (filter === "done" ? i.checked : !i.checked)) &&
      (!q || i.name.toLowerCase().includes(q))),
    [items, room, filter, q]
  );

  const groups = useMemo(
    () => PRIORITIES.map((priority) => ({ priority, rows: visible.filter((i) => normalizePriority(i.priority) === priority) })).filter((g) => g.rows.length),
    [visible]
  );

  const stats = useMemo(() => {
    const count = (list) => ({ total: list.length, done: list.filter((i) => i.checked).length });
    const rooms = Object.fromEntries(ROOMS.map((r) => [r.name, count(items.filter((i) => i.room === r.name))]));
    return { all: count(items), rooms, scope: count(room === "All" ? items : items.filter((i) => i.room === room)) };
  }, [items, room]);

  const value = {
    items, status, reload: load,
    room, setRoom, filter, setFilter, query, setQuery,
    visible, groups, stats,
    actions: { toggle, setPriority, update, create, remove },
    editor, openEditor: (item = null) => setEditor({ item }), closeEditor: () => setEditor(null),
  };
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}
