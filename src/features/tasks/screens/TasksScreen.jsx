import { useState } from "react";
import { LayoutGrid, ListChecks, Search, SearchX, X } from "lucide-react";
import { Button, ButtonGroup, Chip, EmptyState, IconButton, TextField } from "../../../design/components";
import { PRIORITY_META, ROOMS, STATUS_FILTERS } from "../model";
import { useTasks } from "../TasksProvider";
import SummaryCard from "../components/SummaryCard";
import TaskCard from "../components/TaskCard";

const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

function PriorityGroup({ priority, rows, menuId, swipeId, ...cardProps }) {
  const meta = PRIORITY_META[priority];
  const Icon = meta.icon;
  const done = rows.filter((r) => r.checked).length;
  return (
    <section className="group acc" style={{ "--hue": meta.hue }} aria-labelledby={`g-${priority}`}>
      <header className="group-head">
        <span className="group-icon"><Icon size={18} strokeWidth={2.6} /></span>
        <h2 id={`g-${priority}`} className="title-md">{meta.label}</h2>
        <span className="group-count label-md">{done}/{rows.length}</span>
      </header>
      <ul className="group-rows">
        {rows.map((item) => (
          <TaskCard key={item.id} item={item} menuOpen={menuId === item.id} swipeOpen={swipeId === item.id} {...cardProps} />
        ))}
      </ul>
    </section>
  );
}

export default function TasksScreen() {
  const t = useTasks();
  const [menuId, setMenuId] = useState(null);
  const [swipeId, setSwipeId] = useState(null);

  const scopeStats = t.stats.scope;
  const scopeName = t.room === "All" ? "your home" : t.room;
  const filtering = t.query.trim() || t.filter !== "all" || t.room !== "All";

  const cardProps = {
    onMenu: (id) => { setMenuId(id); if (id) setSwipeId(null); },
    onSwipe: (id) => { setSwipeId(id); if (id) setMenuId(null); },
    onToggle: t.actions.toggle,
    onEdit: t.openEditor,
    onDelete: t.actions.remove,
    onSetPriority: (item, p) => { setSwipeId(null); t.actions.setPriority(item, p); },
  };

  let body;
  if (t.status === "loading") {
    body = <div className="skeletons" aria-busy="true" aria-label="Loading tasks">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ animationDelay: `${i * 120}ms` }} />)}</div>;
  } else if (t.status === "error") {
    body = (
      <EmptyState icon={<SearchX size={48} />} title="Couldn't load your tasks" action={<Button variant="tonal" onClick={t.reload}>Try again</Button>}>
        Check your connection and try again.
      </EmptyState>
    );
  } else if (t.items.length === 0) {
    body = (
      <EmptyState icon={<ListChecks size={52} />} title="A fresh start" action={<Button onClick={() => t.openEditor()}>Add your first task</Button>}>
        Plan something for your bedroom, kitchen, wardrobe or work setup.
      </EmptyState>
    );
  } else if (t.groups.length === 0) {
    body = (
      <EmptyState
        icon={<SearchX size={52} />}
        title="Nothing matches"
        action={filtering && <Button variant="tonal" onClick={() => { t.setQuery(""); t.setFilter("all"); t.setRoom("All"); }}>Clear filters</Button>}
      >
        Try a different search, status or room.
      </EmptyState>
    );
  } else {
    body = t.groups.map((g) => (
      <PriorityGroup
        key={g.priority}
        priority={g.priority}
        rows={g.rows}
        menuId={menuId}
        swipeId={swipeId}
        {...cardProps}
      />
    ));
  }

  return (
    <div className="page">
      <header className="page-head">
        <p className="overline muted">{today}</p>
        <h1 className="display">Home tasks</h1>
      </header>

      <SummaryCard stats={scopeStats} scope={scopeName} />

      <div className="toolbar">
        <TextField
          type="search"
          label="Search tasks"
          value={t.query}
          onChange={(e) => t.setQuery(e.target.value)}
          leading={<Search size={22} />}
          trailing={t.query && <IconButton label="Clear search" onClick={() => t.setQuery("")}><X size={20} /></IconButton>}
          className="field-pill"
        />
        <ButtonGroup label="Status" value={t.filter} onChange={t.setFilter} options={STATUS_FILTERS} />
      </div>

      <nav className="chips-row" aria-label="Rooms">
        <Chip selected={t.room === "All"} icon={<LayoutGrid size={18} />} onClick={() => t.setRoom("All")}>All rooms</Chip>
        {ROOMS.map((r) => {
          const Icon = r.icon;
          const s = t.stats.rooms[r.name];
          return (
            <Chip key={r.name} hue={r.hue} selected={t.room === r.name} icon={<Icon size={18} />} onClick={() => t.setRoom(r.name)}>
              {r.name} {s.total > 0 && <small>{s.done}/{s.total}</small>}
            </Chip>
          );
        })}
      </nav>

      <div className="groups">{body}</div>
    </div>
  );
}
