import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Circle, CircleDot, Flag, Folder, FolderPlus, ListChecks, Pencil, StickyNote } from "lucide-react";
import { Button, Chip, EmptyState, IconButton, WavyProgress } from "../../../design/components";
import { AREAS, NOTE_KINDS, STATUSES, areaInfo, childFolders, folderPath, folderTaskStats, kindInfo, milestoneProgress, nextStatus } from "../model";

const STATUS_ICON = { todo: Circle, doing: CircleDot, done: CheckCircle2 };
const statusLabel = (s) => STATUSES.find((x) => x.id === s)?.label ?? s;
const fmt = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
const todayIso = () => new Date().toISOString().slice(0, 10);

export function TasksTab({ project, folderId, onFolder, onNewFolder, onEditFolder, onCycle, onOpen }) {
  const [area, setArea] = useState("all");
  const milestones = useMemo(() => Object.fromEntries(project.milestones.map((m) => [m.id, m.title])), [project.milestones]);
  const path = useMemo(() => folderPath(project.folders, folderId), [project.folders, folderId]);
  const subfolders = childFolders(project.folders, folderId);
  // only the tasks directly in this folder; the ones deeper down are one tap away
  const rows = project.tasks.filter((t) => (t.folderId ?? null) === (folderId ?? null) && (area === "all" || t.area === area));
  const folderless = project.folders.length === 0;

  return (
    <>
      <nav className="crumbs" aria-label="Folder path">
        <button className={`crumb state label-lg${path.length ? "" : " is-here"}`} onClick={() => onFolder(null)} aria-current={path.length ? undefined : "page"}>All tasks</button>
        {path.map((f, i) => (
          <span key={f.id} className="crumb-item">
            <ChevronRight size={16} aria-hidden="true" />
            <button className={`crumb state label-lg${i === path.length - 1 ? " is-here" : ""}`} onClick={() => onFolder(f.id)} aria-current={i === path.length - 1 ? "page" : undefined}>{f.name}</button>
          </span>
        ))}
      </nav>

      <div className="folder-bar">
        <Button variant="tonal" icon={<FolderPlus size={20} />} onClick={onNewFolder}>{folderId ? "New subfolder" : "New folder"}</Button>
        {folderId && <IconButton label="Edit this folder" onClick={() => onEditFolder(project.folders.find((f) => f.id === folderId))}><Pencil size={20} /></IconButton>}
      </div>

      {subfolders.length > 0 && (
        <ul className="folder-list">
          {subfolders.map((f) => {
            const { total, done, folders: nested } = folderTaskStats(project, f.id);
            return (
              <li key={f.id} className="folder-row">
                <button className="folder-main state" onClick={() => onFolder(f.id)}>
                  <span className="folder-icon"><Folder size={22} /></span>
                  <span className="folder-text">
                    <span className="title-md">{f.name}</span>
                    <span className="body-md muted">
                      {total === 0 ? "No tasks" : `${done} of ${total} task${total === 1 ? "" : "s"} done`}
                      {nested > 0 ? `, ${nested} subfolder${nested === 1 ? "" : "s"}` : ""}
                    </span>
                  </span>
                  <ChevronRight size={20} className="muted" aria-hidden="true" />
                </button>
                <IconButton label={`Edit ${f.name}`} onClick={() => onEditFolder(f)}><Pencil size={20} /></IconButton>
              </li>
            );
          })}
        </ul>
      )}

      <nav className="chips-row" aria-label="Area">
        <Chip selected={area === "all"} onClick={() => setArea("all")}>All</Chip>
        {AREAS.map((a) => <Chip key={a.id} hue={a.hue} icon={<a.icon size={18} />} selected={area === a.id} onClick={() => setArea(a.id)}>{a.label}</Chip>)}
      </nav>
      {rows.length === 0 && subfolders.length === 0 && (
        <EmptyState icon={<ListChecks size={48} />} title={folderId ? "This folder is empty" : "No tasks here"}>
          {folderId ? "Add a task here, or make a subfolder to split it further." : folderless ? "Add what needs doing, and group tasks into folders as it grows." : "Add what needs doing for this part of the project."}
        </EmptyState>
      )}
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
