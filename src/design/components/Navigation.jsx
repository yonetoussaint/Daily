import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

/** Bottom navigation bar on phones, navigation rail from 840px up. */
export function NavigationBar({ items }) {
  return (
    <nav className="nav" aria-label="Primary">
      {items.map(({ to, label, icon, end }) => (
        <NavLink key={to} to={to} end={end} className="nav-item">
          <span className="nav-indicator state">{icon}</span>
          <span className="nav-label label-md">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/** Small sticky app bar; the title fades in once the large screen title scrolls away. */
export function TopAppBar({ title, actions, leading, persistentTitle = false }) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const onScroll = () => setCollapsed(window.scrollY > 72);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`top-bar ${collapsed ? "is-collapsed" : ""} ${leading ? "has-leading" : ""} ${persistentTitle ? "is-persistent" : ""}`}>
      {leading}
      <h2 className="top-bar-title title-lg" aria-hidden={!collapsed && !persistentTitle}>{title}</h2>
      <div className="top-bar-actions">{actions}</div>
    </header>
  );
}

/** Tracks scroll direction so the FAB can collapse while the user scrolls down. */
export function useScrollingDown(threshold = 12) {
  const [down, setDown] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < threshold) return;
      setDown(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return down;
}
