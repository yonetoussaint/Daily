import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { Button, Chip, TextField } from "../../../design/components";
import { CATEGORIES, catMeta } from "../model";

/** Multi-select over the wardrobe. Rendered inside OutfitSheet (swapped in for the form). */
export default function PiecePicker({ pieces, selected, onChange, onDone }) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");

  const counts = useMemo(() => {
    const m = {};
    for (const p of pieces) m[p.category] = (m[p.category] ?? 0) + 1;
    return m;
  }, [pieces]);

  const q = query.trim().toLowerCase();
  const shown = pieces.filter((p) => {
    if (cat !== "all" && p.category !== cat) return false;
    if (!q) return true;
    return [p.name, p.color, p.brand, p.category].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="sheet-form">
      <TextField className="field-pill" label="Search wardrobe" value={query} onChange={(e) => setQuery(e.target.value)} leading={<Search size={22} />} type="search" autoComplete="off" />
      <nav className="chips-row of-picker-chips" aria-label="Categories">
        <Chip selected={cat === "all"} onClick={() => setCat("all")}>All</Chip>
        {CATEGORIES.filter((c) => counts[c.name]).map((c) => (
          <Chip key={c.name} hue={c.hue} selected={cat === c.name} onClick={() => setCat(c.name)}>{c.name}</Chip>
        ))}
      </nav>

      {shown.length === 0 ? (
        <p className="body-md muted of-picker-empty">{pieces.length ? "No matches." : "Your wardrobe is empty — add pieces in the Wardrobe app first."}</p>
      ) : (
        <ul className="of-pick-grid">
          {shown.map((p) => {
            const on = selected.includes(p.id);
            const meta = catMeta(p.category);
            return (
              <li key={p.id}>
                <button type="button" className={`of-pick state acc${on ? " is-on" : ""}`} style={{ "--hue": meta.hue }} aria-pressed={on} onClick={() => toggle(p.id)}>
                  <span className="of-pick-thumb">
                    {p.image ? <img src={p.image} alt="" decoding="async" /> : <meta.icon size={26} />}
                    {on && <span className="of-check"><Check size={16} strokeWidth={3} /></span>}
                  </span>
                  <span className="label-md of-pick-name">{p.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="sheet-actions">
        <Button variant="text" onClick={() => onChange([])} disabled={!selected.length}>Clear</Button>
        <Button onClick={onDone}>Done{selected.length ? ` (${selected.length})` : ""}</Button>
      </div>
    </div>
  );
}
