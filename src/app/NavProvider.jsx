import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "daily-view";
const DEFAULT = { app: "home", tab: "tasks", bookId: null };

const NavContext = createContext({ ...DEFAULT });
export const useNav = () => useContext(NavContext);

function load() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return DEFAULT;
  }
}

/**
 * In-app navigation (no URLs): which app is open, which tab inside Home, which doc inside Docs.
 * The last view is remembered so a reload lands where you left off.
 */
export default function NavProvider({ children }) {
  const [view, setView] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(view)); } catch { /* storage unavailable */ }
  }, [view]);

  const goApp = useCallback((app) => setView((v) => (v.app === app ? v : { ...v, app, bookId: null })), []);
  const goTab = useCallback((tab) => setView((v) => ({ ...v, app: "home", tab })), []);
  const openBook = useCallback((bookId) => setView((v) => ({ ...v, app: "docs", bookId })), []);
  const closeBook = useCallback(() => setView((v) => ({ ...v, bookId: null })), []);

  const value = useMemo(() => ({ ...view, goApp, goTab, openBook, closeBook }), [view, goApp, goTab, openBook, closeBook]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
