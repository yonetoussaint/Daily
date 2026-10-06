import { Shirt, Footprints, Watch, Snowflake, Sparkles, Dumbbell, Moon, Layers, Package } from "lucide-react";

export const uid = (prefix = "wd") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/** Where each piece lives. `match` are words an AI (or you) might use in JSON instead of the exact name. */
export const CATEGORIES = [
  { name: "Tops", hue: 335, icon: Shirt, match: ["top", "shirt", "t-shirt", "tee", "blouse", "sweater", "jumper", "hoodie", "polo", "knit"] },
  { name: "Bottoms", hue: 235, icon: Layers, match: ["bottom", "pants", "trousers", "jeans", "shorts", "skirt", "leggings"] },
  { name: "Outerwear", hue: 200, icon: Snowflake, match: ["outer", "jacket", "coat", "blazer", "parka", "raincoat", "vest"] },
  { name: "Dresses", hue: 350, icon: Sparkles, match: ["dress", "jumpsuit", "suit", "romper", "gown"] },
  { name: "Shoes", hue: 25, icon: Footprints, match: ["shoe", "sneakers", "boots", "sandals", "heels", "trainers", "loafers"] },
  { name: "Accessories", hue: 85, icon: Watch, match: ["accessory", "hat", "cap", "scarf", "belt", "bag", "watch", "jewelry", "jewellery", "gloves", "tie", "sunglasses"] },
  { name: "Activewear", hue: 155, icon: Dumbbell, match: ["active", "sport", "sports", "gym", "workout", "running"] },
  { name: "Sleep & Under", hue: 285, icon: Moon, match: ["sleep", "pajamas", "pyjamas", "underwear", "socks", "lingerie", "undergarments", "loungewear"] },
  { name: "Other", hue: 265, icon: Package, match: [] },
];
export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);
export const catMeta = (name) => CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];

/** Turn free text ("t-shirt", "Jackets") into one of the category names. */
export function normalizeCategory(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "Other";
  const exact = CATEGORIES.find((c) => c.name.toLowerCase() === s);
  if (exact) return exact.name;
  const word = s.replace(/[^a-z\- ]/g, "");
  const hit = CATEGORIES.find((c) => c.match.some((m) => word === m || word === `${m}s` || word === `${m}es` || word.includes(m)));
  return hit ? hit.name : "Other";
}

export const SEASONS = [
  { id: "all", label: "All year" },
  { id: "warm", label: "Warm" },
  { id: "cold", label: "Cold" },
];
export const seasonLabel = (id) => SEASONS.find((s) => s.id === id)?.label ?? "All year";

export function normalizeSeason(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (["warm", "summer", "spring", "spring/summer", "spring-summer", "hot"].includes(s)) return "warm";
  if (["cold", "winter", "autumn", "fall", "autumn/winter", "fall/winter", "autumn-winter"].includes(s)) return "cold";
  return "all";
}

export const EMPTY_ITEM = { name: "", category: "Tops", color: "", brand: "", size: "", season: "all", notes: "" };
