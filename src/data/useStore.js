import { useCallback, useEffect, useRef, useState } from "react";
import { useSnackbar } from "../design/components";

/**
 * Loads an app's state from its store and saves every change back.
 * Returns [state, setState, status, reload] — state is null until status is "ready".
 */
export default function useStore(store) {
  const snackbar = useSnackbar();
  const [state, setState] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const latest = useRef(null);
  latest.current = state;
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    store.setErrorHandler(() => snackbar.show({ message: "Couldn’t save to the database — will keep trying" }));
  }, [store, snackbar]);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    store.load()
      .then((s) => { if (!cancelled) { setState(s); setStatus("ready"); } })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [store, attempt]);

  useEffect(() => { if (status === "ready" && state) store.schedule(state); }, [store, state, status]);

  // Never lose the last edit: save when the tab is hidden or closed, and when leaving the app.
  useEffect(() => {
    const flush = () => store.flush({ keepalive: true });
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [store]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return [state, setState, status, reload];
}
