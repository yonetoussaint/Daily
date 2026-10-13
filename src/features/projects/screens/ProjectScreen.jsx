import { useEffect, useState } from "react";
import { ArrowLeft, FolderPlus, LayoutGrid, List, ListPlus, Pencil, Plus } from "lucide-react";
import { Button, Fab, IconButton, Sheet, TopAppBar, WavyProgress, useScrollingDown, useSnackbar } from "../../../design/components";
import { useNav } from "../../../app/NavProvider";
import { useProjects } from "../ProjectsProvider";
import { folderPath, folderTaskStats, nextStatus, progress, uid, upsert } from "../model";
import FileManager, { Breadcrumbs } from "../components/FileManager";
import EntrySheet from "../components/EntrySheet";
import FolderSheet from "../components/FolderSheet";
import ProjectSheet from "../components/ProjectSheet";

export default function ProjectScreen() {
  const { projectId, closeProject } = useNav();
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === projectId);
  // a project that no longer exists sends you back to the list
  useEffect(() => { if (!project) closeProject(); }, [project, closeProject]);
  return project ? <Detail key={project.id} project={project} /> : null;
}

/** A project is a file manager: folders (nested without limit) and the tasks inside them. */
function Detail({ project }) {
  const { closeProject } = useNav();
  const { edit, deleteProject, restoreProject } = useProjects();
  const snackbar = useSnackbar();
  const scrollingDown = useScrollingDown();
  const [folderId, setFolderId] = useState(null); // the folder that's open (null = top level)
  const [grid, setGrid] = useState(false);
  const [sheet, setSheet] = useState(null); // { kind: "add" | "project" | "task" | "folder", item? }

  // a folder that no longer exists (deleted, or removed on another device) sends you back to the top
  useEffect(() => { if (folderId && !project.folders.some((f) => f.id === folderId)) setFolderId(null); }, [folderId, project.folders]);

  const path = folderPath(project.folders, folderId);
  const current = path[path.length - 1] ?? null;
  const { done, total } = folderId ? folderTaskStats(project, folderId) : progress(project);
  const goUp = () => (current ? setFolderId(current.parentId ?? null) : closeProject());

  const saveTask = (item) => {
    edit(project.id, (p) => ({ tasks: upsert(p.tasks, item.id ? item : { ...item, id: uid("tk") }) }));
    setSheet(null);
  };
  const saveFolder = (item) => {
    edit(project.id, (p) => ({ folders: upsert(p.folders, item.id ? item : { ...item, id: uid("fd") }) }));
    setSheet(null);
  };

  const cycle = (id) => edit(project.id, (p) => ({ tasks: p.tasks.map((t) => (t.id === id ? { ...t, status: nextStatus(t.status) } : t)) }));

  const removeTask = (task) => {
    const index = project.tasks.findIndex((x) => x.id === task.id);
    edit(project.id, (p) => ({ tasks: p.tasks.filter((x) => x.id !== task.id) }));
    setSheet(null);
    snackbar.show({
      message: `Deleted “${task.title}”`,
      actionLabel: "Undo",
      onAction: () =>
        edit(project.id, (p) => {
          if (p.tasks.some((x) => x.id === task.id)) return {};
          const list = [...p.tasks];
          list.splice(Math.min(index, list.length), 0, task);
          return { tasks: list };
        }),
    });
  };

  const removeFolder = (folder) => {
    // what was inside moves up one level instead of being lost
    const parentId = folder.parentId ?? null;
    const index = project.folders.findIndex((f) => f.id === folder.id);
    const subIds = project.folders.filter((f) => f.parentId === folder.id).map((f) => f.id);
    const taskIds = project.tasks.filter((t) => t.folderId === folder.id).map((t) => t.id);
    edit(project.id, (p) => ({
      folders: p.folders.filter((f) => f.id !== folder.id).map((f) => (f.parentId === folder.id ? { ...f, parentId } : f)),
      tasks: p.tasks.map((t) => (t.folderId === folder.id ? { ...t, folderId: parentId } : t)),
    }));
    if (folderId === folder.id) setFolderId(parentId);
    setSheet(null);
    snackbar.show({
      message: `Deleted folder “${folder.name}”`,
      actionLabel: "Undo",
      onAction: () =>
        edit(project.id, (p) => {
          if (p.folders.some((f) => f.id === folder.id)) return {};
          const list = p.folders.map((f) => (subIds.includes(f.id) ? { ...f, parentId: folder.id } : f));
          list.splice(Math.min(index, list.length), 0, folder);
          return { folders: list, tasks: p.tasks.map((t) => (taskIds.includes(t.id) ? { ...t, folderId: folder.id } : t)) };
        }),
    });
  };

  const removeProject = () => {
    const index = deleteProject(project.id);
    closeProject();
    snackbar.show({ message: `Deleted “${project.name}”`, actionLabel: "Undo", onAction: () => restoreProject(project, index) });
  };

  return (
    <>
      <TopAppBar
        persistentTitle
        title={current ? current.name : project.name}
        leading={<IconButton label={current ? "Up one folder" : "Back to projects"} onClick={goUp}><ArrowLeft size={24} /></IconButton>}
        actions={
          <>
            <IconButton label={grid ? "Show as list" : "Show as grid"} onClick={() => setGrid((g) => !g)}>{grid ? <List size={22} /> : <LayoutGrid size={22} />}</IconButton>
            <IconButton label={current ? "Edit folder" : "Edit project"} onClick={() => setSheet(current ? { kind: "folder", item: current } : { kind: "project" })}><Pencil size={22} /></IconButton>
          </>
        }
      />
      <main className="proj-page">
        <Breadcrumbs project={project} folderId={folderId} onFolder={setFolderId} />
        <div className="fm-summary acc" style={{ "--hue": project.hue }}>
          <WavyProgress value={done} total={total} label={current ? `${current.name} progress` : "Tasks done"} />
          <p className="body-md muted">{total === 0 ? "No tasks yet" : `${done} of ${total} tasks done`}{current ? " in this folder" : ""}</p>
        </div>
        <FileManager project={project} folderId={folderId} grid={grid} onFolder={setFolderId} onEditFolder={(item) => setSheet({ kind: "folder", item })} onCycle={cycle} onOpen={(item) => setSheet({ kind: "task", item })} />
      </main>

      <Fab className="proj-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New" extended={!scrollingDown} onClick={() => setSheet({ kind: "add" })} />

      {sheet?.kind === "add" && (
        <Sheet title={current ? `Add to ${current.name}` : "Add"} onClose={() => setSheet(null)}>
          <div className="sheet-form add-choices">
            <Button variant="tonal" icon={<ListPlus size={20} />} onClick={() => setSheet({ kind: "task" })}>New task</Button>
            <Button variant="tonal" icon={<FolderPlus size={20} />} onClick={() => setSheet({ kind: "folder" })}>New folder</Button>
          </div>
        </Sheet>
      )}
      {sheet?.kind === "project" && <ProjectSheet project={project} onClose={() => setSheet(null)} onSave={(d) => { edit(project.id, () => d); setSheet(null); }} onDelete={removeProject} />}
      {sheet?.kind === "folder" && (
        <FolderSheet key={sheet.item?.id ?? "new"} folder={sheet.item} parentId={folderId} folders={project.folders} onClose={() => setSheet(null)} onSave={saveFolder} onDelete={() => removeFolder(sheet.item)} />
      )}
      {sheet?.kind === "task" && (
        <EntrySheet key={sheet.item?.id ?? "new"} kind="task" item={sheet.item} project={project} defaultFolder={folderId} onClose={() => setSheet(null)} onSave={saveTask} onDelete={() => removeTask(sheet.item)} />
      )}
    </>
  );
}
