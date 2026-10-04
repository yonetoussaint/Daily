import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { uid } from "./model";
import SyncGate from "../../data/SyncGate";
import useStore from "../../data/useStore";
import { projectsStore } from "./storage";

const Ctx = createContext(null);
export const useProjects = () => useContext(Ctx);

const NONE = [];

/** Owns every project. Stored in Supabase (projects, project_milestones, project_tasks, project_notes); changes are saved shortly after and flushed on exit. */
export default function ProjectsProvider({ children }) {
  const [loaded, setProjects, status, reload] = useStore(projectsStore);
  const projects = loaded ?? NONE;
  const latest = useRef(projects);
  latest.current = projects;

  const createProject = useCallback((data) => {
    const now = Date.now();
    const project = { id: uid("pj"), ...data, milestones: [], tasks: [], notes: [], createdAt: now, updatedAt: now };
    setProjects((p) => [...p, project]);
    return project;
  }, []);

  /** Change one project with a function: project → patch. */
  const edit = useCallback((id, fn) => {
    setProjects((p) => p.map((x) => (x.id === id ? { ...x, ...fn(x), updatedAt: Date.now() } : x)));
  }, []);

  const deleteProject = useCallback((id) => {
    const index = latest.current.findIndex((x) => x.id === id);
    setProjects((p) => p.filter((x) => x.id !== id));
    return index;
  }, []);

  const restoreProject = useCallback((project, index) => {
    setProjects((p) => {
      if (p.some((x) => x.id === project.id)) return p;
      const next = [...p];
      next.splice(Math.min(index, next.length), 0, project);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ projects, createProject, edit, deleteProject, restoreProject }), [projects, createProject, edit, deleteProject, restoreProject]);
  return (
    <Ctx.Provider value={value}>
      <SyncGate status={status} onRetry={reload}>{children}</SyncGate>
    </Ctx.Provider>
  );
}
