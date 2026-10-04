import { createContext, useCallback, useContext, useMemo, useState } from "react";

/**
 * Plain in-memory navigation: no router, no URL changes, no history entries.
 *   app     "launcher" (home) | "tasks" | "docs"
 *   tab     the tab open inside Home tasks
 *   bookId  the doc open inside Docs (null = the library)
 * The back arrows call closeBook / goApp("launcher") — they only change this state.
 */
const ROOT = { app: "launcher", tab: "tasks", bookId: null };

const NavContext = createContext({ ...ROOT });
export const useNav = () => useContext(NavContext);

export default function NavProvider({ children }) {
  const [view, setView] = useState(ROOT);

  const goApp = useCallback((app) => setView((v) => ({ ...v, app, bookId: null })), []);
  const goTab = useCallback((tab) => setView((v) => ({ ...v, app: "tasks", tab })), []);
  const openBook = useCallback((bookId) => setView((v) => ({ ...v, app: "docs", bookId })), []);
  const closeBook = useCallback(() => setView((v) => ({ ...v, bookId: null })), []);

  const value = useMemo(() => ({ ...view, goApp, goTab, openBook, closeBook }), [view, goApp, goTab, openBook, closeBook]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
