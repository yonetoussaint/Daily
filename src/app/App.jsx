import { SnackbarProvider } from "../design/components";
import { DocsApp } from "../features/docs";
import AppShell from "./AppShell";
import DrawerProvider from "./DrawerProvider";
import Launcher from "./Launcher";
import NavProvider, { useNav } from "./NavProvider";

function Current() {
  const { app } = useNav();
  if (app === "docs") return <DocsApp />;
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
