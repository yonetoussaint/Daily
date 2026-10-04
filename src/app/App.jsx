import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { SnackbarProvider } from "../design/components";
import { RoomsScreen, TasksScreen } from "../features/tasks";
import { BookScreen, DocsLayout, LibraryScreen } from "../features/docs";
import AppShell from "./AppShell";
import DrawerProvider from "./DrawerProvider";

export default function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider>
        <DrawerProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<TasksScreen />} />
              <Route path="rooms" element={<RoomsScreen />} />
            </Route>
            <Route path="/docs" element={<DocsLayout />}>
              <Route index element={<LibraryScreen />} />
              <Route path=":bookId" element={<BookScreen />} />
            </Route>
            {/* the old organizer URL keeps working */}
            <Route path="/organizer" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DrawerProvider>
      </SnackbarProvider>
    </BrowserRouter>
  );
}
