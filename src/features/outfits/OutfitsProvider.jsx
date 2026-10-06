import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import SyncGate from "../../data/SyncGate";
import { selectAll } from "../../data/db";
import useStore from "../../data/useStore";
import { isWearable, resolveKind } from "../wardrobe/model";
import { uid } from "./model";
import { outfitsStore } from "./storage";

const Ctx = createContext(null);
export const useOutfits = () => useContext(Ctx);

const EMPTY = { outfits: [] };

/**
 * Owns the outfits. Each outfit only stores the ids of wardrobe pieces; the pieces themselves
 * are read (never written) from the Wardrobe app's table, so editing a piece there updates every outfit.
 */
export default function OutfitsProvider({ children }) {
  const [loaded, setData, status, reload] = useStore(outfitsStore);
  const data = loaded ?? EMPTY;
  const latest = useRef(data);
  latest.current = data;

  const [pieces, setPieces] = useState([]);
  const [piecesError, setPiecesError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    selectAll("wardrobe_items", "name.asc")
      .then((rows) => {
        if (cancelled) return;
        setPieces(rows.map((i) => ({ ...i, category: resolveKind({ category: i.category, type: i.type, name: i.name }).category })).filter((i) => isWearable(i.category)).map((i) => ({
          id: i.id,
          name: i.name,
          category: i.category,
          color: i.color ?? "",
          brand: i.brand ?? "",
          size: i.size ?? "",
          season: i.season ?? "all",
          image: i.image ?? "",
        })));
        setPiecesError(false);
      })
      .catch(() => { if (!cancelled) setPiecesError(true); });
    return () => { cancelled = true; };
  }, [status]);

  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.id, p])), [pieces]);

  /** Add (no id) or replace (same id). Returns the outfit's id. */
  const saveOutfit = useCallback((outfit) => {
    const id = outfit.id ?? uid("of");
    setData((d) => {
      if (outfit.id && d.outfits.some((x) => x.id === outfit.id)) {
        return { ...d, outfits: d.outfits.map((x) => (x.id === outfit.id ? { ...x, ...outfit } : x)) };
      }
      return { ...d, outfits: [{ wearCount: 0, lastWorn: undefined, ...outfit, id, createdAt: Date.now() }, ...d.outfits] };
    });
    return id;
  }, []);

  const removeOutfit = useCallback((id) => {
    const index = latest.current.outfits.findIndex((x) => x.id === id);
    setData((d) => ({ ...d, outfits: d.outfits.filter((x) => x.id !== id) }));
    return index;
  }, []);

  const restoreOutfit = useCallback((outfit, index) => {
    setData((d) => {
      if (d.outfits.some((x) => x.id === outfit.id)) return d;
      const outfits = [...d.outfits];
      outfits.splice(Math.min(index, outfits.length), 0, outfit);
      return { ...d, outfits };
    });
  }, []);

  const toggleFavorite = useCallback((id) => {
    setData((d) => ({ ...d, outfits: d.outfits.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)) }));
  }, []);

  /** Log that the outfit was worn today. */
  const markWorn = useCallback((id) => {
    setData((d) => ({ ...d, outfits: d.outfits.map((x) => (x.id === id ? { ...x, wearCount: (x.wearCount ?? 0) + 1, lastWorn: Date.now() } : x)) }));
  }, []);

  const value = useMemo(
    () => ({ ...data, pieces, pieceById, piecesError, saveOutfit, removeOutfit, restoreOutfit, toggleFavorite, markWorn }),
    [data, pieces, pieceById, piecesError, saveOutfit, removeOutfit, restoreOutfit, toggleFavorite, markWorn]
  );
  return (
    <Ctx.Provider value={value}>
      <SyncGate status={status} onRetry={reload}>{children}</SyncGate>
    </Ctx.Provider>
  );
}
