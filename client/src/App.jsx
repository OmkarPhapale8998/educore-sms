import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Layout } from "./components/layout/Layout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

// Auth Pages
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";

// Admin / Shared Module Pages
import { DashboardPage } from "./pages/admin/DashboardPage";
import { StudentsPage } from "./pages/admin/StudentsPage";
import { AddStudentPage } from "./pages/admin/AddStudentPage";
import { StudentProfilePage } from "./pages/admin/StudentProfilePage";
import { FacultyPage } from "./pages/admin/FacultyPage";
import { CoursesPage } from "./pages/admin/CoursesPage";
import { AttendancePage } from "./pages/admin/AttendancePage";
import { FeesPage } from "./pages/admin/FeesPage";
import { ExamsPage } from "./pages/admin/ExamsPage";
import { NoticesPage } from "./pages/admin/NoticesPage";
import { ReportsPage } from "./pages/admin/ReportsPage";
import { SettingsPage } from "./pages/admin/SettingsPage";

// Role-specific Pages
import { FacultyDashboard } from "./pages/faculty/FacultyDashboard";
import { StudentPortal } from "./pages/student/StudentPortal";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#ffffff",
            color: "#191c1e",
            borderRadius: "16px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            fontSize: "13px",
            fontWeight: "600",
            border: "1px solid #e0e3e5"
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#ffffff"
            }
          }
        }}
      />

      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

        {/* Protected App Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            {/* Admin Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/add" element={<AddStudentPage />} />
            <Route path="/students/:id" element={<StudentProfilePage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/fees" element={<FeesPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/notices" element={<NoticesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Faculty Dedicated Routes */}
            <Route path="/faculty/dashboard" element={<FacultyDashboard />} />

            {/* Student Dedicated Routes */}
            <Route path="/student/portal" element={<StudentPortal />} />
            <Route path="/student/attendance" element={<StudentPortal />} />
            <Route path="/student/fees" element={<StudentPortal />} />
            <Route path="/student/results" element={<StudentPortal />} />
          </Route>
        </Route>

        {/* Catch-all redirect to login or dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}
