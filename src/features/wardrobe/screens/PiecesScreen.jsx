import { Search, Shirt } from "lucide-react";
import { Button, Chip, EmptyState, TextField } from "../../../design/components";
import { CATEGORIES, catMeta, seasonLabel } from "../model";

const meta = (i) => [i.color, i.brand, i.size && `Size ${i.size}`, i.season !== "all" && seasonLabel(i.season)].filter(Boolean);

/** The Pieces tab: search, room chips, and the clothes as a photo grid or a list. */
export default function PiecesScreen({ items, counts, cat, onCat, query, onQuery, view, onOpen, onImport, onAdd }) {
  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => {
    if (cat !== "all" && i.category !== cat) return false;
    if (!q) return true;
    return [i.name, i.color, i.brand, i.size, i.category, i.notes].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const groups = CATEGORIES
    .map((c) => ({ ...c, rows: shown.filter((i) => catMeta(i.category).name === c.name).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.rows.length);

  const used = Object.keys(counts).length;

  return (
    <main className="wd-page">
      <header className="wd-head">
        <p className="overline muted">{items.length} piece{items.length === 1 ? "" : "s"}{items.length ? ` · ${used} room${used === 1 ? "" : "s"}` : ""}</p>
        <h1 className="display">{cat === "all" ? "Wardrobe" : cat}</h1>
      </header>

      {items.length > 0 && (
        <>
          <TextField
            className="field-pill"
            label="Search clothes"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            leading={<Search size={22} />}
            type="search"
            autoComplete="off"
          />
          <nav className="chips-row" aria-label="Rooms">
            <Chip selected={cat === "all"} onClick={() => onCat("all")}>All <span className="wd-count">{items.length}</span></Chip>
            {CATEGORIES.filter((c) => counts[c.name] || c.name === cat).map((c) => (
              <Chip key={c.name} hue={c.hue} selected={cat === c.name} onClick={() => onCat(c.name)}>{c.name} <span className="wd-count">{counts[c.name] ?? 0}</span></Chip>
            ))}
          </nav>
        </>
      )}

      {items.length === 0 && (
        <EmptyState
          icon={<Shirt size={48} />}
          title="Your wardrobe is empty"
          action={<button className="wd-link state label-lg" onClick={onImport}>Import JSON</button>}
        >
          Add pieces one by one, or import a whole list from JSON.
        </EmptyState>
      )}

      {items.length > 0 && groups.length === 0 && (
        q ? (
          <EmptyState icon={<Search size={48} />} title="No matches">Try a different word or room.</EmptyState>
        ) : (
          <EmptyState icon={<Shirt size={48} />} title={`No ${cat} yet`} action={<Button onClick={onAdd}>Add one</Button>}>
            Nothing in this room yet.
          </EmptyState>
        )
      )}

      {groups.map((g) => (
        <section key={g.name} className="wd-group" aria-label={g.name}>
          {cat === "all" && <h3 className="label-lg muted">{g.name} <span className="wd-count">{g.rows.length}</span></h3>}
          {view === "grid" ? (
            <ul className="wd-grid">
              {g.rows.map((i) => {
                const details = [i.color, i.size && `Size ${i.size}`, i.season !== "all" && seasonLabel(i.season)].filter(Boolean);
                return (
                  <li key={i.id}>
                    <button className="wd-card state" onClick={() => onOpen(i)}>
                      <span className="wd-thumb">
                        {i.image && <img src={i.image} alt={i.name} decoding="async" />}
                      </span>
                      <span className="wd-cap">
                        {i.brand && <span className="wd-brand label-md">{i.brand}</span>}
                        <span className="title-md wd-name">{i.name}</span>
                        {details.length > 0 && <span className="wd-meta">{details.join(" · ")}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <ul className="wd-ul">
              {g.rows.map((i) => (
                <li key={i.id} className="acc" style={{ "--hue": g.hue }}>
                  <button className="wd-row state" onClick={() => onOpen(i)}>
                    <span className="wd-icon">{i.image && <img src={i.image} alt="" decoding="async" />}</span>
                    <span className="wd-main">
                      <span className="title-md">{i.name}</span>
                      {meta(i).length > 0 && <span className="body-md muted wd-meta">{meta(i).join(" · ")}</span>}
                      {i.notes && <span className="body-md muted wd-notes">{i.notes}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </main>
  );
}
