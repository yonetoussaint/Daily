import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Modal surface. A bottom sheet on phones, a centred dialog from 600px up.
 * Closes on Escape or scrim tap; restores focus to whatever opened it.
 */
export default function Sheet({ title, onClose, children, labelledBy = "sheet-title" }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onCloseRef.current();
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener instanceof HTMLElement && opener.focus?.();
    };
  }, []);

  return createPortal(
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id={labelledBy} className="headline sheet-title">{title}</h2>
        {children}
      </section>
    </div>,
    document.body
  );
}
