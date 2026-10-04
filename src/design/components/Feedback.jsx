import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cookie } from "../shapes";

/* ── Wavy progress indicator: the filled part undulates, the remainder is a flat track ── */
export function WavyProgress({ value, total, label }) {
  const pct = total === 0 ? 0 : Math.min(100, (value / total) * 100);
  return (
    <div
      className="wavy"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
      style={{ "--pct": `${pct}%` }}
    >
      <span className="wavy-fill" />
      <span className="wavy-track" />
    </div>
  );
}

/* ── Empty state ── */
export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="empty-shape" style={{ clipPath: cookie(9, 0.08) }}>{icon}</div>
      <h2 className="title-lg">{title}</h2>
      {children && <p className="body-md muted">{children}</p>}
      {action}
    </div>
  );
}

/* ── Snackbar (one at a time, optional action) ── */
const SnackbarContext = createContext(null);
export const useSnackbar = () => useContext(SnackbarContext);

export function SnackbarProvider({ children }) {
  const [snack, setSnack] = useState(null);
  const timer = useRef(0);
  const seq = useRef(0);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setSnack(null);
  }, []);

  const show = useCallback(({ message, actionLabel, onAction, onDismiss, duration = 5000 }) => {
    clearTimeout(timer.current);
    const id = ++seq.current;
    setSnack({ id, message, actionLabel, onAction, onDismiss });
    timer.current = setTimeout(() => setSnack((s) => (s?.id === id ? null : s)), duration);
    return id;
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);
  const api = useMemo(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <SnackbarContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="snackbar-host" aria-live="polite">
          {snack && (
            <div className="snackbar" key={snack.id} role="status">
              <span className="snackbar-text body-md">{snack.message}</span>
              {snack.actionLabel && (
                <button
                  className="snackbar-action state label-lg"
                  onClick={() => { snack.onAction?.(); dismiss(); }}
                >
                  {snack.actionLabel}
                </button>
              )}
              <button className="snackbar-close state" aria-label="Dismiss" onClick={dismiss}>
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" fill="none" /></svg>
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </SnackbarContext.Provider>
  );
}
