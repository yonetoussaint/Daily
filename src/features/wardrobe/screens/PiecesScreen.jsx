import { Images, Search, Shirt } from "lucide-react";
import { Button, Chip, EmptyState, TextField } from "../../../design/components";
import { CATEGORIES, OTHER, catMeta, seasonLabel } from "../model";
import { itemImages } from "../image";

const meta = (i) => [i.type, i.color, i.brand, i.size && `Size ${i.size}`, i.season !== "all" && seasonLabel(i.season)].filter(Boolean);

/** The Items tab: search, category chips, type chips, and everything as a photo grid or a list. */
export default function PiecesScreen({ items, counts, cat, onCat, type, onType, query, onQuery, view, onOpen, onImport, onAdd }) {
  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => {
    if (cat !== "all" && i.category !== cat) return false;
    if (type && i.type !== type) return false;
    if (!q) return true;
    return [i.name, i.color, i.brand, i.size, i.category, i.type, i.notes].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const groups = [...CATEGORIES, OTHER]
    .map((c) => ({ ...c, rows: shown.filter((i) => catMeta(i.category).name === c.name).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.rows.length);

  const used = Object.keys(counts).length;
  // Types in use inside the chosen category (the full list is offered when adding, not here).
  const typeList = (() => {
    if (cat === "all") return [];
    const m = new Map();
    for (const i of items) if (i.category === cat && i.type) m.set(i.type, (m.get(i.type) ?? 0) + 1);
    if (type && !m.has(type)) m.set(type, 0);
    const order = catMeta(cat).types;
    return [...m].sort((a, b) => (order.indexOf(a[0]) + 1 || 99) - (order.indexOf(b[0]) + 1 || 99) || a[0].localeCompare(b[0]));
  })();

  return (
    <main className="wd-page">
      <header className="wd-head">
        <p className="overline muted">{items.length} item{items.length === 1 ? "" : "s"}{items.length ? ` · ${used} categor${used === 1 ? "y" : "ies"}` : ""}</p>
        <h1 className="display">{cat === "all" ? "Everything" : cat}</h1>
      </header>

      {items.length > 0 && (
        <>
          <TextField
            className="field-pill"
            label="Search everything"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            leading={<Search size={22} />}
            type="search"
            autoComplete="off"
          />
          <nav className="chips-row" aria-label="Categories">
            <Chip selected={cat === "all"} onClick={() => onCat("all")}>All <span className="wd-count">{items.length}</span></Chip>
            {[...CATEGORIES, OTHER].filter((c) => counts[c.name] || c.name === cat).map((c) => (
              <Chip key={c.name} hue={c.hue} selected={cat === c.name} onClick={() => onCat(c.name)}>{c.name} <span className="wd-count">{counts[c.name] ?? 0}</span></Chip>
            ))}
          </nav>
          {cat !== "all" && typeList.length > 0 && (
            <nav className="chips-row" aria-label={`${cat} types`}>
              <Chip selected={!type} onClick={() => onType("")}>All {cat}</Chip>
              {typeList.map(([t, n]) => <Chip key={t} hue={catMeta(cat).hue} selected={type === t} onClick={() => onType(type === t ? "" : t)}>{t} <span className="wd-count">{n}</span></Chip>)}
            </nav>
          )}
        </>
      )}

      {items.length === 0 && (
        <EmptyState
          icon={<Shirt size={48} />}
          title="Nothing here yet"
          action={<button className="wd-link state label-lg" onClick={onImport}>Import JSON</button>}
        >
          Add items one by one, or import a whole list from JSON: clothes, footwear, skincare, fragrance, tools and more.
        </EmptyState>
      )}

      {items.length > 0 && groups.length === 0 && (
        q ? (
          <EmptyState icon={<Search size={48} />} title="No matches">Try a different word or category.</EmptyState>
        ) : (
          <EmptyState icon={<Shirt size={48} />} title={`No ${type || cat} yet`} action={<Button onClick={onAdd}>Add one</Button>}>
            Nothing in this category yet.
          </EmptyState>
        )
      )}

      {groups.map((g) => (
        <section key={g.name} className="wd-group" aria-label={g.name}>
          {cat === "all" && <h3 className="label-lg muted">{g.name} <span className="wd-count">{g.rows.length}</span></h3>}
          {view === "grid" ? (
            <ul className="wd-grid">
              {g.rows.map((i) => {
                const details = [i.type, i.color, i.size && `Size ${i.size}`, i.season !== "all" && seasonLabel(i.season)].filter(Boolean);
                return (
                  <li key={i.id}>
                    <button className="wd-card state" onClick={() => onOpen(i)}>
                      <span className="wd-thumb">
                        {itemImages(i)[0] && <img src={itemImages(i)[0]} alt={i.name} decoding="async" />}
                        {itemImages(i).length > 1 && <span className="wd-badge label-md" aria-label={`${itemImages(i).length} photos`}><Images size={13} aria-hidden="true" /> {itemImages(i).length}</span>}
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
                    <span className="wd-icon">{itemImages(i)[0] && <img src={itemImages(i)[0]} alt="" decoding="async" />}</span>
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
