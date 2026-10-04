import { useMemo, useState } from "react";
import { CheckCircle2, Circle, CircleDot, Flag, ListChecks, StickyNote } from "lucide-react";
import { Chip, EmptyState, WavyProgress } from "../../../design/components";
import { AREAS, NOTE_KINDS, STATUSES, areaInfo, kindInfo, milestoneProgress, nextStatus } from "../model";

const STATUS_ICON = { todo: Circle, doing: CircleDot, done: CheckCircle2 };
const statusLabel = (s) => STATUSES.find((x) => x.id === s)?.label ?? s;
const fmt = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const todayIso = () => new Date().toISOString().slice(0, 10);

export function TasksTab({ project, onCycle, onOpen }) {
  const [area, setArea] = useState("all");
  const milestones = useMemo(() => Object.fromEntries(project.milestones.map((m) => [m.id, m.title])), [project.milestones]);
  const rows = project.tasks.filter((t) => area === "all" || t.area === area);

  return (
    <>
      <nav className="chips-row" aria-label="Area">
        <Chip selected={area === "all"} onClick={() => setArea("all")}>All</Chip>
        {AREAS.map((a) => <Chip key={a.id} hue={a.hue} icon={<a.icon size={18} />} selected={area === a.id} onClick={() => setArea(a.id)}>{a.label}</Chip>)}
      </nav>
      {rows.length === 0 && <EmptyState icon={<ListChecks size={48} />} title="No tasks here">Add what needs doing for this part of the project.</EmptyState>}
      {STATUSES.map(({ id, label }) => {
        const group = rows.filter((t) => t.status === id);
        if (!group.length) return null;
        return (
          <section key={id} className="task-group" aria-label={label}>
            <h3 className="label-lg muted">{label} <span className="count">{group.length}</span></h3>
            <ul className="task-list">
              {group.map((t) => {
                const a = areaInfo(t.area);
                const Icon = STATUS_ICON[t.status];
                const late = t.due && t.status !== "done" && t.due < todayIso();
                return (
                  <li key={t.id} className="task-row acc" style={{ "--hue": a.hue }}>
                    <button className={`task-check state is-${t.status}`} aria-label={`${statusLabel(t.status)}. Mark as ${statusLabel(nextStatus(t.status)).toLowerCase()}`} onClick={() => onCycle(t.id)}>
                      <Icon size={26} />
                    </button>
                    <button className="task-main state" onClick={() => onOpen(t)}>
                      <span className={`title-md${t.status === "done" ? " is-done" : ""}`}>{t.title}</span>
                      <span className="task-meta body-md muted">
                        <span className="task-area"><a.icon size={14} />{a.label}</span>
                        {t.milestoneId && milestones[t.milestoneId] && <span>{milestones[t.milestoneId]}</span>}
                        {t.due && <span className={late ? "is-late" : ""}>{late ? "Overdue, " : ""}{fmt(t.due)}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </>
  );
}

export function RoadmapTab({ project, onOpen }) {
  const list = [...project.milestones].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  const unplanned = project.tasks.filter((t) => !t.milestoneId || !project.milestones.some((m) => m.id === t.milestoneId)).length;
  if (!list.length) return <EmptyState icon={<Flag size={48} />} title="No milestones yet">Break the project into phases, like “MVP build” or “Launch”.</EmptyState>;
  return (
    <>
      <ol className="ms-list">
        {list.map((m) => {
          const { done, total } = milestoneProgress(project, m);
          const complete = total > 0 && done === total;
          return (
            <li key={m.id}>
              <button className={`ms-card state${complete ? " is-complete" : ""}`} onClick={() => onOpen(m)}>
                <span className="ms-top">
                  <Flag size={20} />
                  <span className="title-md">{m.title}</span>
                  {m.due && <span className="body-md muted ms-date">{fmt(m.due)}</span>}
                </span>
                <WavyProgress value={done} total={total} label={`${m.title} progress`} />
                <span className="body-md muted">{total === 0 ? "No tasks linked yet" : complete ? "Complete" : `${done} of ${total} tasks done`}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {unplanned > 0 && <p className="body-md muted ms-note">{unplanned} task{unplanned === 1 ? " isn’t" : "s aren’t"} in a milestone yet. Pick one when you edit a task.</p>}
    </>
  );
}

export function NotesTab({ project, onOpen }) {
  const [kind, setKind] = useState("all");
  const notes = project.notes.filter((n) => kind === "all" || n.kind === kind).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <>
      <nav className="chips-row" aria-label="Type">
        <Chip selected={kind === "all"} onClick={() => setKind("all")}>All</Chip>
        {NOTE_KINDS.map((k) => <Chip key={k.id} hue={k.hue} icon={<k.icon size={18} />} selected={kind === k.id} onClick={() => setKind(k.id)}>{k.label}</Chip>)}
      </nav>
      {notes.length === 0 && <EmptyState icon={<StickyNote size={48} />} title="Nothing written yet">Keep decisions, ideas and research for this project in one place.</EmptyState>}
      <ul className="note-list">
        {notes.map((n) => {
          const k = kindInfo(n.kind);
          return (
            <li key={n.id}>
              <button className="note-card acc state" style={{ "--hue": k.hue }} onClick={() => onOpen(n)}>
                <span className="note-icon"><k.icon size={20} /></span>
                <span className="note-text">
                  <span className="title-md">{n.title}</span>
                  {n.body && <span className="body-md muted note-body">{n.body}</span>}
                  <span className="label-md muted">{k.label}, {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export const TABS = [
  { value: "tasks", label: "Tasks", icon: <ListChecks size={18} /> },
  { value: "roadmap", label: "Roadmap", icon: <Flag size={18} /> },
  { value: "notes", label: "Notes", icon: <StickyNote size={18} /> },
];
