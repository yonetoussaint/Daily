import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import SyncGate from "../../data/SyncGate";
import useStore from "../../data/useStore";
import { uid } from "./model";
import { gazStore } from "./storage";

const Ctx = createContext(null);
export const useGaz = () => useContext(Ctx);

const EMPTY = { tasks: [] };

/** Owns the Easy Gaz Plus tasks. Stored in Supabase (gaz_tasks); changes are saved shortly after and flushed on exit. */
export default function GazProvider({ children }) {
  const [loaded, setData, status, reload] = useStore(gazStore);
  const data = loaded ?? EMPTY;
  const latest = useRef(data);
  latest.current = data;

  /** Add a task (no id) or replace one (same id). */
  const saveTask = useCallback((task) => {
    setData((d) => {
      const exists = task.id && d.tasks.some((x) => x.id === task.id);
      if (exists) return { ...d, tasks: d.tasks.map((x) => (x.id === task.id ? { ...x, ...task } : x)) };
      return { ...d, tasks: [{ done: false, doneAt: null, askedBy: "", due: "", notes: "", ...task, id: uid("gz"), createdAt: Date.now() }, ...d.tasks] };
    });
  }, []);

  const toggle = useCallback((id) => {
    setData((d) => ({ ...d, tasks: d.tasks.map((x) => (x.id === id ? { ...x, done: !x.done, doneAt: x.done ? null : Date.now() } : x)) }));
  }, []);

  const removeTask = useCallback((id) => {
    const index = latest.current.tasks.findIndex((x) => x.id === id);
    setData((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== id) }));
    return index;
  }, []);

  const restoreTask = useCallback((task, index) => {
    setData((d) => {
      if (d.tasks.some((x) => x.id === task.id)) return d;
      const tasks = [...d.tasks];
      tasks.splice(Math.min(index, tasks.length), 0, task);
      return { ...d, tasks };
    });
  }, []);

  const clearDone = useCallback(() => {
    const removed = latest.current.tasks.filter((x) => x.done);
    setData((d) => ({ ...d, tasks: d.tasks.filter((x) => !x.done) }));
    return removed;
  }, []);

  const restoreMany = useCallback((tasks) => {
    setData((d) => ({ ...d, tasks: [...d.tasks, ...tasks.filter((t) => !d.tasks.some((x) => x.id === t.id))] }));
  }, []);

  const value = useMemo(
    () => ({ ...data, saveTask, toggle, removeTask, restoreTask, clearDone, restoreMany }),
    [data, saveTask, toggle, removeTask, restoreTask, clearDone, restoreMany]
  );
  return (
    <Ctx.Provider value={value}>
      <SyncGate status={status} onRetry={reload}>{children}</SyncGate>
    </Ctx.Provider>
  );
}
