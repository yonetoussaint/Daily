import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileUp, Grid3x3, LayoutGrid, List, Menu, Moon, Plus, Shirt, Sun, SunMoon } from "lucide-react";
import { Fab, IconButton, NavigationBar, TopAppBar, useScrollingDown, useSnackbar } from "../../../design/components";
import { useDrawer } from "../../../app/DrawerProvider";
import { useTheme } from "../../../app/useTheme";
import { useWardrobe } from "../WardrobeProvider";
import ItemSheet from "../components/ItemSheet";
import ImportSheet from "../components/ImportSheet";
import ExportSheet from "../components/ExportSheet";
import ItemDetail from "../components/ItemDetail";
import PiecesScreen from "./PiecesScreen";
import RoomsScreen from "./RoomsScreen";

// Same bottom bar as Home tasks: two destinations, a rail on wide screens.
const DESTINATIONS = [
  { id: "pieces", label: "Pieces", icon: <Shirt size={24} /> },
  { id: "rooms", label: "Rooms", icon: <LayoutGrid size={24} /> },
];
const TITLES = { pieces: "Wardrobe", rooms: "Rooms" };
const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function WardrobeScreen() {
  const drawer = useDrawer();
  const theme = useTheme();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const { items, saveItem, removeItem, restoreItem, importItems, restoreAll } = useWardrobe();
  const [tab, setTab] = useState("pieces");
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(() => { try { return localStorage.getItem("wardrobe-view") === "list" ? "list" : "grid"; } catch { return "grid"; } });
  const [sheet, setSheet] = useState(null); // { kind: "item", item? } | { kind: "import" } | { kind: "export" }
  const [detailId, setDetailId] = useState(null);
  const scrollY = useRef(0);
  const ThemeIcon = THEME_ICON[theme.mode];
  const detail = detailId ? items.find((i) => i.id === detailId) ?? null : null; // a deleted item falls back to the list

  const openDetail = (i) => { scrollY.current = window.scrollY; setDetailId(i.id); window.scrollTo(0, 0); };
  const closeDetail = () => setDetailId(null);
  useEffect(() => { if (!detail) window.scrollTo(0, scrollY.current); }, [detail]);

  const goTab = (t) => { setTab(t); window.scrollTo(0, 0); };
  const openRoom = (name) => { setCat(name); setQuery(""); goTab("pieces"); };

  const counts = useMemo(() => {
    const m = {};
    for (const i of items) m[i.category] = (m[i.category] ?? 0) + 1;
    return m;
  }, [items]);

  const del = (item) => {
    const index = removeItem(item.id);
    setSheet(null);
    setDetailId(null);
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

  const itemSheet = sheet?.kind === "item" && (
    <ItemSheet
      key={sheet.item?.id ?? "new"}
      item={sheet.item}
      defaultCategory={cat === "all" ? undefined : cat}
      onClose={() => setSheet(null)}
      onSave={(i) => { saveItem(i); setSheet(null); }}
      onDelete={() => del(sheet.item)}
    />
  );

  if (detail) {
    return (
      <>
        <ItemDetail item={detail} onBack={closeDetail} onEdit={() => setSheet({ kind: "item", item: detail })} onDelete={() => del(detail)} />
        {itemSheet}
      </>
    );
  }

  return (
    <div className="wd-shell">
      <NavigationBar items={DESTINATIONS} value={tab} onChange={goTab} />
      <div className="wd-shell-main">
        <TopAppBar
          title={TITLES[tab]}
          leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
          actions={
            <>
              {tab === "pieces" && (
                <IconButton label={view === "grid" ? "Switch to list" : "Switch to photo grid"} onClick={toggleView}>{view === "grid" ? <List size={22} /> : <Grid3x3 size={22} />}</IconButton>
              )}
              <IconButton label="Import JSON" onClick={() => setSheet({ kind: "import" })}><FileUp size={22} /></IconButton>
              <IconButton label="Export JSON" onClick={() => setSheet({ kind: "export" })} disabled={!items.length}><Download size={22} /></IconButton>
              <IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>
            </>
          }
        />
        {tab === "rooms" ? (
          <RoomsScreen counts={counts} total={items.length} onOpen={openRoom} />
        ) : (
          <PiecesScreen
            items={items}
            counts={counts}
            cat={cat}
            onCat={setCat}
            query={query}
            onQuery={setQuery}
            view={view}
            onOpen={openDetail}
            onImport={() => setSheet({ kind: "import" })}
            onAdd={() => setSheet({ kind: "item" })}
          />
        )}
      </div>

      <Fab className="wd-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New item" extended={!scrollingDown} onClick={() => setSheet({ kind: "item" })} />

      {itemSheet}
      {sheet?.kind === "import" && <ImportSheet onClose={() => setSheet(null)} onImport={doImport} />}
      {sheet?.kind === "export" && <ExportSheet items={items} onClose={() => setSheet(null)} />}
    </div>
  );
}
