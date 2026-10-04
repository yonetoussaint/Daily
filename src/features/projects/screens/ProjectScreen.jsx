import { useEffect, useState } from "react";
import { ArrowLeft, Pencil, Plus } from "lucide-react";
import { ButtonGroup, Fab, IconButton, TopAppBar, WavyProgress, useScrollingDown, useSnackbar } from "../../../design/components";
import { useNav } from "../../../app/NavProvider";
import { useProjects } from "../ProjectsProvider";
import { nextStatus, progress, uid, upsert } from "../model";
import { NotesTab, RoadmapTab, TABS, TasksTab } from "../components/Tabs";
import EntrySheet from "../components/EntrySheet";
import ProjectSheet from "../components/ProjectSheet";

const KEYS = { task: ["tasks", "tk"], milestone: ["milestones", "ms"], note: ["notes", "nt"] };
const FAB = { tasks: ["task", "New task"], roadmap: ["milestone", "New milestone"], notes: ["note", "New note"] };

export default function ProjectScreen() {
  const { projectId, closeProject } = useNav();
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === projectId);
  // a project that no longer exists sends you back to the list
  useEffect(() => { if (!project) closeProject(); }, [project, closeProject]);
  return project ? <Detail key={project.id} project={project} /> : null;
}

function Detail({ project }) {
  const { closeProject } = useNav();
  const { edit, deleteProject, restoreProject } = useProjects();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const [tab, setTab] = useState("tasks");
  const [sheet, setSheet] = useState(null); // { kind, item? } | { kind: "project" }
  const { done, total } = progress(project);
  const [fabKind, fabLabel] = FAB[tab];

  const save = (kind, item) => {
    const [key, prefix] = KEYS[kind];
    edit(project.id, (p) => ({ [key]: upsert(p[key], item.id ? item : { ...item, id: uid(prefix) }) }));
    setSheet(null);
  };

  const cycle = (id) => edit(project.id, (p) => ({ tasks: p.tasks.map((t) => (t.id === id ? { ...t, status: nextStatus(t.status) } : t)) }));

  const remove = (kind, item) => {
    const [key] = KEYS[kind];
    const index = project[key].findIndex((x) => x.id === item.id);
    const linked = kind === "milestone" ? project.tasks.filter((t) => t.milestoneId === item.id).map((t) => t.id) : [];
    edit(project.id, (p) => ({
      [key]: p[key].filter((x) => x.id !== item.id),
      ...(kind === "milestone" ? { tasks: p.tasks.map((t) => (t.milestoneId === item.id ? { ...t, milestoneId: null } : t)) } : {}),
    }));
    setSheet(null);
    snackbar.show({
      message: `Deleted “${item.title}”`,
      actionLabel: "Undo",
      onAction: () =>
        edit(project.id, (p) => {
          if (p[key].some((x) => x.id === item.id)) return {};
          const list = [...p[key]];
          list.splice(Math.min(index, list.length), 0, item);
          return {
            [key]: list,
            ...(linked.length ? { tasks: p.tasks.map((t) => (linked.includes(t.id) ? { ...t, milestoneId: item.id } : t)) } : {}),
          };
        }),
    });
  };

  const removeProject = () => {
    const index = deleteProject(project.id);
    closeProject();
    snackbar.show({ message: `Deleted “${project.name}”`, actionLabel: "Undo", onAction: () => restoreProject(project, index) });
  };

  const next = [...project.milestones]
    .filter((m) => m.due && !(project.tasks.some((t) => t.milestoneId === m.id) && project.tasks.filter((t) => t.milestoneId === m.id).every((t) => t.status === "done")))
    .sort((a, b) => a.due.localeCompare(b.due))[0];

  return (
    <>
      <TopAppBar
        persistentTitle
        title={project.name}
        leading={<IconButton label="Back to projects" onClick={closeProject}><ArrowLeft size={24} /></IconButton>}
        actions={<IconButton label="Edit project" onClick={() => setSheet({ kind: "project" })}><Pencil size={22} /></IconButton>}
      />
      <main className="proj-page">
        <header className="proj-hero acc" style={{ "--hue": project.hue }}>
          <span className="stage-pill label-md">{project.stage}</span>
          <h1 className="display">{project.name}</h1>
          {project.tagline && <p className="body-lg">{project.tagline}</p>}
          <WavyProgress value={done} total={total} label="Tasks done" />
          <p className="body-md">
            {total === 0 ? "No tasks yet" : `${done} of ${total} tasks done`}
            {next && <span className="hero-next"> Next milestone: {next.title}, {new Date(`${next.due}T00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
          </p>
        </header>

        <ButtonGroup label="Section" value={tab} onChange={setTab} options={TABS} className="proj-tabs" />

        {tab === "tasks" && <TasksTab project={project} onCycle={cycle} onOpen={(item) => setSheet({ kind: "task", item })} />}
        {tab === "roadmap" && <RoadmapTab project={project} onOpen={(item) => setSheet({ kind: "milestone", item })} />}
        {tab === "notes" && <NotesTab project={project} onOpen={(item) => setSheet({ kind: "note", item })} />}
      </main>

      <Fab className="proj-fab" icon={<Plus size={26} strokeWidth={2.6} />} label={fabLabel} extended={!scrollingDown} onClick={() => setSheet({ kind: fabKind })} />

      {sheet?.kind === "project" && <ProjectSheet project={project} onClose={() => setSheet(null)} onSave={(d) => { edit(project.id, () => d); setSheet(null); }} onDelete={removeProject} />}
      {sheet && sheet.kind !== "project" && (
        <EntrySheet key={sheet.item?.id ?? "new"} kind={sheet.kind} item={sheet.item} project={project} onClose={() => setSheet(null)} onSave={(item) => save(sheet.kind, item)} onDelete={() => remove(sheet.kind, sheet.item)} />
      )}
    </>
  );
}
