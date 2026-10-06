import { catMeta } from "../model";

/** A small mosaic of an outfit's pieces: 1 = full, 2 = halves, 3 = one tall + two, 4+ = 2×2 with a "+N" tile. */
export default function Collage({ pieces }) {
  const shown = pieces.slice(0, 4);
  const extra = pieces.length - 4;
  return (
    <span className={`of-collage of-n${Math.min(shown.length, 4)}`}>
      {shown.length === 0 && <span className="of-tile of-tile-empty" />}
      {shown.map((p, i) => {
        const Icon = catMeta(p.category).icon;
        return (
          <span key={p.id} className="of-tile acc" style={{ "--hue": catMeta(p.category).hue }}>
            {p.image ? <img src={p.image} alt="" decoding="async" /> : <Icon size={28} />}
            {i === 3 && extra > 0 && <span className="of-more title-md">+{extra}</span>}
          </span>
        );
      })}
    </span>
  );
}
