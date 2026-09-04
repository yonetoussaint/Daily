// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomeOrganizer from "./components/HomeOrganizer";

// You can add more components here as you build them
// import AnotherComponent from "./components/AnotherComponent";

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
          gap: 12,
          padding: "12px 16px",
          background: "#FFFFFF",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(20,24,20,0.06)",
          border: "1px solid #DFE2DE"
        }}>
          <Link 
            to="/" 
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: "#2F6F52",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 6,
              background: "#E4EFE8"
            }}
          >
            Home Organizer
          </Link>
          <Link 
            to="/about" 
            style={{
              fontFamily: '"Inter", sans-serif',
              fontSize: 14,
              fontWeight: 500,
              color: "#6E756F",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 6
            }}
          >
            About
          </Link>
          {/* Add more navigation links as you create more components */}
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomeOrganizer />} />
          <Route path="/about" element={<AboutPage />} />
          {/* Add more routes as you build more components */}
          {/* <Route path="/another" element={<AnotherComponent />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

// Example About page component
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

export default App;