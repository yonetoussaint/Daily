import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { seedTodo, uid } from "./model";
import { loadTodo, saveTodo } from "./storage";

const Ctx = createContext(null);
export const useTodo = () => useContext(Ctx);

/** Owns the lists and tasks. Saved to localStorage shortly after each change and flushed on exit. */
export default function TodoProvider({ children }) {
  const [data, setData] = useState(() => loadTodo() ?? seedTodo());
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    const t = setTimeout(() => saveTodo(data), 300);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    const flush = () => saveTodo(latest.current);
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  /** Add a task (no id) or replace one (same id). */
  const saveTask = useCallback((task) => {
    setData((d) => {
      const exists = task.id && d.tasks.some((x) => x.id === task.id);
      if (exists) return { ...d, tasks: d.tasks.map((x) => (x.id === task.id ? { ...x, ...task } : x)) };
      return { ...d, tasks: [{ done: false, doneAt: null, askedBy: "", due: "", notes: "", ...task, id: uid("tk"), createdAt: Date.now() }, ...d.tasks] };
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

  const clearDone = useCallback((listId) => {
    const removed = latest.current.tasks.filter((x) => x.done && (!listId || x.listId === listId));
    setData((d) => ({ ...d, tasks: d.tasks.filter((x) => !(x.done && (!listId || x.listId === listId))) }));
    return removed;
  }, []);

  const restoreMany = useCallback((tasks) => {
    setData((d) => ({ ...d, tasks: [...d.tasks, ...tasks.filter((t) => !d.tasks.some((x) => x.id === t.id))] }));
  }, []);

  const saveList = useCallback((list) => {
    const id = list.id ?? uid("list");
    setData((d) => ({ ...d, lists: d.lists.some((l) => l.id === id) ? d.lists.map((l) => (l.id === id ? { ...l, ...list } : l)) : [...d.lists, { ...list, id }] }));
    return id;
  }, []);

  /** Delete a list together with its tasks; returns what is needed to undo it. */
  const removeList = useCallback((id) => {
    const cur = latest.current;
    const undo = { list: cur.lists.find((l) => l.id === id), index: cur.lists.findIndex((l) => l.id === id), tasks: cur.tasks.filter((t) => t.listId === id) };
    setData((d) => ({ lists: d.lists.filter((l) => l.id !== id), tasks: d.tasks.filter((t) => t.listId !== id) }));
    return undo;
  }, []);

  const restoreList = useCallback(({ list, index, tasks }) => {
    setData((d) => {
      if (d.lists.some((l) => l.id === list.id)) return d;
      const lists = [...d.lists];
      lists.splice(Math.min(index, lists.length), 0, list);
      return { lists, tasks: [...d.tasks, ...tasks] };
    });
  }, []);

  const value = useMemo(
    () => ({ ...data, saveTask, toggle, removeTask, restoreTask, clearDone, restoreMany, saveList, removeList, restoreList }),
    [data, saveTask, toggle, removeTask, restoreTask, clearDone, restoreMany, saveList, removeList, restoreList]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
