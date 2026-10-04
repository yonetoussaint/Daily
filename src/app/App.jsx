import { SnackbarProvider } from "../design/components";
import { DocsApp } from "../features/docs";
import { ProjectsApp } from "../features/projects";
import { TodoApp } from "../features/todo";
import { ValuesApp } from "../features/values";
import AppShell from "./AppShell";
import DrawerProvider from "./DrawerProvider";
import Launcher from "./Launcher";
import NavProvider, { useNav } from "./NavProvider";

function Current() {
  const { app } = useNav();
  if (app === "docs") return <DocsApp />;
  if (app === "projects") return <ProjectsApp />;
  if (app === "todo") return <TodoApp />;
  if (app === "values") return <ValuesApp />;
  if (app === "tasks") return <AppShell />;
  return <Launcher />;
}

export default function App() {
  return (
    <NavProvider>
      <SnackbarProvider>
        <DrawerProvider>
          <Current />
        </DrawerProvider>
      </SnackbarProvider>
    </NavProvider>
  );
}
