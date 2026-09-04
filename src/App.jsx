// src/App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
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
          gap: 8,
          padding: "8px 12px",
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(20,24,20,0.06)",
          border: "1px solid #DFE2DE",
          flexWrap: "wrap"
        }}>
          <Link 
            to="/" 
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
            Home
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
            About
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
            Settings
          </Link>
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomeOrganizer />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;