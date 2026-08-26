// ============================================================
// main.jsx
// Entry point of the app: mounts <App /> into index.html and
// wraps everything in BrowserRouter (pages), ThemeProvider
// (dark/light mode) and AuthProvider (logged-in user).
// ============================================================
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

// Attach React to the "root" div in index.html and render the app.
ReactDOM.createRoot(document.getElementById("root")).render(
  // StrictMode adds extra development-time checks to catch bugs early.
  <React.StrictMode>
    {/* Enables client-side routing (page changes without full reloads) */}
    <BrowserRouter>
      {/* Shares dark/light theme state with every page */}
      <ThemeProvider>
        {/* Shares the logged-in user and auth actions with every page */}
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
