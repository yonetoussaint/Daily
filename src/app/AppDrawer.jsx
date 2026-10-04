import { useEffect, useRef } from "react";
import { APPS, HOME } from "./apps";
import { useNav } from "./NavProvider";
import "./AppDrawer.css";

/** Modal navigation drawer (Material 3): slides in from the left, lists every app in Daily. */
export default function AppDrawer({ open, onClose }) {
  const { app, goApp } = useNav();
  const panelRef = useRef(null);

  const select = (id) => { goApp(id); onClose(); };

  // Escape closes, background doesn't scroll, focus moves in and returns to the opener
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("button")?.focus({ preventScroll: true });
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
        <nav className="drawer-list" aria-label="Apps">
          <DrawerItem item={HOME} active={app === HOME.id} onSelect={select} />
        </nav>
        <p className="drawer-section label-lg">Apps</p>
        <nav className="drawer-list" aria-label="Apps">
          {APPS.map((item) => (
            <DrawerItem key={item.id} item={item} active={app === item.id} onSelect={select} />
          ))}
        </nav>
      </aside>
    </div>
  );
}

function DrawerItem({ item: { id, label, description, icon: Icon, hue }, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`drawer-item state acc ${active ? "is-active" : ""}`}
      style={{ "--hue": hue }}
      aria-current={active ? "page" : undefined}
    >
      <span className="drawer-icon"><Icon size={22} /></span>
      <span className="drawer-text">
        <span className="title-md">{label}</span>
        <span className="body-md">{description}</span>
      </span>
    </button>
  );
}
