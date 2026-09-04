// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import HomeOrganizer from "./components/HomeOrganizer";
import "./App.css";

// Simple pages
function AboutPage() {
  return (
    <div className="page-container">
      <h1>About Home Organizer</h1>
      <p>A simple home organization tool to keep track of items across different rooms.</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="page-container">
      <h1>Settings</h1>
      <p>Customize your home organizer experience.</p>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="app-container">
        {/* Navigation */}
        <nav className="nav-bar">
          <Link to="/organizer" className="nav-link">📋 Organizer</Link>
          <Link to="/about" className="nav-link">ℹ️ About</Link>
          <Link to="/settings" className="nav-link">⚙️ Settings</Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Navigate to="/organizer" replace />} />
          <Route path="/organizer" element={<HomeOrganizer />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;