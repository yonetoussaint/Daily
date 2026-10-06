import { Shirt, Footprints, Watch, Snowflake, Sparkles, Dumbbell, Moon, Layers, Package, Sun, Tag, Cloud, Ruler, Waves } from "lucide-react";

export const uid = (prefix = "wd") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * The wardrobe's "rooms": where each piece lives. Listed head to toe (outfits sort by this order).
 * `match` are words an AI (or you) might use in JSON instead of the exact name; the longest match wins,
 * so "sweatshirt" lands in Sweaters, not Shirts. Old names (Tops, Bottoms, Outerwear, Sleep & Under) still map.
 * To add a room: add a line here. Everything else (tabs, cards, chips, import) picks it up.
 */
export const CATEGORIES = [
  { name: "T-Shirts", hue: 335, icon: Shirt, lobes: 10, amp: 0.06, match: ["t-shirt", "t shirt", "tshirt", "tee", "tank", "top"] },
  { name: "Sweaters", hue: 305, icon: Cloud, lobes: 8, amp: 0.07, match: ["sweater", "sweatshirt", "hoodie", "jumper", "pullover", "knit", "cardigan", "fleece"] },
  { name: "Shirts", hue: 235, icon: Tag, lobes: 7, amp: 0.08, match: ["shirt", "blouse", "polo"] },
  { name: "Dresses", hue: 350, icon: Sparkles, lobes: 12, amp: 0.05, match: ["dress", "gown", "jumpsuit", "romper", "skirt"] },
  { name: "Jeans", hue: 255, icon: Layers, lobes: 6, amp: 0.09, match: ["jean", "denim"] },
  { name: "Trousers", hue: 215, icon: Ruler, lobes: 9, amp: 0.07, match: ["trouser", "pants", "chino", "slacks", "legging", "cargo", "bottom"] },
  { name: "Shorts", hue: 55, icon: Sun, lobes: 11, amp: 0.05, match: ["shorts", "bermuda"] },
  { name: "Jackets", hue: 200, icon: Snowflake, lobes: 5, amp: 0.09, match: ["jacket", "coat", "blazer", "parka", "raincoat", "vest", "outer", "windbreaker", "bomber", "suit"] },
  { name: "Shoes", hue: 25, icon: Footprints, lobes: 8, amp: 0.07, match: ["shoe", "sneaker", "boot", "heels", "trainer", "loafer"] },
  { name: "Sandals", hue: 75, icon: Waves, lobes: 10, amp: 0.06, match: ["sandal", "flip flop", "flip-flop", "flipflop", "slides", "slipper", "sliders"] },
  { name: "Accessories", hue: 100, icon: Watch, lobes: 6, amp: 0.08, match: ["accessor", "hat", "cap", "scarf", "belt", "bag", "watch", "jewel", "glove", "tie", "sunglass", "glasses", "bracelet", "necklace", "beanie", "wallet"] },
  { name: "Activewear", hue: 155, icon: Dumbbell, lobes: 9, amp: 0.07, match: ["active", "sport", "gym", "workout", "running", "tracksuit", "swimsuit", "sweatpants", "jogger", "swim", "yoga"] },
  { name: "Underwear & Sleep", hue: 285, icon: Moon, lobes: 7, amp: 0.08, match: ["sleep", "pajama", "pyjama", "underwear", "sock", "lingerie", "undergarment", "loungewear", "boxers", "panties", "robe"] },
  { name: "Other", hue: 265, icon: Package, lobes: 8, amp: 0.07, match: [] },
];
export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

/** Turn free text ("t-shirt", "Jackets", an old category name) into one of the category names. */
export function normalizeCategory(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return "Other";
  const exact = CATEGORIES.find((c) => c.name.toLowerCase() === s);
  if (exact) return exact.name;
  const word = s.replace(/[^a-z\- ]/g, "");
  let best = null;
  let len = 0;
  for (const c of CATEGORIES) for (const m of c.match) if (word.includes(m) && m.length > len) { best = c; len = m.length; }
  return best ? best.name : "Other";
}

/** Meta for a category name. Old or unknown names are mapped, never lost. */
export const catMeta = (name) => CATEGORIES.find((c) => c.name === name) ?? CATEGORIES.find((c) => c.name === normalizeCategory(name));

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

export const EMPTY_ITEM = { name: "", category: "T-Shirts", color: "", brand: "", size: "", season: "all", notes: "", image: "" };
