import { useState } from "react";
import { FolderKanban, Menu, Moon, Plus, Sun, SunMoon } from "lucide-react";
import { Button, EmptyState, Fab, IconButton, TopAppBar, WavyProgress, useScrollingDown } from "../../../design/components";
import { cookie } from "../../../design/shapes";
import { useDrawer } from "../../../app/DrawerProvider";
import { useNav } from "../../../app/NavProvider";
import { useTheme } from "../../../app/useTheme";
import { useProjects } from "../ProjectsProvider";
import { progress } from "../model";
import ProjectSheet from "../components/ProjectSheet";

const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

export default function ProjectsScreen() {
  const { openProject } = useNav();
  const drawer = useDrawer();
  const theme = useTheme();
  const scrollingDown = useScrollingDown();
  const { projects, createProject } = useProjects();
  const [creating, setCreating] = useState(false);
  const ThemeIcon = THEME_ICON[theme.mode];

  const create = (data) => {
    const p = createProject(data);
    setCreating(false);
    openProject(p.id);
  };

  return (
    <>
      <TopAppBar
        title="Projects"
        leading={<IconButton label="Open menu" onClick={drawer.open}><Menu size={24} /></IconButton>}
        actions={<IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}><ThemeIcon size={22} /></IconButton>}
      />
      <main className="proj-page">
        <header className="proj-head">
          <p className="overline muted">{projects.length} project{projects.length === 1 ? "" : "s"}</p>
          <h1 className="display">Projects</h1>
        </header>

        {projects.length === 0 ? (
          <EmptyState icon={<FolderKanban size={52} />} title="Start a project" action={<Button onClick={() => setCreating(true)}>New project</Button>}>
            Plan tasks, milestones and notes for something you’re building.
          </EmptyState>
        ) : (
          <ul className="proj-list">
            {projects.map((p, i) => {
              const { done, total } = progress(p);
              return (
                <li key={p.id}>
                  <button className="proj-card acc state" style={{ "--hue": p.hue }} onClick={() => openProject(p.id)}>
                    <span className="proj-mark" style={{ clipPath: cookie(i % 2 ? 8 : 12, 0.075) }}>{p.name.slice(0, 1).toUpperCase()}</span>
                    <span className="proj-info">
                      <span className="title-lg">{p.name}</span>
                      {p.tagline && <span className="body-md">{p.tagline}</span>}
                    </span>
                    <WavyProgress value={done} total={total} label={`${p.name} progress`} />
                    <span className="proj-stat body-md">
                      <span>{total === 0 ? "No tasks yet" : `${done} of ${total} tasks done`}</span>
                      <span className="stage-pill label-md">{p.stage}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <Fab className="proj-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New project" extended={!scrollingDown} onClick={() => setCreating(true)} />
      {creating && <ProjectSheet onClose={() => setCreating(false)} onSave={create} />}
    </>
  );
}
