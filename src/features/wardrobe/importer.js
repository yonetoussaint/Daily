import { isImageValue, itemImages, MAX_IMAGES } from "./image";
import { CATEGORIES, EMPTY_ITEM, normalizeSeason, resolveKind } from "./model";

/* ── JSON import / export ────────────────────────────────────────────────────
 * Accepts either a bare array of items or an object with an "items" array,
 * and is forgiving about field names so AI-written JSON works first time.
 */

export const MAX_ITEMS = 2000;
const LIMITS = { name: 120, type: 40, color: 60, brand: 60, size: 30, notes: 1000 };

export const EXAMPLE_JSON = `{
  "items": [
    { "name": "White oxford shirt", "category": "Clothing", "type": "Shirts", "color": "White", "brand": "Uniqlo", "size": "M" },
    { "name": "Leather slides", "category": "Footwear", "type": "Sandals", "color": "Brown", "size": "43" },
    { "name": "Daily moisturizer SPF 30", "category": "Skincare", "type": "Sunscreen", "brand": "CeraVe" },
    { "name": "Bleu de Chanel", "category": "Fragrance", "type": "Eau de parfum", "size": "100 ml" },
    { "name": "Beard trimmer", "category": "Grooming Tools", "type": "Trimmer", "brand": "Philips" }
  ]
}`;

/** Prompt to hand to an AI (with a photo or a list of your clothes) so it answers in this format. */
export const AI_PROMPT = `Turn my things into JSON for my wardrobe and grooming app.

My things (clothes, shoes, skincare, grooming products, fragrances, accessories, tools): <LIST OR DESCRIBE THEM HERE>

Reply with ONLY valid JSON (no markdown code fences, no commentary) in exactly this shape:

{
  "items": [
    { "name": "White oxford shirt", "category": "Clothing", "type": "Shirts", "color": "White", "brand": "Uniqlo", "size": "M", "season": "all", "notes": "", "images": ["https://…/shirt-front.jpg", "https://…/shirt-back.jpg"] }
  ]
}

Rules:
- "name" is required. Everything else is optional.
- "images" is optional: a list of up to ${MAX_IMAGES} public https:// links to photos of the item, the first one is the cover (leave it out if you don't have any).
- "category" is one of the nine below, and "type" is one of the types listed under it:
${CATEGORIES.map((c) => `    ${c.name}: ${c.types.join(", ")}`).join("\n")}
- "season" is one of: "all", "warm", "cold".
- One object per item. Do not combine several items into one.
- Make sure the JSON is valid: double quotes, no trailing commas.`;

const text = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const first = (o, keys) => { for (const k of keys) if (o[k] != null && o[k] !== "") return o[k]; return ""; };

function stripFences(s) {
  const t = s.trim();
  const m = t.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
  return (m ? m[1] : t).replace(/^\uFEFF/, "");
}

/** Clean one raw entry into an item, or null when it has no name. */
export function cleanItem(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const name = text(first(raw, ["name", "title", "item"]), LIMITS.name);
  if (!name) return null;
  const notes = String(first(raw, ["notes", "note", "description"]) ?? "").trim().slice(0, LIMITS.notes);
  const item = {
    ...EMPTY_ITEM,
    name,
    ...resolveKind({ category: first(raw, ["category", "group", "kind"]), type: first(raw, ["type", "subcategory", "subtype"]), name }),
    color: text(first(raw, ["color", "colour"]), LIMITS.color),
    brand: text(raw.brand, LIMITS.brand),
    size: text(raw.size, LIMITS.size),
    season: normalizeSeason(raw.season),
    notes,
  };
  const photos = itemImages({ images: [].concat(raw.images ?? raw.photos ?? [], first(raw, ["image", "photo", "imageUrl"]) || []) });
  item.images = [...new Set(photos)];
  item.image = item.images[0] ?? "";
  const id = typeof raw.id === "string" ? raw.id.trim().slice(0, 60) : "";
  if (id) item.id = id;
  return item;
}

/** Parse pasted JSON. Throws an Error with a readable message; otherwise returns { items, skipped }. */
export function parseWardrobeJson(input) {
  const src = stripFences(String(input ?? ""));
  if (!src) throw new Error("Paste some JSON first.");
  let data;
  try {
    data = JSON.parse(src);
  } catch (err) {
    throw new Error(`That isn’t valid JSON (${err.message.replace(/^JSON\.parse: /, "")}).`);
  }
  const list = Array.isArray(data) ? data : [data?.items, data?.clothes, data?.wardrobe, data?.products].find(Array.isArray);
  if (!list) throw new Error("Expected a list of items, or an object with an \"items\" list.");
  if (list.length > MAX_ITEMS) throw new Error(`That’s ${list.length} items. Import up to ${MAX_ITEMS} at a time.`);
  const items = [];
  let skipped = 0;
  for (const raw of list) {
    const item = cleanItem(raw);
    if (item) items.push(item); else skipped += 1;
  }
  if (!items.length) throw new Error("No items with a \"name\" were found.");
  return { items, skipped };
}

/** The wardrobe as JSON text, in the same shape the importer reads (so it round-trips). */
export function exportJson(items, { photos = false } = {}) {
  const rows = items.map((it) => {
    const { id, name, category, type, color, brand, size, season, notes } = it;
    const imgs = itemImages(it);
    return { id, name, category, type, color, brand, size, season, notes, ...(photos && imgs.length ? { images: imgs } : {}) };
  });
  return JSON.stringify({ items: rows }, null, 2);
}
