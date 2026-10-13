import { CheckCircle2, ChevronRight, Circle, CircleDot, Folder, FolderOpen, Home } from "lucide-react";
import { EmptyState } from "../../../design/components";
import { STATUSES, areaInfo, childFolders, folderPath, folderTaskStats, nextStatus } from "../model";

const STATUS_ICON = { todo: Circle, doing: CircleDot, done: CheckCircle2 };
const statusLabel = (s) => STATUSES.find((x) => x.id === s)?.label ?? s;
const fmt = (iso) => new Date(`${iso}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const todayIso = () => new Date().toISOString().slice(0, 10);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The folder path, like the address bar of a file manager. Every part is a link back to that level. */
export function Breadcrumbs({ project, folderId, onFolder }) {
  const path = folderPath(project.folders, folderId);
  return (
    <nav className="crumbs" aria-label="Folder path">
      <button className={`crumb state label-lg${path.length ? "" : " is-here"}`} onClick={() => onFolder(null)} aria-current={path.length ? undefined : "page"}>
        <Home size={16} aria-hidden="true" />{project.name}
      </button>
      {path.map((f, i) => (
        <span key={f.id} className="crumb-item">
          <ChevronRight size={16} aria-hidden="true" />
          <button className={`crumb state label-lg${i === path.length - 1 ? " is-here" : ""}`} onClick={() => onFolder(f.id)} aria-current={i === path.length - 1 ? "page" : undefined}>{f.name}</button>
        </span>
      ))}
    </nav>
  );
}

/** Where a folder sits, as "Parent / Child", for search results. */
const where = (project, folderId) => folderPath(project.folders, folderId).map((f) => f.name).join(" / ");

/** What's inside one folder: subfolders first, then the tasks that sit directly in it. With a search query, matches from the whole project instead. */
export default function FileManager({ project, folderId, grid, query = "", onFolder, onEditFolder, onCycle, onOpen }) {
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const folders = searching ? project.folders.filter((f) => f.name.toLowerCase().includes(q)) : childFolders(project.folders, folderId);
  const tasks = searching
    ? project.tasks.filter((t) => `${t.title} ${t.details ?? ""} ${areaInfo(t.area).label}`.toLowerCase().includes(q))
    : project.tasks.filter((t) => (t.folderId ?? null) === (folderId ?? null));
  const empty = folders.length === 0 && tasks.length === 0;

  return (
    <>
      {empty ? (
        <EmptyState icon={<FolderOpen size={52} />} title={searching ? "No matches" : folderId ? "This folder is empty" : "Nothing here yet"}>
          {searching ? `Nothing in this project matches “${query.trim()}”.` : "Tap + to add a task or a folder."}
        </EmptyState>
      ) : (
        <ul className={`fm-list${grid ? " is-grid" : ""}`}>
          {folders.map((f) => {
            const { total, done } = folderTaskStats(project, f.id);
            const items = childFolders(project.folders, f.id).length + project.tasks.filter((t) => t.folderId === f.id).length;
            return (
              <li key={f.id} className="fm-item">
                <button className="fm-main state" onClick={() => onFolder(f.id)} onContextMenu={(e) => { e.preventDefault(); onEditFolder(f); }}>
                  <span className="fm-icon fm-folder"><Folder size={26} fill="currentColor" fillOpacity={0.18} /></span>
                  <span className="fm-text">
                    <span className="title-md fm-name">{f.name}</span>
                    <span className="body-md muted">{searching && f.parentId ? `${where(project, f.parentId)} · ` : ""}{plural(items, "item")}{total > 0 ? ` · ${done}/${total} done` : ""}</span>
                  </span>
                </button>
                <button className="fm-more state" aria-label={`Edit ${f.name}`} onClick={() => onEditFolder(f)}>⋯</button>
              </li>
            );
          })}
          {tasks.map((t) => {
            const a = areaInfo(t.area);
            const Icon = STATUS_ICON[t.status];
            const late = t.due && t.status !== "done" && t.due < todayIso();
            return (
              <li key={t.id} className="fm-item acc" style={{ "--hue": a.hue }}>
                <button className={`fm-check task-check state is-${t.status}`} aria-label={`${statusLabel(t.status)}. Mark as ${statusLabel(nextStatus(t.status)).toLowerCase()}`} onClick={() => onCycle(t.id)}>
                  <Icon size={26} />
                </button>
                <button className="fm-main state" onClick={() => onOpen(t)}>
                  <span className="fm-text">
                    <span className={`title-md fm-name${t.status === "done" ? " is-done" : ""}`}>{t.title}</span>
                    <span className="body-md muted fm-meta">
                      <span className="task-area"><a.icon size={14} />{a.label}</span>
                      {searching && t.folderId && <span>{where(project, t.folderId)}</span>}
                      {t.due && <span className={late ? "is-late" : ""}>{late ? "Overdue, " : ""}{fmt(t.due)}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
