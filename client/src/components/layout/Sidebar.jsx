import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Sidebar = ({ isMobileOpen, setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const adminLinks = [
    { to: "/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/students", icon: "group", label: "Students" },
    { to: "/faculty", icon: "badge", label: "Faculty" },
    { to: "/courses", icon: "school", label: "Courses" },
    { to: "/attendance", icon: "event_available", label: "Attendance" },
    { to: "/fees", icon: "payments", label: "Fees" },
    { to: "/exams", icon: "quiz", label: "Exams" },
    { to: "/notices", icon: "campaign", label: "Notices" },
    { to: "/reports", icon: "analytics", label: "Reports" },
    { to: "/settings", icon: "settings", label: "Settings" },
  ];

  const facultyLinks = [
    { to: "/faculty/dashboard", icon: "dashboard", label: "Dashboard" },
    { to: "/attendance", icon: "event_available", label: "Mark Attendance" },
    { to: "/courses", icon: "school", label: "My Courses" },
    { to: "/exams", icon: "quiz", label: "Exams & Marks" },
    { to: "/notices", icon: "campaign", label: "Notices" },
    { to: "/settings", icon: "settings", label: "Settings" },
  ];

  const studentLinks = [
    { to: "/student/portal", icon: "dashboard", label: "My Portal" },
    { to: "/student/attendance", icon: "event_available", label: "My Attendance" },
    { to: "/student/fees", icon: "payments", label: "Fee Status" },
    { to: "/student/results", icon: "workspace_premium", label: "Results" },
    { to: "/notices", icon: "campaign", label: "Notices" },
    { to: "/settings", icon: "settings", label: "Settings" },
  ];

  let links = adminLinks;
  if (user?.role === "faculty") links = facultyLinks;
  else if (user?.role === "student") links = studentLinks;

  const closeSidebar = () => {
    if (setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      <nav
        className={`fixed left-0 top-0 h-screen w-[280px] bg-primary text-on-primary py-6 flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="px-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-primary text-2xl material-symbols-fill">
                school
              </span>
            </div>
            <div>
              <h1 className="font-bold text-lg text-on-primary tracking-tight">EduCore SMS</h1>
              <p className="text-xs text-on-primary/70 font-medium capitalize">
                {user?.role ? `${user.role} Portal` : "Diploma Engineering"}
              </p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="md:hidden text-on-primary/70 hover:text-on-primary p-1"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-4 flex flex-col gap-1.5 custom-scrollbar">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary-container text-on-primary-container shadow-sm border-l-4 border-secondary-container"
                    : "text-on-primary/80 hover:text-on-primary hover:bg-white/10"
                }`
              }
            >
              <span className="material-symbols-outlined text-xl">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* User Card & Logout */}
        <div className="p-4 mx-3 rounded-2xl bg-white/10 border border-white/10 mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0 uppercase">
              {user?.name ? user.name.slice(0, 2) : "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-on-primary truncate">{user?.name || "User"}</p>
              <p className="text-xs text-on-primary/60 truncate capitalize">{user?.role || "Guest"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-on-primary/70 hover:text-on-primary hover:bg-white/10 rounded-lg transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
          </button>
        </div>
      </nav>
    </>
  );
};
