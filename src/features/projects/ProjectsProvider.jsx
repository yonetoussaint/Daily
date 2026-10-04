import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { uid } from "./model";
import { loadProjects, saveProjects } from "./storage";

const Ctx = createContext(null);
export const useProjects = () => useContext(Ctx);

/** Owns every project. Saved to localStorage shortly after each change and flushed on exit. */
export default function ProjectsProvider({ children }) {
  const [projects, setProjects] = useState(() => loadProjects() ?? []);
  const latest = useRef(projects);
  latest.current = projects;

  useEffect(() => {
    const t = setTimeout(() => saveProjects(projects), 300);
    return () => clearTimeout(t);
  }, [projects]);

  useEffect(() => {
    const flush = () => saveProjects(latest.current);
    const onHide = () => document.visibilityState === "hidden" && flush();
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, []);

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
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
