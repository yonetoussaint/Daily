import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SnackbarProvider } from "../design/components";
import { RoomsScreen, TasksScreen } from "../features/tasks";
import DocsApp from "../features/docs/DocsApp";
import AppShell from "./AppShell";

export default function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TasksScreen />} />
            <Route path="rooms" element={<RoomsScreen />} />
          </Route>
          <Route path="/docs" element={<DocsApp />} />
          {/* the old organizer URL keeps working */}
          <Route path="/organizer" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </SnackbarProvider>
    </BrowserRouter>
  );
}
