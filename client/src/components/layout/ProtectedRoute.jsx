// ============================================================
// ProtectedRoute.jsx
// Gatekeeper for private pages: waits for the auth check to
// finish, sends logged-out visitors to /login, and (when
// allowedRoles is given) redirects wrong-role users to their
// own home page before rendering the nested routes.
// ============================================================
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const ProtectedRoute = ({ allowedRoles = [] }) => {
  // Current user + first-load flag come from AuthContext.
  const { user, loading } = useAuth();

  // Still checking the saved session -> show a spinner instead of the page.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-medium text-sm">Loading EduCore SMS...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all -> bounce to the login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed here -> redirect to that user's own home page.
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    if (user.role === "student") return <Navigate to="/student/portal" replace />;
    if (user.role === "faculty") return <Navigate to="/faculty/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  // All checks passed -> render the nested child routes.
  return <Outlet />;
};
