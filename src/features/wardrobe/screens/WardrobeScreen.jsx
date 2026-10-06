import { useMemo, useState } from "react";
import { Download, FileUp, LayoutGrid, List, Menu, Moon, Plus, Search, Shirt, Sun, SunMoon } from "lucide-react";
import { Chip, EmptyState, Fab, IconButton, TextField, TopAppBar, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useTheme } from "../../../app/useTheme";
import { useWardrobe } from "../WardrobeProvider";
import { CATEGORIES, catMeta, seasonLabel } from "../model";
import ItemSheet from "../components/ItemSheet";
import ImportSheet from "../components/ImportSheet";
import ExportSheet from "../components/ExportSheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function WardrobeScreen() {
  const drawer = useDrawer();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const { items, saveItem, removeItem, restoreItem, importItems, restoreAll } = useWardrobe();
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => { try { return localStorage.getItem("wardrobe-view") === "list" ? "list" : "grid"; } catch { return "grid"; } });
  const [sheet, setSheet] = useState(null); // { kind: "item", item? } | { kind: "import" } | { kind: "export" }
  const ThemeIcon = THEME_ICON[theme.mode];

  const counts = useMemo(() => {
    const m = {};
    for (const i of items) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, [items]);

  const activeCat = cat === "all" || counts[cat] ? cat : "all"; // an emptied category falls back to All
  const q = query.trim().toLowerCase();
  const shown = items.filter((i) => {
    if (activeCat !== "all" && i.category !== activeCat) return false;
    if (!q) return true;
    return [i.name, i.color, i.brand, i.size, i.category, i.notes].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const groups = CATEGORIES
    .map((c) => ({ ...c, rows: shown.filter((i) => catMeta(i.category).name === c.name).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.rows.length);

  const del = (item) => {
    const index = removeItem(item.id);
    setSheet(null);
    snackbar.show({ message: `Deleted “${item.name}”`, actionLabel: "Undo", onAction: () => restoreItem(item, index) });
  };

  const doImport = ({ items: incoming, skipped }) => {
    const { added, updated, undo } = importItems(incoming);
    setSheet(null);
    const parts = [];
    if (added) parts.push(`${added} added`);
    if (updated) parts.push(`${updated} updated`);
    if (skipped) parts.push(`${skipped} skipped`);
    snackbar.show({ message: `Imported: ${parts.join(", ")}`, actionLabel: "Undo", onAction: () => restoreAll(undo) });
  };

  const toggleView = () => setView((v) => { const n = v === "grid" ? "list" : "grid"; try { localStorage.setItem("wardrobe-view", n); } catch { /* storage unavailable */ } return n; });

  const meta = (i) => [i.color, i.brand, i.size && `Size ${i.size}`, i.season !== "all" && seasonLabel(i.season)].filter(Boolean);

  return (
    <>
      <TopAppBar
        title="Wardrobe"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={
          <>
            <IconButton label={view === "grid" ? "Switch to list" : "Switch to photo grid"} onClick={toggleView}>{view === "grid" ? <List size={22} /> : <LayoutGrid size={22} />}</IconButton>
            <IconButton label="Import JSON" onClick={() => setSheet({ kind: "import" })}><FileUp size={22} /></IconButton>
            <IconButton label="Export JSON" onClick={() => setSheet({ kind: "export" })} disabled={!items.length}><Download size={22} /></IconButton>
            <IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>
          </>
        }
      />
      <main className="wd-page">
        <header className="wd-head">
          <p className="overline muted">{items.length} piece{items.length === 1 ? "" : "s"}{items.length ? ` · ${Object.keys(counts).length} categories` : ""}</p>
          <h1 className="display">{activeCat === "all" ? "Wardrobe" : activeCat}</h1>
        </header>

        {items.length > 0 && (
          <>
            <TextField
              className="field-pill"
              label="Search clothes"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leading={<Search size={22} />}
              type="search"
              autoComplete="off"
            />
            <nav className="chips-row" aria-label="Categories">
              <Chip selected={activeCat === "all"} onClick={() => setCat("all")}>All <span className="wd-count">{items.length}</span></Chip>
              {CATEGORIES.filter((c) => counts[c.name]).map((c) => (
                <Chip key={c.name} hue={c.hue} selected={activeCat === c.name} onClick={() => setCat(c.name)}>{c.name} <span className="wd-count">{counts[c.name]}</span></Chip>
              ))}
            </nav>
          </>
        )}

        {items.length === 0 && (
          <EmptyState
            icon={<Shirt size={48} />}
            title="Your wardrobe is empty"
            action={<><button className="wd-link state label-lg" onClick={() => setSheet({ kind: "import" })}>Import JSON</button></>}
          >
            Add pieces one by one, or import a whole list from JSON.
          </EmptyState>
        )}

        {items.length > 0 && groups.length === 0 && (
          <EmptyState icon={<Search size={48} />} title="No matches">Try a different word or category.</EmptyState>
        )}

        {groups.map((g) => {
          return (
            <section key={g.name} className="wd-group" aria-label={g.name}>
              {activeCat === "all" && <h3 className="label-lg muted">{g.name} <span className="wd-count">{g.rows.length}</span></h3>}
              {view === "grid" ? (
                <ul className="wd-grid">
                  {g.rows.map((i) => {
                    const details = [i.color, i.size && `Size ${i.size}`, i.season !== "all" && seasonLabel(i.season)].filter(Boolean);
                    return (
                      <li key={i.id}>
                        <button className="wd-card state" onClick={() => setSheet({ kind: "item", item: i })}>
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
                      <button className="wd-row state" onClick={() => setSheet({ kind: "item", item: i })}>
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
          );
        })}
      </main>

      <Fab className="wd-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New item" extended={!scrollingDown} onClick={() => setSheet({ kind: "item" })} />

      {sheet?.kind === "item" && (
        <ItemSheet
          key={sheet.item?.id ?? "new"}
          item={sheet.item}
          defaultCategory={activeCat === "all" ? undefined : activeCat}
          onClose={() => setSheet(null)}
          onSave={(i) => { saveItem(i); setSheet(null); }}
          onDelete={() => del(sheet.item)}
        />
      )}
      {sheet?.kind === "import" && <ImportSheet onClose={() => setSheet(null)} onImport={doImport} />}
      {sheet?.kind === "export" && <ExportSheet items={items} onClose={() => setSheet(null)} />}
    </>
  );
}
