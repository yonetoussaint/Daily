import { useEffect, useMemo, useRef } from "react";

/* Local-date helpers (ISO yyyy-mm-dd, no timezone surprises). */
export const isoOf = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const isoFromMs = (ms) => isoOf(new Date(ms));
export const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00`);
  d.setDate(d.getDate() + n);
  return isoOf(d);
};

const WEEKDAY = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const MONTH = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const FULL = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });

/**
 * Horizontal strip of days to browse by. Scroll or tap to pick a day; the selected day stays centred.
 *   value     selected day (ISO)
 *   onChange  (iso) => void
 *   marks     { [iso]: { done?: number, due?: number } }: a filled dot = tasks done, a ring = tasks still due
 *   past/future  how many days either side of today to offer
 */
export default function DayStrip({ value, onChange, marks = {}, hue, past = 120, future = 21, label = "Day" }) {
  const today = isoOf(new Date());
  const scroller = useRef(null);
  const first = useRef(true);
  const days = useMemo(() => Array.from({ length: past + future + 1 }, (_, i) => addDays(today, i - past)), [today, past, future]);

  // Keep the selected day centred (instantly on mount, smoothly afterwards).
  useEffect(() => {
    const box = scroller.current;
    const el = box?.querySelector('[aria-pressed="true"]');
    if (!box || !el) return;
    const left = el.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    box.scrollTo({ left, behavior: first.current ? "auto" : "smooth" });
    first.current = false;
  }, [value]);

  const step = (n) => onChange(addDays(value, n));
  const onKey = (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  };

  return (
    <section className="daystrip acc" style={hue != null ? { "--hue": hue } : undefined} aria-label={label}>
      <div className="daystrip-head">
        <span className="title-md">{MONTH.format(new Date(`${value}T00:00`))}</span>
        {value !== today && <button type="button" className="daystrip-today state label-lg" onClick={() => onChange(today)}>Today</button>}
      </div>
      <div className="daystrip-scroll" ref={scroller} onKeyDown={onKey} role="group">
        {days.map((iso) => {
          const d = new Date(`${iso}T00:00`);
          const m = marks[iso];
          const selected = iso === value;
          return (
            <button
              key={iso}
              type="button"
              className={`daystrip-day state${iso === today ? " is-today" : ""}${d.getDay() === 1 ? " is-monday" : ""}`}
              aria-pressed={selected}
              aria-current={iso === today ? "date" : undefined}
              aria-label={`${FULL.format(d)}${m?.done ? `, ${m.done} done` : ""}${m?.due ? `, ${m.due} due` : ""}`}
              onClick={() => onChange(iso)}
            >
              <span className="daystrip-wd label-md">{WEEKDAY.format(d)}</span>
              <span className="daystrip-num title-md">{d.getDate()}</span>
              <span className="daystrip-dots" aria-hidden="true">
                {m?.done > 0 && <i className="dot-done" />}
                {m?.due > 0 && <i className="dot-due" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
