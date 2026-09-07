import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import HomeOrganizer from "./components/HomeOrganizer";
import DocsApp from "./components/DocsApp"; // Import the new component
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Redirect root to organizer - shows nothing on homepage */}
          <Route path="/" element={<Navigate to="/organizer" replace />} />
          <Route path="/organizer" element={<HomeOrganizer />} />
          <Route path="/docs" element={<DocsApp />} /> {/* New route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;