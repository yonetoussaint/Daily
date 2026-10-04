import { ChevronRight, ListChecks } from "lucide-react";
import { cookie } from "../../../design/shapes";
import { ROOMS } from "../model";
import { useTasks } from "../TasksProvider";
import { useNav } from "../../../app/NavProvider";

// Alternating corner shapes give the grid its expressive rhythm.
const CORNERS = [
  "var(--shape-xxl) var(--shape-lg) var(--shape-xxl) var(--shape-lg)",
  "var(--shape-lg) var(--shape-xxl) var(--shape-lg) var(--shape-xxl)",
];

function RoomCard({ name, hue, icon: Icon, lobes, amp, stats, corners, onOpen, wide }) {
  const pct = stats.total ? (stats.done / stats.total) * 100 : 0;
  return (
    <button
      className={`room-card acc state${wide ? " is-wide" : ""}`}
      style={{ "--hue": hue, borderRadius: corners }}
      onClick={onOpen}
    >
      <span className="room-icon" style={{ clipPath: cookie(lobes, amp) }}><Icon size={wide ? 30 : 28} /></span>
      <span className="room-info">
        <span className="title-lg">{name}</span>
        <span className="body-md">
          {stats.total === 0 ? "No tasks yet" : stats.done === stats.total ? "All done" : `${stats.done} of ${stats.total} done`}
        </span>
      </span>
      <span className="room-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
      <ChevronRight className="room-go" size={22} aria-hidden="true" />
    </button>
  );
}

export default function RoomsScreen() {
  const { stats, setRoom } = useTasks();
  const { goTab } = useNav();
  const open = (room) => { setRoom(room); goTab("tasks"); };

  return (
    <div className="page">
      <header className="page-head">
        <p className="overline muted">Organize by</p>
        <h1 className="display">Rooms</h1>
      </header>

      <div className="rooms-grid">
        <RoomCard name="Everything" hue={285} icon={ListChecks} lobes={12} amp={0.075} stats={stats.all} corners="var(--shape-xxl)" wide onOpen={() => open("All")} />
        {ROOMS.map((r, i) => (
          <RoomCard key={r.name} {...r} stats={stats.rooms[r.name]} corners={CORNERS[i % 2 === Math.floor(i / 2) % 2 ? 0 : 1]} onOpen={() => open(r.name)} />
        ))}
      </div>
    </div>
  );
}
