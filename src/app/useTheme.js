import { useEffect, useState } from "react";

const KEY = "daily-theme";
const ORDER = ["auto", "light", "dark"];

const read = () => {
  try { return localStorage.getItem(KEY) || "auto"; } catch { return "auto"; }
};

/** auto (follow the system) → light → dark. Applied as data-theme on <html>; index.html sets it before first paint. */
export function useTheme() {
  const [mode, setMode] = useState(read);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === "auto") root.removeAttribute("data-theme");
    else root.dataset.theme = mode;
    try { localStorage.setItem(KEY, mode); } catch { /* storage unavailable */ }
  }, [mode]);

  const cycle = () => setMode((m) => ORDER[(ORDER.indexOf(m) + 1) % ORDER.length]);
  return { mode, next: ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length], cycle };
}
