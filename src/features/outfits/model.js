import { CATEGORIES } from "../wardrobe/model";

export { SEASONS, seasonLabel, catMeta, CATEGORIES } from "../wardrobe/model";

export const uid = (prefix = "of") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

export const OCCASIONS = [
  { id: "casual", label: "Casual", hue: 155 },
  { id: "work", label: "Work", hue: 235 },
  { id: "formal", label: "Formal", hue: 285 },
  { id: "evening", label: "Evening", hue: 350 },
  { id: "sport", label: "Sport", hue: 200 },
  { id: "home", label: "Home", hue: 85 },
  { id: "other", label: "Other", hue: 265 },
];
export const occasionMeta = (id) => OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[OCCASIONS.length - 1];

export const EMPTY_OUTFIT = { name: "", occasion: "casual", season: "all", notes: "", favorite: false, itemIds: [] };

/** Head to toe: how an outfit's pieces are laid out. */
const ORDER = ["Tops", "Dresses", "Bottoms", "Outerwear", "Shoes", "Accessories", "Activewear", "Sleep & Under", "Other"];
const rank = (cat) => { const i = ORDER.indexOf(cat); return i < 0 ? ORDER.length : i; };

/** Sort wardrobe pieces head to toe (stable inside a category). */
export const sortPieces = (pieces) => [...pieces].sort((a, b) => rank(a.category) - rank(b.category));

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export const fmtDate = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");
