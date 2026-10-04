import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { uid, upsert } from "./model";
import SyncGate from "../../data/SyncGate";
import useStore from "../../data/useStore";
import { valuesStore } from "./storage";

const Ctx = createContext(null);
export const useValues = () => useContext(Ctx);

/** The three lists and the id prefix of each. */
export const LISTS = { value: ["values", "vl"], principle: ["principles", "pr"], reflection: ["reflections", "rf"] };

const EMPTY = { values: [], principles: [], reflections: [] };

/** Owns the values, principles and journal. Stored in Supabase (life_values, life_principles, life_reflections); changes are saved shortly after and flushed on exit. */
export default function ValuesProvider({ children }) {
  const [loaded, setData, status, reload] = useStore(valuesStore);
  const data = loaded ?? EMPTY;
  const latest = useRef(data);
  latest.current = data;

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
  return (
    <Ctx.Provider value={value}>
      <SyncGate status={status} onRetry={reload}>{children}</SyncGate>
    </Ctx.Provider>
  );
}
