// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import HomeOrganizer from "./components/HomeOrganizer";

// Example additional pages
function AboutPage() {
  return (
    <div style={{
      fontFamily: '"Inter", sans-serif',
      background: "#FFFFFF",
      width: "100%",
      maxWidth: 440,
      height: 660,
      padding: "40px",
      borderRadius: 16,
      border: "1px solid #DFE2DE",
      boxShadow: "0 1px 3px rgba(20,24,20,0.06)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#1B211D" }}>
        About Home Organizer
      </h1>
      <p style={{ fontSize: 14, color: "#6E756F", lineHeight: 1.6 }}>
        A simple home organization tool to keep track of items across different rooms in your home.
      </p>
      <div style={{ marginTop: 20, fontSize: 13, color: "#9AA09A" }}>
        Built with React + TypeScript + Supabase
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div style={{
      fontFamily: '"Inter", sans-serif',
      background: "#FFFFFF",
      width: "100%",
      maxWidth: 440,
      height: 660,
      padding: "40px",
      borderRadius: 16,
      border: "1px solid #DFE2DE",
      boxShadow: "0 1px 3px rgba(20,24,20,0.06)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center"
    }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 12, color: "#1B211D" }}>
        Settings
      </h1>
      <p style={{ fontSize: 14, color: "#6E756F", lineHeight: 1.6 }}>
        Customize your home organizer experience.
      </p>
    </div>
  );
}

// Component to show current route
function RouteIndicator() {
  const location = useLocation();
  return (
    <div style={{
      fontSize: 11,
      color: "#9AA09A",
      marginTop: 4,
      padding: "4px 8px",
      background: "#F6F7F6",
      borderRadius: 4,
      fontFamily: '"Inter", sans-serif'
    }}>
      Current: {location.pathname || "/"}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div style={{ 
        minHeight: "100vh", 
        background: "#EEF0EE",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px"
      }}>
        {/* Navigation */}
        <nav style={{
          width: "100%",
          maxWidth: 440,
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "12px 16px",
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(20,24,20,0.06)",
          border: "1px solid #DFE2DE"
        }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link 
              to="/organizer" 
              style={({ isActive }) => ({
                fontFamily: '"Inter", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? "#2F6F52" : "#6E756F",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 6,
                background: isActive ? "#E4EFE8" : "transparent"
              })}
            >
              📋 Organizer
            </Link>
            <Link 
              to="/about" 
              style={({ isActive }) => ({
                fontFamily: '"Inter", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? "#2F6F52" : "#6E756F",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 6,
                background: isActive ? "#E4EFE8" : "transparent"
              })}
            >
              ℹ️ About
            </Link>
            <Link 
              to="/settings" 
              style={({ isActive }) => ({
                fontFamily: '"Inter", sans-serif',
                fontSize: 14,
                fontWeight: 500,
                color: isActive ? "#2F6F52" : "#6E756F",
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 6,
                background: isActive ? "#E4EFE8" : "transparent"
              })}
            >
              ⚙️ Settings
            </Link>
          </div>
          <RouteIndicator />
        </nav>

        {/* Routes */}
        <Routes>
          {/* Redirect root to organizer */}
          <Route path="/" element={<Navigate to="/organizer" replace />} />
          <Route path="/organizer" element={<HomeOrganizer />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

// Add Navigate import
import { Navigate } from "react-router-dom";

export default App;