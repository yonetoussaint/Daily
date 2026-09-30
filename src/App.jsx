import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import HomeOrganizer from "./features/organizer/HomeOrganizer";
import DocsApp from "./features/docs/DocsApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/organizer" replace />} />
        <Route path="/organizer" element={<HomeOrganizer />} />
        <Route path="/docs" element={<DocsApp />} />
      </Routes>
    </BrowserRouter>
  );
}
