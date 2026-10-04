import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { uid, upsert } from "./model";
import { loadValues, saveValues } from "./storage";

const Ctx = createContext(null);
export const useValues = () => useContext(Ctx);

/** The three lists and the id prefix of each. */
export const LISTS = { value: ["values", "vl"], principle: ["principles", "pr"], reflection: ["reflections", "rf"] };

/** Owns the values, principles and journal. Saved to localStorage shortly after each change and flushed on exit. */
export default function ValuesProvider({ children }) {
  const [data, setData] = useState(() => loadValues() ?? { values: [], principles: [], reflections: [] });
  const latest = useRef(data);
  latest.current = data;

  useEffect(() => {
    const t = setTimeout(() => saveValues(data), 300);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    const flush = () => saveValues(latest.current);
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

  /** Add a new item, or replace the one with the same id. */
  const save = useCallback((kind, item) => {
    const [key, prefix] = LISTS[kind];
    setData((d) => ({ ...d, [key]: upsert(d[key], item.id ? item : { ...item, id: uid(prefix), createdAt: Date.now() }) }));
  }, []);

  /** Remove an item; returns its old position so it can be put back. */
  const remove = useCallback((kind, id) => {
    const [key] = LISTS[kind];
    const index = latest.current[key].findIndex((x) => x.id === id);
    setData((d) => ({ ...d, [key]: d[key].filter((x) => x.id !== id) }));
    return index;
  }, []);

  const restore = useCallback((kind, item, index) => {
    const [key] = LISTS[kind];
    setData((d) => {
      if (d[key].some((x) => x.id === item.id)) return d;
      const list = [...d[key]];
      list.splice(Math.min(index, list.length), 0, item);
      return { ...d, [key]: list };
    });
  }, []);

  const value = useMemo(() => ({ ...data, save, remove, restore }), [data, save, remove, restore]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
