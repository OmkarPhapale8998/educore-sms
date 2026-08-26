// ============================================================
// Layout.jsx
// Shared page frame for logged-in users: fixed Sidebar on the
// left, TopNav bar on top, and the active page rendered in
// the middle via <Outlet />.
// ============================================================
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export const Layout = () => {
  // Whether the sidebar drawer is open on mobile screens.
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex text-on-background">
      {/* Left sidebar navigation (slides over the screen on mobile) */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      {/* Right side: top bar + routed page content */}
      <div className="flex-1 flex flex-col md:ml-[280px] min-h-screen w-full overflow-x-hidden">
        <TopNav onMobileMenuClick={() => setIsMobileOpen(true)} />
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {/* The matched child route (page) renders here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};
