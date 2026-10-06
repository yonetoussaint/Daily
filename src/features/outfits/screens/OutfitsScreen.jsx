import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Menu, Moon, Plus, Search, Shirt, Sparkles, Sun, SunMoon } from "lucide-react";
import { Button, Chip, EmptyState, Fab, IconButton, TextField, TopAppBar, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useNav } from "../../../app/NavProvider";
import { useTheme } from "../../../app/useTheme";
import { OCCASIONS, occasionMeta, seasonLabel, sortPieces } from "../model";
import { useOutfits } from "../OutfitsProvider";
import Collage from "../components/Collage";
import OutfitDetail from "../components/OutfitDetail";
import OutfitSheet from "../components/OutfitSheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function OutfitsScreen() {
  const drawer = useDrawer();
  const { goApp } = useNav();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const { outfits, pieces, pieceById, saveOutfit, removeOutfit, restoreOutfit } = useOutfits();
  const [filter, setFilter] = useState("all"); // all | fav | occasion id
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(null); // { outfit? }
  const [detailId, setDetailId] = useState(null);
  const scrollY = useRef(0);
  const ThemeIcon = THEME_ICON[theme.mode];
  const detail = detailId ? outfits.find((o) => o.id === detailId) ?? null : null;

  const openDetail = (o) => { scrollY.current = window.scrollY; setDetailId(o.id); window.scrollTo(0, 0); };
  useEffect(() => { if (!detail) window.scrollTo(0, scrollY.current); }, [detail]);

  const counts = useMemo(() => {
    const m = { fav: 0 };
    for (const o of outfits) { m[o.occasion] = (m[o.occasion] ?? 0) + 1; if (o.favorite) m.fav += 1; }
    return m;
  }, [outfits]);

  const active = filter === "all" || counts[filter] ? filter : "all";
  const q = query.trim().toLowerCase();
  const shown = outfits.filter((o) => {
    if (active === "fav" && !o.favorite) return false;
    if (active !== "all" && active !== "fav" && o.occasion !== active) return false;
    if (!q) return true;
    const names = o.itemIds.map((id) => pieceById.get(id)?.name ?? "");
    return [o.name, o.notes, occasionMeta(o.occasion).label, ...names].some((v) => (v ?? "").toLowerCase().includes(q));
  });

  const del = (outfit) => {
    const index = removeOutfit(outfit.id);
    setSheet(null);
    setDetailId(null);
    snackbar.show({ message: `Deleted “${outfit.name}”`, actionLabel: "Undo", onAction: () => restoreOutfit(outfit, index) });
  };

  const save = (o) => {
    const id = saveOutfit(o);
    setSheet(null);
    if (!o.id) setDetailId(id);
  };

  const sheetEl = sheet && (
    <OutfitSheet key={sheet.outfit?.id ?? "new"} outfit={sheet.outfit} onClose={() => setSheet(null)} onSave={save} onDelete={() => del(sheet.outfit)} />
  );

  if (detail) {
    return (
      <>
        <OutfitDetail outfit={detail} onBack={() => setDetailId(null)} onEdit={() => setSheet({ outfit: detail })} onDelete={() => del(detail)} />
        {sheetEl}
      </>
    );
  }

  return (
    <>
      <TopAppBar
        title="Outfits"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={<IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>}
      />
      <main className="wd-page">
        <header className="wd-head">
          <p className="overline muted">{outfits.length} outfit{outfits.length === 1 ? "" : "s"}{pieces.length ? ` · ${pieces.length} pieces in wardrobe` : ""}</p>
          <h1 className="display">Outfits</h1>
        </header>

        {outfits.length > 0 && (
          <>
            <TextField className="field-pill" label="Search outfits or pieces" value={query} onChange={(e) => setQuery(e.target.value)} leading={<Search size={22} />} type="search" autoComplete="off" />
            <nav className="chips-row" aria-label="Filters">
              <Chip selected={active === "all"} onClick={() => setFilter("all")}>All <span className="wd-count">{outfits.length}</span></Chip>
              {counts.fav > 0 && <Chip icon={<Heart size={16} />} selected={active === "fav"} onClick={() => setFilter("fav")}>Favourites <span className="wd-count">{counts.fav}</span></Chip>}
              {OCCASIONS.filter((o) => counts[o.id]).map((o) => (
                <Chip key={o.id} hue={o.hue} selected={active === o.id} onClick={() => setFilter(o.id)}>{o.label} <span className="wd-count">{counts[o.id]}</span></Chip>
              ))}
            </nav>
          </>
        )}

        {outfits.length === 0 && (
          <EmptyState
            icon={pieces.length ? <Sparkles size={48} /> : <Shirt size={48} />}
            title={pieces.length ? "No outfits yet" : "Your wardrobe is empty"}
            action={pieces.length
              ? <Button onClick={() => setSheet({})}>Create your first outfit</Button>
              : <Button onClick={() => goApp("wardrobe")}>Open Wardrobe</Button>}
          >
            {pieces.length ? "Combine pieces from your wardrobe into looks you can reuse." : "Add some pieces in the Wardrobe app first, then build outfits from them here."}
          </EmptyState>
        )}

        {outfits.length > 0 && shown.length === 0 && <EmptyState icon={<Search size={48} />} title="No matches">Try a different word or filter.</EmptyState>}

        {shown.length > 0 && (
          <ul className="wd-grid of-grid">
            {shown.map((o) => {
              const parts = sortPieces(o.itemIds.map((id) => pieceById.get(id)).filter(Boolean));
              const occ = occasionMeta(o.occasion);
              const meta = [occ.label, o.season !== "all" && seasonLabel(o.season), `${parts.length} piece${parts.length === 1 ? "" : "s"}`].filter(Boolean);
              return (
                <li key={o.id}>
                  <button className="wd-card state of-card" onClick={() => openDetail(o)}>
                    <span className="wd-thumb of-thumb"><Collage pieces={parts} /></span>
                    <span className="wd-cap">
                      <span className="title-md wd-name">{o.favorite && <Heart size={14} fill="currentColor" className="of-fav" />} {o.name}</span>
                      <span className="wd-meta">{meta.join(" · ")}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Fab className="wd-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New outfit" extended={!scrollingDown} onClick={() => setSheet({})} />
      {sheetEl}
    </>
  );
}
