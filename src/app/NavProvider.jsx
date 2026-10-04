import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

/**
 * In-app navigation on a single URL. The view is kept in `history.state`, so the system / browser
 * back button steps back through it (doc → library → home) instead of leaving the app, and a reload
 * restores the same view.
 *
 *   depth 0  launcher (home)
 *   depth 1  an app (tasks, docs)
 *   depth 2  a doc inside Docs
 */
const ROOT = { app: "launcher", tab: "tasks", bookId: null, depth: 0 };
const read = () => {
  const s = window.history.state;
  return window.location.pathname === "/" && s && typeof s.app === "string" ? { ...ROOT, ...s } : ROOT;
};

const NavContext = createContext({ ...ROOT });
export const useNav = () => useContext(NavContext);

export default function NavProvider({ children }) {
  const [view, setView] = useState(read);
  const ref = useRef(view);

  useEffect(() => {
    // Always live on "/": an old /docs or /docs/<id> URL (bookmark, previous build, history entry)
    // opens the launcher and is rewritten to "/", so back never lands on a stale path.
    const sync = () => {
      if (window.location.pathname !== "/") window.history.replaceState(ROOT, "", "/");
      else if (!window.history.state?.app) window.history.replaceState(ROOT, "", "/");
      ref.current = read();
      setView(ref.current);
    };
    if (window.location.pathname !== "/" || !window.history.state?.app) window.history.replaceState(ref.current, "", "/");
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const go = useCallback((next, push) => {
    ref.current = next;
    setView(next);
    if (push) window.history.pushState(next, "", "/");
    else window.history.replaceState(next, "", "/");
  }, []);

  const goApp = useCallback((app) => {
    const v = ref.current;
    if (app === "launcher") { if (v.depth > 0) window.history.go(-v.depth); return; }
    if (v.app === app && !v.bookId) return;
    go({ ...v, app, bookId: null, depth: 1 }, v.depth === 0);
  }, [go]);

  const goTab = useCallback((tab) => go({ ...ref.current, app: "tasks", tab }, false), [go]);
  const openBook = useCallback((bookId) => go({ ...ref.current, app: "docs", bookId, depth: 2 }, true), [go]);
  const closeBook = useCallback(() => {
    const v = ref.current;
    if (!v.bookId) return;
    if (v.depth === 2) window.history.back();
    else go({ ...v, bookId: null }, false);
  }, [go]);

  const value = useMemo(() => ({ ...view, goApp, goTab, openBook, closeBook }), [view, goApp, goTab, openBook, closeBook]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}
