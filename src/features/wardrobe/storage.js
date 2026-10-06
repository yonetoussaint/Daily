import { createStore, ms, ts } from "../../data/sync";

/** Table: wardrobe_items (see supabase/schema.sql). */
export const wardrobeStore = createStore({
  key: "wardrobe",
  tables: [{ name: "wardrobe_items", order: "created_at.desc.nullslast" }],
  toRows: (d) => ({
    wardrobe_items: d.items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? "Other",
      color: i.color ?? "",
      brand: i.brand ?? "",
      size: i.size ?? "",
      season: i.season ?? "all",
      notes: i.notes ?? "",
      image: i.image ?? "",
      created_at: ts(i.createdAt),
    })),
  }),
  fromRows: (r) => ({
    items: r.wardrobe_items.map((i) => ({
      id: i.id,
      name: i.name,
      category: i.category ?? "Other",
      color: i.color ?? "",
      brand: i.brand ?? "",
      size: i.size ?? "",
      season: i.season ?? "all",
      notes: i.notes ?? "",
      image: i.image ?? "",
      createdAt: ms(i.created_at),
    })),
  }),
});
