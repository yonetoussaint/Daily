import { useState } from "react";
import { Compass, NotebookPen, Scale } from "lucide-react";
import { Chip, EmptyState } from "../../../design/components";
import { cookie } from "../../../design/shapes";
import { CATEGORIES, REFLECTION_KINDS, categoryInfo, kindInfo, tally } from "../model";

const fmt = (ms) => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function CategoryChips({ value, onChange }) {
  return (
    <nav className="chips-row" aria-label="Area of life">
      <Chip selected={value === "all"} onClick={() => onChange("all")}>All</Chip>
      {CATEGORIES.map((c) => <Chip key={c.id} hue={c.hue} icon={<c.icon size={18} />} selected={value === c.id} onClick={() => onChange(c.id)}>{c.label}</Chip>)}
    </nav>
  );
}

export function ValuesTab({ values, reflections, onOpen }) {
  const [cat, setCat] = useState("all");
  const rows = values.filter((v) => cat === "all" || v.category === cat);
  return (
    <>
      <CategoryChips value={cat} onChange={setCat} />
      {rows.length === 0 && <EmptyState icon={<Compass size={48} />} title="No values here yet">Name what matters most to you, in your own words.</EmptyState>}
      <ul className="vals-list">
        {rows.map((v, i) => {
          const c = categoryInfo(v.category);
          const { lived, short } = tally(reflections, v.id);
          return (
            <li key={v.id}>
              <button className="val-card acc state" style={{ "--hue": c.hue }} onClick={() => onOpen(v)}>
                <span className="val-mark" style={{ clipPath: cookie(i % 2 ? 8 : 12, 0.075) }}><c.icon size={26} /></span>
                <span className="val-text">
                  <span className="title-lg">{v.title}</span>
                  {v.meaning && <span className="body-md val-meaning">{v.meaning}</span>}
                </span>
                <span className="val-foot label-md">
                  <span>{c.label}</span>
                  {(lived > 0 || short > 0) && <span>Lived it {lived} · Fell short {short}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function PrinciplesTab({ principles, values, onOpen }) {
  const [cat, setCat] = useState("all");
  const rows = principles.filter((p) => cat === "all" || p.category === cat);
  const title = (id) => values.find((v) => v.id === id)?.title;
  return (
    <>
      <CategoryChips value={cat} onChange={setCat} />
      {rows.length === 0 && <EmptyState icon={<Scale size={48} />} title="No principles here yet">Write a rule you want to live by, like “I listen before I answer”.</EmptyState>}
      <ul className="vals-list">
        {rows.map((p) => {
          const c = categoryInfo(p.category);
          const because = title(p.valueId);
          return (
            <li key={p.id}>
              <button className="pr-card acc state" style={{ "--hue": c.hue }} onClick={() => onOpen(p)}>
                <span className="title-md">{p.title}</span>
                {p.why && <span className="body-md muted">{p.why}</span>}
                <span className="pr-meta label-md">
                  <span className="pr-cat"><c.icon size={14} />{c.label}</span>
                  {because && <span>Value: {because}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function JournalTab({ reflections, values, onOpen }) {
  const [kind, setKind] = useState("all");
  const rows = reflections.filter((r) => kind === "all" || r.kind === kind).sort((a, b) => b.createdAt - a.createdAt);
  const title = (id) => values.find((v) => v.id === id)?.title;
  return (
    <>
      <nav className="chips-row" aria-label="Type">
        <Chip selected={kind === "all"} onClick={() => setKind("all")}>All</Chip>
        {REFLECTION_KINDS.map((k) => <Chip key={k.id} hue={k.hue} icon={<k.icon size={18} />} selected={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</Chip>)}
      </nav>
      {rows.length === 0 && <EmptyState icon={<NotebookPen size={48} />} title="Nothing written yet">Note the days you lived your values, and the days you didn’t.</EmptyState>}
      <ul className="vals-list">
        {rows.map((r) => {
          const k = kindInfo(r.kind);
          const v = title(r.valueId);
          return (
            <li key={r.id}>
              <button className="note-card acc state" style={{ "--hue": k.hue }} onClick={() => onOpen(r)}>
                <span className="note-icon"><k.icon size={20} /></span>
                <span className="note-text">
                  <span className="title-md">{r.title}</span>
                  {r.body && <span className="body-md muted note-body">{r.body}</span>}
                  <span className="label-md muted">{k.label}{v ? `, ${v}` : ""}, {fmt(r.createdAt)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export const TABS = [
  { value: "values", label: "Values", icon: <Compass size={18} /> },
  { value: "principles", label: "Principles", icon: <Scale size={18} /> },
  { value: "journal", label: "Journal", icon: <NotebookPen size={18} /> },
];
