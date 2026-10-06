import { createStore, ms, ts } from "../../data/sync";

/** Tables: outfits, outfit_items (see supabase/schema.sql). A link points at a wardrobe_items id. */
export const outfitsStore = createStore({
  key: "outfits",
  tables: [
    { name: "outfits", order: "created_at.desc.nullslast" },
    { name: "outfit_items", order: "position.asc" },
  ],
  toRows: (d) => ({
    outfits: d.outfits.map((o) => ({
      id: o.id,
      name: o.name,
      occasion: o.occasion ?? "casual",
      season: o.season ?? "all",
      notes: o.notes ?? "",
      favorite: !!o.favorite,
      wear_count: o.wearCount ?? 0,
      last_worn: ts(o.lastWorn),
      created_at: ts(o.createdAt),
    })),
    outfit_items: d.outfits.flatMap((o) =>
      [...new Set(o.itemIds ?? [])].map((itemId, i) => ({ id: `${o.id}~${itemId}`, outfit_id: o.id, item_id: itemId, position: i }))
    ),
  }),
  fromRows: (r) => {
    const links = new Map();
    for (const l of r.outfit_items) {
      if (!links.has(l.outfit_id)) links.set(l.outfit_id, []);
      links.get(l.outfit_id).push(l);
    }
    return {
      outfits: r.outfits.map((o) => ({
        id: o.id,
        name: o.name,
        occasion: o.occasion ?? "casual",
        season: o.season ?? "all",
        notes: o.notes ?? "",
        favorite: !!o.favorite,
        wearCount: o.wear_count ?? 0,
        lastWorn: ms(o.last_worn),
        createdAt: ms(o.created_at),
        itemIds: (links.get(o.id) ?? []).sort((a, b) => a.position - b.position).map((l) => l.item_id),
      })),
    };
  },
});
