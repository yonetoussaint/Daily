import { ChevronRight, Shirt } from "lucide-react";
import { cookie } from "../../../design/shapes";
import { CATEGORIES } from "../model";
import "../../tasks/tasks.css"; // shares the Rooms grid and card look with Home tasks

// Alternating corner shapes give the grid its expressive rhythm (same as Home tasks).
const CORNERS = [
  "var(--shape-xxl) var(--shape-lg) var(--shape-xxl) var(--shape-lg)",
  "var(--shape-lg) var(--shape-xxl) var(--shape-lg) var(--shape-xxl)",
];

const countText = (n) => (n === 0 ? "No pieces yet" : `${n} piece${n === 1 ? "" : "s"}`);

function RoomCard({ name, hue, icon: Icon, lobes, amp, count, total, corners, onOpen, wide }) {
  const pct = total ? (count / total) * 100 : 0;
  return (
    <button
      className={`room-card acc state${wide ? " is-wide" : ""}`}
      style={{ "--hue": hue, borderRadius: corners }}
      onClick={onOpen}
    >
      <span className="room-icon" style={{ clipPath: cookie(lobes, amp) }}><Icon size={wide ? 30 : 28} /></span>
      <span className="room-info">
        <span className="title-lg">{name}</span>
        <span className="body-md">{countText(count)}</span>
      </span>
      <span className="room-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      <ChevronRight className="room-go" size={22} aria-hidden="true" />
    </button>
  );
}

/** The Rooms tab: one card per kind of clothing (Sandals, Jeans, Shoes…). Tapping one opens it in Pieces. */
export default function RoomsScreen({ counts, total, onOpen }) {
  return (
    <div className="wd-page">
      <header className="wd-head">
        <p className="overline muted">Organize by</p>
        <h1 className="display">Rooms</h1>
      </header>

      <div className="rooms-grid">
        <RoomCard name="Everything" hue={335} icon={Shirt} lobes={12} amp={0.075} count={total} total={total} corners="var(--shape-xxl)" wide onOpen={() => onOpen("all")} />
        {CATEGORIES.map((c, i) => (
          <RoomCard key={c.name} {...c} count={counts[c.name] ?? 0} total={total} corners={CORNERS[i % 2 === Math.floor(i / 2) % 2 ? 0 : 1]} onOpen={() => onOpen(c.name)} />
        ))}
      </div>
    </div>
  );
}
