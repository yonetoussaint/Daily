import { Shirt, Footprints, Droplets, Smile, ShowerHead, SprayCan, Scissors, Watch, Wrench, Package } from "lucide-react";

export const uid = (prefix = "wd") => `${prefix}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * The nine categories, in this order. Each has a list of types (what the thing is).
 * `wearable` categories are the ones Outfits can mix (Clothing, Footwear, Accessories).
 * To add a category or type: add it here. Tabs, cards, chips, import and export all pick it up.
 */
export const CATEGORIES = [
  { name: "Clothing", hue: 335, icon: Shirt, lobes: 10, amp: 0.06, wearable: true, blurb: "Things you wear",
    types: ["Shirts", "T-shirts", "Pants", "Jeans", "Shorts", "Jackets", "Suits", "Underwear", "Socks", "Sleepwear"] },
  { name: "Footwear", hue: 25, icon: Footprints, lobes: 8, amp: 0.07, wearable: true, blurb: "Things you wear on your feet",
    types: ["Sneakers", "Dress shoes", "Boots", "Sandals", "Slippers"] },
  { name: "Skincare", hue: 160, icon: Droplets, lobes: 12, amp: 0.05, blurb: "Clean, healthy, good-looking skin",
    types: ["Face wash", "Cleanser", "Moisturizer", "Sunscreen", "Serum", "Toner", "Exfoliator", "Acne treatments", "Body lotion", "Body scrub", "Lip balm"] },
  { name: "Oral Care", hue: 195, icon: Smile, lobes: 9, amp: 0.07, blurb: "Mouth and teeth",
    types: ["Toothbrush", "Toothpaste", "Mouthwash", "Floss", "Tongue scraper", "Whitening products"] },
  { name: "Body Care", hue: 225, icon: ShowerHead, lobes: 7, amp: 0.08, blurb: "Clean and well-groomed body",
    types: ["Body wash", "Soap", "Deodorant", "Shampoo", "Conditioner", "Body scrub", "Body oil", "Hand cream"] },
  { name: "Fragrance", hue: 305, icon: SprayCan, lobes: 11, amp: 0.05, blurb: "Smell excellent",
    types: ["Perfume", "Eau de parfum", "Eau de toilette", "Cologne", "Body spray", "Body mist", "Fragrance oil", "Perfume lotion"] },
  { name: "Hair & Grooming", hue: 55, icon: Scissors, lobes: 6, amp: 0.09, blurb: "Hair, beard and general appearance",
    types: ["Shampoo", "Conditioner", "Hair oil", "Hair cream", "Pomade", "Hair gel", "Beard oil", "Beard balm", "Shaving cream", "Razor", "Aftershave"] },
  { name: "Accessories", hue: 100, icon: Watch, lobes: 6, amp: 0.08, wearable: true, blurb: "Complete your outfit",
    types: ["Watches", "Sunglasses", "Belts", "Wallets", "Hats & caps", "Bracelets", "Necklaces", "Rings", "Bags"] },
  { name: "Grooming Tools", hue: 255, icon: Wrench, lobes: 9, amp: 0.07, blurb: "The tools, not the products",
    types: ["Comb", "Hairbrush", "Trimmer", "Razor", "Nail clipper", "Tweezers", "Scissors", "Electric toothbrush"] },
];

/** Catch-all for things that match nothing. Never offered as a choice; only shown once something lands in it. */
export const OTHER = { name: "Other", hue: 265, icon: Package, lobes: 8, amp: 0.07, blurb: "Not sorted yet", types: [] };
export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

const lc = (s) => String(s ?? "").trim().toLowerCase();
const clean = (s, max = 60) => String(s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
/** "Jeans" → "jean", "Hats & caps" → ["hat", "cap"]: lets "hat", "Hats" and "caps" all match. */
const stems = (s) => lc(s).split(/\s*[&/,]\s*/).map((p) => p.replace(/[^a-z ]/g, "").trim().replace(/s$/, "")).filter(Boolean);

const exactCategory = (raw) => CATEGORIES.find((c) => lc(c.name) === lc(raw) || stems(c.name)[0] === stems(raw)[0]) ?? null;

/** Words people (or an AI) use for a type → [category, type]. Specific entries come before general ones. */
const SYN = [
  // Clothing
  [/t-?\s?shirt|\btees?\b|tank/, "Clothing", "T-shirts"],
  [/sweater|sweatshirt|hoodie|jumper|pullover|cardigan|\bknit|fleece/, "Clothing", "Sweaters"],
  [/shirt|blouse|polo/, "Clothing", "Shirts"],
  [/jean|denim/, "Clothing", "Jeans"],
  [/\bshorts?\b|bermuda/, "Clothing", "Shorts"],
  [/pants|trouser|chino|slacks|legging|cargo|jogger|sweatpants/, "Clothing", "Pants"],
  [/\bsuits?\b|tuxedo/, "Clothing", "Suits"],
  [/jacket|coat|blazer|parka|windbreaker|bomber|\bvest/, "Clothing", "Jackets"],
  [/underwear|boxer|briefs?\b|panties|lingerie|undergarment/, "Clothing", "Underwear"],
  [/\bsocks?\b/, "Clothing", "Socks"],
  [/pajama|pyjama|sleep|\brobe|loungewear/, "Clothing", "Sleepwear"],
  [/dress|gown|jumpsuit|romper|skirt/, "Clothing", "Dresses"],
  [/activewear|\bgym|workout|tracksuit|swim|yoga|sportswear/, "Clothing", "Activewear"],
  // Footwear
  [/sneaker|trainer|running shoe/, "Footwear", "Sneakers"],
  [/loafer|oxford shoe|derby|dress shoe|brogue|heels?\b/, "Footwear", "Dress shoes"],
  [/boot/, "Footwear", "Boots"],
  [/slipper/, "Footwear", "Slippers"],
  [/sandal|flip.?flop|\bslides?\b|sliders/, "Footwear", "Sandals"],
  [/shoe|footwear/, "Footwear", ""],
  // Fragrance (before skincare: "perfume lotion" is not a body lotion)
  [/eau de parfum|\bedp\b/, "Fragrance", "Eau de parfum"],
  [/eau de toilette|\bedt\b/, "Fragrance", "Eau de toilette"],
  [/cologne/, "Fragrance", "Cologne"],
  [/body spray/, "Fragrance", "Body spray"],
  [/body mist/, "Fragrance", "Body mist"],
  [/fragrance oil/, "Fragrance", "Fragrance oil"],
  [/perfume lotion/, "Fragrance", "Perfume lotion"],
  [/perfume|parfum|fragrance/, "Fragrance", "Perfume"],
  // Tools that share a word with a product (before oral care / hair)
  [/electric toothbrush/, "Grooming Tools", "Electric toothbrush"],
  [/nail clipper|nail cutter/, "Grooming Tools", "Nail clipper"],
  [/hair ?brush/, "Grooming Tools", "Hairbrush"],
  [/\bcomb\b/, "Grooming Tools", "Comb"],
  [/trimmer|clipper/, "Grooming Tools", "Trimmer"],
  [/tweezer/, "Grooming Tools", "Tweezers"],
  [/scissor/, "Grooming Tools", "Scissors"],
  [/razor/, "Grooming Tools", "Razor"],
  // Oral care
  [/toothbrush/, "Oral Care", "Toothbrush"],
  [/toothpaste/, "Oral Care", "Toothpaste"],
  [/mouthwash|mouth rinse/, "Oral Care", "Mouthwash"],
  [/floss/, "Oral Care", "Floss"],
  [/tongue/, "Oral Care", "Tongue scraper"],
  [/whiten/, "Oral Care", "Whitening products"],
  // Hair & grooming
  [/beard oil/, "Hair & Grooming", "Beard oil"],
  [/beard balm/, "Hair & Grooming", "Beard balm"],
  [/shav(e|ing) (cream|foam|gel)/, "Hair & Grooming", "Shaving cream"],
  [/after-?shave/, "Hair & Grooming", "Aftershave"],
  [/hair oil/, "Hair & Grooming", "Hair oil"],
  [/hair cream/, "Hair & Grooming", "Hair cream"],
  [/pomade|hair wax|hair clay/, "Hair & Grooming", "Pomade"],
  [/hair gel/, "Hair & Grooming", "Hair gel"],
  [/shampoo/, "Hair & Grooming", "Shampoo"],
  [/conditioner/, "Hair & Grooming", "Conditioner"],
  // Body care
  [/body wash|shower gel/, "Body Care", "Body wash"],
  [/body oil/, "Body Care", "Body oil"],
  [/hand cream/, "Body Care", "Hand cream"],
  [/deodorant|antiperspirant/, "Body Care", "Deodorant"],
  [/soap/, "Body Care", "Soap"],
  // Skincare
  [/face ?wash/, "Skincare", "Face wash"],
  [/cleanser/, "Skincare", "Cleanser"],
  [/moisturi[sz]er/, "Skincare", "Moisturizer"],
  [/sunscreen|sunblock|\bspf/, "Skincare", "Sunscreen"],
  [/serum/, "Skincare", "Serum"],
  [/toner/, "Skincare", "Toner"],
  [/exfoliat/, "Skincare", "Exfoliator"],
  [/acne|pimple|blemish/, "Skincare", "Acne treatments"],
  [/lotion/, "Skincare", "Body lotion"],
  [/scrub/, "Skincare", "Body scrub"],
  [/lip balm|chapstick/, "Skincare", "Lip balm"],
  // Accessories
  [/watch/, "Accessories", "Watches"],
  [/sunglass|glasses/, "Accessories", "Sunglasses"],
  [/\bbelts?\b/, "Accessories", "Belts"],
  [/wallet/, "Accessories", "Wallets"],
  [/\bhats?\b|\bcaps?\b|beanie/, "Accessories", "Hats & caps"],
  [/bracelet/, "Accessories", "Bracelets"],
  [/necklace|pendant/, "Accessories", "Necklaces"],
  [/\brings?\b/, "Accessories", "Rings"],
  [/\bbags?\b|backpack|purse|tote/, "Accessories", "Bags"],
  [/accessor|scarf|gloves?\b|\bties?\b|jewel|earring/, "Accessories", ""],
];

/** Best [category, type] guess for some free text, optionally limited to one category. */
function guess(text, only) {
  const s = lc(text);
  if (!s) return null;
  for (const [re, category, type] of SYN) if ((!only || category === only) && re.test(s)) return { category, type };
  return null;
}

/** The old nine-ish "rooms" and where they live now. A blank type is worked out from the item's name. */
const LEGACY = {
  "t-shirts": ["Clothing", "T-shirts"],
  sweaters: ["Clothing", "Sweaters"],
  shirts: ["Clothing", "Shirts"],
  dresses: ["Clothing", "Dresses"],
  jeans: ["Clothing", "Jeans"],
  trousers: ["Clothing", "Pants"],
  shorts: ["Clothing", "Shorts"],
  jackets: ["Clothing", "Jackets"],
  shoes: ["Footwear", ""],
  sandals: ["Footwear", "Sandals"],
  accessories: ["Accessories", ""],
  activewear: ["Clothing", "Activewear"],
  "underwear & sleep": ["Clothing", ""],
  tops: ["Clothing", ""],
  bottoms: ["Clothing", ""],
  outerwear: ["Clothing", "Jackets"],
  "sleep & under": ["Clothing", ""],
  other: ["Other", ""],
};

const typeOf = (cat, raw) => {
  const t = stems(raw);
  if (!t.length) return null;
  return cat.types.find((x) => stems(x).some((s) => t.includes(s))) ?? null;
};

/**
 * Turn whatever we were given into { category, type }: a new category name, an old room name
 * (Shoes, Underwear & Sleep…), or just a word ("sneakers"). Anything unknown becomes "Other";
 * a type that isn't in the list is kept as written (so "Sweaters" or "Dresses" are never lost).
 */
export function resolveKind({ category, type, name } = {}) {
  const c = clean(category);
  const t = clean(type, 40);
  let found = exactCategory(c) ? { category: exactCategory(c).name, type: "" } : null;
  if (!found && c) {
    const legacy = LEGACY[lc(c)];
    if (legacy) found = { category: legacy[0], type: legacy[1] };
    else found = guess(c);
  }
  if (!found && t) found = guess(t);
  if ((!found || found.category === "Other") && name) found = guess(name) ?? found;
  const category_ = found?.category ?? "Other";
  const cat = CATEGORIES.find((x) => x.name === category_);
  if (!cat) return { category: "Other", type: t };

  let type_ = found.type;
  if (t) type_ = typeOf(cat, t) ?? guess(t, cat.name)?.type ?? t;
  else if (!type_) type_ = guess(name, cat.name)?.type ?? "";
  return { category: cat.name, type: type_ };
}

/** Just the category name for some text (old or new). */
export const normalizeCategory = (raw) => resolveKind({ category: raw }).category;

/** Meta for a category name. Old or unknown names are mapped, never lost. */
export const catMeta = (name) => CATEGORIES.find((c) => c.name === name) ?? CATEGORIES.find((c) => c.name === normalizeCategory(name)) ?? OTHER;

/** The types to offer for a category, plus the item's own custom type when it isn't in the list. */
export const typeChoices = (category, current) => {
  const base = catMeta(category).types;
  return current && !base.includes(current) ? [...base, current] : base;
};

export const isWearable = (name) => !!catMeta(name).wearable;

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

export const EMPTY_ITEM = { name: "", category: "Clothing", type: "", color: "", brand: "", size: "", season: "all", notes: "", image: "", images: [] };
