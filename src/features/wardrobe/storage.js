import { createStore, ms, ts } from "../../data/sync";
import { resolveKind } from "./model";
import { itemImages } from "./image";

/** Table: wardrobe_items (see supabase/schema.sql). */
export const wardrobeStore = createStore({
  key: "wardrobe",
  tables: [{ name: "wardrobe_items", order: "created_at.desc.nullslast" }],
  toRows: (d) => ({
    wardrobe_items: d.items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? "Other",
      type: i.type ?? "",
      color: i.color ?? "",
      brand: i.brand ?? "",
      size: i.size ?? "",
      season: i.season ?? "all",
      notes: i.notes ?? "",
      image: itemImages(i)[0] ?? "", // the cover; Outfits reads this
      images: itemImages(i),
      created_at: ts(i.createdAt),
    })),
  }),
  fromRows: (r) => ({
    items: r.wardrobe_items.map((i) => ({
      id: i.id,
      name: i.name,
      ...resolveKind({ category: i.category, type: i.type, name: i.name }), // old rooms (Shoes, Jeans…) are mapped to the new categories
      color: i.color ?? "",
      brand: i.brand ?? "",
      size: i.size ?? "",
      season: i.season ?? "all",
      notes: i.notes ?? "",
      image: itemImages(i)[0] ?? "",
      images: itemImages(i),
      createdAt: ms(i.created_at),
    })),
  }),
});
