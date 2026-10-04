import { Outlet, useLocation } from "react-router-dom";
import { LayoutGrid, ListChecks, Menu, Moon, Plus, Sun, SunMoon } from "lucide-react";
import { Fab, IconButton, NavigationBar, TopAppBar, useScrollingDown } from "../design/components";
import { TaskSheet, TasksProvider, useTasks } from "../features/tasks";
import { useTheme } from "./useTheme";
import { useDrawer } from "./DrawerProvider";
import "./AppShell.css";

const DESTINATIONS = [
  { to: "/", label: "Tasks", icon: <ListChecks size={24} />, end: true },
  { to: "/rooms", label: "Rooms", icon: <LayoutGrid size={24} /> },
];
const TITLES = { "/": "Home tasks", "/rooms": "Rooms" };
const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

function Layout() {
  const { pathname } = useLocation();
  const { editor, openEditor } = useTasks();
  const theme = useTheme();
  const drawer = useDrawer();
  const scrollingDown = useScrollingDown();
  const ThemeIcon = THEME_ICON[theme.mode];

  return (
    <div className="shell">
      <NavigationBar items={DESTINATIONS} />
      <div className="shell-main">
        <TopAppBar
          title={TITLES[pathname] ?? "Daily"}
          leading={
            <IconButton label="Open menu" onClick={drawer.open}>
              <Menu size={24} />
            </IconButton>
          }
          actions={
            <IconButton label={`Theme: ${theme.mode}. Switch to ${theme.next}`} onClick={theme.cycle}>
              <ThemeIcon size={22} />
            </IconButton>
          }
        />
        <main>
          <Outlet />
        </main>
      </div>
      <Fab className="shell-fab" icon={<Plus size={26} strokeWidth={2.6} />} label="New task" extended={!scrollingDown} onClick={() => openEditor()} />
      {editor && <TaskSheet />}
    </div>
  );
}

export default function AppShell() {
  return (
    <TasksProvider>
      <Layout />
    </TasksProvider>
  );
}
