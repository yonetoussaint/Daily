import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { APPS } from "./apps";
import "./AppDrawer.css";

/** Modal navigation drawer (Material 3): slides in from the left, lists every app in Daily. */
export default function AppDrawer({ open, onClose }) {
  const { pathname } = useLocation();
  const panelRef = useRef(null);
  const lastPath = useRef(pathname);

  // Close after any navigation
  useEffect(() => {
    if (lastPath.current !== pathname) onClose();
    lastPath.current = pathname;
  }, [pathname, onClose]);

  // Escape closes, background doesn't scroll, focus moves in and returns to the opener
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("a")?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener instanceof HTMLElement && opener.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <div className={`drawer-root ${open ? "is-open" : ""}`} inert={open ? undefined : ""}>
      <div className="drawer-scrim" onClick={onClose} />
      <aside ref={panelRef} className="drawer" role="dialog" aria-modal="true" aria-label="Apps">
        <div className="drawer-head">
          <h2 className="headline">Daily</h2>
          <p className="body-md">Organize your life</p>
        </div>
        <p className="drawer-section label-lg">Apps</p>
        <nav className="drawer-list" aria-label="Apps">
          {APPS.map(({ id, label, description, to, icon: Icon, hue, match }) => {
            const active = match(pathname);
            return (
              <NavLink
                key={id}
                to={to}
                className={`drawer-item state acc ${active ? "is-active" : ""}`}
                style={{ "--hue": hue }}
                aria-current={active ? "page" : undefined}
              >
                <span className="drawer-icon"><Icon size={22} /></span>
                <span className="drawer-text">
                  <span className="title-md">{label}</span>
                  <span className="body-md">{description}</span>
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
