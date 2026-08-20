import React from "react";

export const StatsCard = ({ title, value, icon, color = "primary", change, subtitle }) => {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
    tertiary: "bg-tertiary-fixed text-on-tertiary-fixed",
    success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    danger: "bg-error/10 text-error",
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.primary}`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {change && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
            change.startsWith("+") ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          }`}>
            {change}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-black text-on-surface tracking-tight">{value}</h3>
        <p className="text-xs font-semibold text-on-surface-variant mt-1 uppercase tracking-wider">{title}</p>
        {subtitle && <p className="text-xs text-on-surface-variant/70 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export const Badge = ({ status, variant }) => {
  const norm = (status || variant || "").toLowerCase();
  
  const styles = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    present: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    scheduled: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
    completed: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300",
    pending: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    partial: "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300",
    leave: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    absent: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
    overdue: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300",
    inactive: "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300",
  };

  const currentStyle = styles[norm] || "bg-gray-100 text-gray-800 border-gray-300";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStyle} capitalize`}>
      {status || variant}
    </span>
  );
};

export const Modal = ({ isOpen, onClose, title, children, maxWidth = "max-w-xl" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className={`relative bg-surface-container-lowest rounded-3xl shadow-2xl border border-outline-variant/40 w-full ${maxWidth} overflow-hidden z-10 animate-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
          <h2 className="text-lg font-bold text-on-surface">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const TableSkeleton = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-surface-container rounded-xl w-full" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-12 bg-surface-container-low rounded-xl flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
