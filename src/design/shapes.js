// Expressive shape library. Every shape is a polygon with the same point count,
// so CSS can morph between them (circle ⇄ scalloped "cookie") with a transition.
const POINTS = 96;
const cache = new Map();

/** A circle with `lobes` soft scallops of relative depth `amp` (0 = perfect circle). */
export function cookie(lobes = 8, amp = 0.07) {
  const key = `${lobes}:${amp}`;
  if (cache.has(key)) return cache.get(key);
  const pts = [];
  for (let i = 0; i < POINTS; i++) {
    const t = (i / POINTS) * Math.PI * 2;
    const r = ((1 + amp * Math.cos(lobes * t)) / (1 + amp)) * 50;
    pts.push(`${(50 + r * Math.sin(t)).toFixed(2)}% ${(50 - r * Math.cos(t)).toFixed(2)}%`);
  }
  const value = `polygon(${pts.join(",")})`;
  cache.set(key, value);
  return value;
}

export const circle = () => cookie(8, 0);
