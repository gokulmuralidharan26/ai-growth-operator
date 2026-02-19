"use client";

import { useState, useEffect, useRef } from "react";
import { Settings, Sun, Moon } from "lucide-react";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const ref = useRef<HTMLDivElement>(null);

  // Load persisted theme on mount
  useEffect(() => {
    const saved = (localStorage.getItem("ago_theme") as "dark" | "light") ?? "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ago_theme", next);
  }

  const isDark = theme === "dark";

  return (
    <div
      ref={ref}
      style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 100 }}
    >
      {/* Settings panel */}
      {open && (
        <div className="settings-panel">
          {/* Panel header */}
          <p
            style={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "var(--fg3)",
              margin: "0 0 0.875rem",
            }}
          >
            Settings
          </p>

          {/* Appearance row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.75rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              {isDark ? (
                <Moon size={14} color="var(--fg2)" />
              ) : (
                <Sun size={14} color="#f59e0b" />
              )}
              <span
                style={{
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  color: "var(--fg1)",
                }}
              >
                {isDark ? "Dark mode" : "Light mode"}
              </span>
            </div>

            {/* Toggle */}
            <div
              className={`toggle-track ${isDark ? "active" : ""}`}
              onClick={toggleTheme}
              role="switch"
              aria-checked={isDark}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && toggleTheme()}
              style={{
                background: isDark
                  ? "linear-gradient(135deg, #7c3aed, #8b5cf6)"
                  : "rgba(245,158,11,0.25)",
                borderColor: isDark
                  ? "rgba(139,92,246,0.5)"
                  : "rgba(245,158,11,0.4)",
              }}
            >
              <div className="toggle-thumb" />
            </div>
          </div>

          {/* Divider */}
          <div
            style={{
              borderTop: "1px solid var(--border-2)",
              margin: "0.875rem 0",
            }}
          />

          {/* Version info */}
          <p
            style={{
              fontSize: "0.6875rem",
              color: "var(--fg3)",
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            AI Growth Operator
            <br />
            <span style={{ color: "var(--fg4)" }}>AI Growth Operator v2.0</span>
          </p>
        </div>
      )}

      {/* FAB trigger */}
      <button
        className="settings-fab"
        onClick={() => setOpen((v) => !v)}
        aria-label="Settings"
        style={{
          transform: open ? "rotate(45deg)" : undefined,
        }}
      >
        <Settings size={18} />
      </button>
    </div>
  );
}
