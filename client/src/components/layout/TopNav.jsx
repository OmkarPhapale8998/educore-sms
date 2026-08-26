// ============================================================
// TopNav.jsx
// Sticky header bar shown on every logged-in page: global
// student search, dark/light theme toggle, notification bell
// dropdown, and the user profile menu (profile / logout).
// ============================================================
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { notificationAPI } from "../../api";

export const TopNav = ({ onMobileMenuClick }) => {
  // Auth gives the user + logout; Theme gives the dark-mode toggle.
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Latest notifications fetched from the API.
  const [notifications, setNotifications] = useState([]);
  // How many are still unread (drives the red badge).
  const [unreadCount, setUnreadCount] = useState(0);
  // Is the notifications dropdown open?
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  // Is the profile dropdown open?
  const [showUserMenu, setShowUserMenu] = useState(false);
  // Text typed into the global search box.
  const [searchQuery, setSearchQuery] = useState("");

  // Refs let us detect clicks OUTSIDE a dropdown to close it.
  const notifRef = useRef();
  const userRef = useRef();

  // Runs once: fetch notifications now, then poll every 60 seconds.
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1 min poll
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifMenu(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Pulls my notifications and unread count from the API (fails silently).
  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMy();
      if (res.data.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      // quiet fail
    }
  };

  // Marks ONE notification as read in the API and in the local list.
  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  // Marks ALL notifications as read at once.
  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  // Sends the search text to the Students page as a URL filter.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/students?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="sticky top-0 z-30 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 h-16 px-4 md:px-8 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile menu toggle */}
        <button
          onClick={onMobileMenuClick}
          className="md:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center bg-surface-container-low rounded-full px-4 py-2 w-full max-w-md focus-within:ring-2 ring-primary transition-all">
          <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">search</span>
          <input
            type="text"
            placeholder="Search students, roll no, faculty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm text-on-surface w-full placeholder:text-on-surface-variant/70"
          />
        </form>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-xl">
            {isDark ? "light_mode" : "dark_mode"}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2.5 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface relative transition-colors"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-surface-container-lowest">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifMenu && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Dropdown header with "mark all read" */}
              <div className="px-4 py-2 flex items-center justify-between border-b border-outline-variant/20">
                <h3 className="font-bold text-sm text-on-surface">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* The notification list (or an empty-state message) */}
              <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/10">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-on-surface-variant text-sm">
                    <span className="material-symbols-outlined text-3xl mb-1 text-on-surface-variant/40">
                      notifications_off
                    </span>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkRead(n._id)}
                      className={`p-3.5 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 items-start ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`p-2 rounded-full mt-0.5 shrink-0 ${
                        n.type === "low_attendance" ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                      }`}>
                        <span className="material-symbols-outlined text-base">
                          {n.type === "low_attendance" ? "warning" :
                           n.type === "marks_published" ? "grade" : "campaign"}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-xs text-on-surface truncate">{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-on-surface-variant/60 mt-1">
                          {new Date(n.createdAt).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-container transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {user?.name ? user.name.slice(0, 2) : "U"}
            </div>
            <span className="hidden sm:block font-medium text-xs text-on-surface">{user?.name}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-base">expand_more</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Name, email and role of the signed-in user */}
              <div className="px-4 py-2 border-b border-outline-variant/20">
                <p className="font-bold text-sm text-on-surface truncate">{user?.name}</p>
                <p className="text-xs text-on-surface-variant truncate">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full uppercase">
                  {user?.role}
                </span>
              </div>

              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-base">person</span>
                My Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setShowUserMenu(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-on-surface hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-base">lock</span>
                Change Password
              </Link>
              <div className="border-t border-outline-variant/20 my-1" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-error hover:bg-error/5 transition-colors font-semibold"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
