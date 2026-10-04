import { SnackbarProvider } from "../design/components";
import { DocsApp } from "../features/docs";
import AppShell from "./AppShell";
import DrawerProvider from "./DrawerProvider";
import NavProvider, { useNav } from "./NavProvider";

function Current() {
  const { app } = useNav();
  return app === "docs" ? <DocsApp /> : <AppShell />;
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
