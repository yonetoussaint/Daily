import { LayoutGrid, ListChecks, Menu, Moon, Plus, Sun, SunMoon } from "lucide-react";
import { Fab, IconButton, NavigationBar, TopAppBar, useScrollingDown } from "../design/components";
import { RoomsScreen, TaskSheet, TasksProvider, TasksScreen, useTasks } from "../features/tasks";
import { useTheme } from "./useTheme";
import { useDrawer } from "./DrawerProvider";
import { useNav } from "./NavProvider";
import "./AppShell.css";

const DESTINATIONS = [
  { id: "tasks", label: "Tasks", icon: <ListChecks size={24} /> },
  { id: "rooms", label: "Rooms", icon: <LayoutGrid size={24} /> },
];
const TITLES = { tasks: "Home tasks", rooms: "Rooms" };
const THEME_ICON = { auto: SunMoon, light: Sun, dark: Moon };

function Layout() {
  const { tab, goTab } = useNav();
  const { editor, openEditor } = useTasks();
  const theme = useTheme();
  const drawer = useDrawer();
  const scrollingDown = useScrollingDown();
  const ThemeIcon = THEME_ICON[theme.mode];

  return (
    <div className="shell">
      <NavigationBar items={DESTINATIONS} value={tab} onChange={goTab} />
      <div className="shell-main">
        <TopAppBar
          title={TITLES[tab] ?? "Daily"}
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
          {tab === "rooms" ? <RoomsScreen /> : <TasksScreen />}
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
