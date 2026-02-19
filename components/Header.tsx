"use client";

import { Download, Clock } from "lucide-react";
import type { AnalysisResult, CampaignSnapshot, ComputedFields } from "@/lib/schema";
import { buildExportPayload, downloadJson, formatTimestamp } from "@/lib/utils";
import type { HistoryItem } from "@/lib/schema";

interface HeaderProps {
  result: AnalysisResult | null;
  snapshot: CampaignSnapshot | null;
  computed: ComputedFields | null;
  simulationMode: boolean;
  onToggleSimulation: () => void;
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
}

export function Header({
  result,
  snapshot,
  computed,
  simulationMode,
  onToggleSimulation,
  history,
  onLoadHistory,
}: HeaderProps) {
  function handleExport() {
    if (!result || !snapshot || !computed) return;
    const payload = buildExportPayload(snapshot, computed, result);
    const filename = `ago-analysis-${snapshot.brandName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}.json`;
    downloadJson(payload, filename);
  }

  const hasResult = !!result;

  // Ambient glow changes with mode
  const headerGlow = simulationMode
    ? "0 1px 0 0 rgba(245,158,11,0.12), 0 4px 24px rgba(245,158,11,0.04)"
    : "0 1px 0 0 rgba(139,92,246,0.08), 0 4px 24px rgba(52,211,153,0.03)";

  const headerBorder = simulationMode
    ? "rgba(245,158,11,0.18)"
    : "var(--border-1)";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "var(--header-bg)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${headerBorder}`,
        boxShadow: headerGlow,
        transition: "box-shadow 0.4s ease, border-color 0.4s ease, background 0.25s",
      }}
    >
      {/* Sim mode ambient bar */}
      {simulationMode && (
        <div
          style={{
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.5), rgba(245,158,11,0.8), rgba(245,158,11,0.5), transparent)",
            transition: "opacity 0.3s",
          }}
        />
      )}
      {!simulationMode && (
        <div
          style={{
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.3), rgba(52,211,153,0.5), rgba(52,211,153,0.3), transparent)",
            transition: "opacity 0.3s",
          }}
        />
      )}

      <div
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 1.5rem",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        {/* Left: Branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0 }}>
          {/* Logo mark */}
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #7c3aed, #ec4899)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 0 16px rgba(139, 92, 246, 0.4)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 2L13 5.5V10.5L8 14L3 10.5V5.5L8 2Z"
                stroke="white"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="2" fill="white" fillOpacity="0.8" />
            </svg>
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h1
                className="gradient-text"
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                AI Growth Operator
              </h1>
              <span className="badge badge-beta">BETA</span>

              {/* Mode badge */}
              {simulationMode ? (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.28)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "#f59e0b",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#f59e0b",
                      boxShadow: "0 0 5px rgba(245,158,11,0.8)",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  Simulation Mode
                </span>
              ) : (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "9999px",
                    background: "rgba(52,211,153,0.08)",
                    border: "1px solid rgba(52,211,153,0.22)",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "#34d399",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                >
                  <span
                    style={{
                      width: "5px",
                      height: "5px",
                      borderRadius: "50%",
                      background: "#34d399",
                      boxShadow: "0 0 5px rgba(52,211,153,0.7)",
                    }}
                  />
                  Live Mode
                </span>
              )}
            </div>
            <p
              style={{
                fontSize: "0.6875rem",
                color: "var(--fg3)",
                margin: 0,
                lineHeight: 1,
                marginTop: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Omnia1 Growth OS · Experiment Intelligence Layer
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
          {/* History dropdown */}
          {history.length > 0 && (
            <div style={{ position: "relative" }} className="group">
              <button
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.375rem 0.625rem",
                }}
              >
                <Clock size={13} />
                <span style={{ fontSize: "0.75rem" }}>History</span>
              </button>
              {/* Dropdown */}
              <div
                className="group-hover:opacity-100 group-hover:pointer-events-auto"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "280px",
                  background: "var(--dropdown-bg)",
                  border: "1px solid rgba(139, 92, 246, 0.2)",
                  borderRadius: "12px",
                  padding: "0.5rem",
                  zIndex: 50,
                  boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
                  opacity: 0,
                  pointerEvents: "none",
                  transition: "opacity 0.15s",
                }}
              >
                <p
                  style={{
                    fontSize: "0.6875rem",
                    color: "var(--fg3)",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "0.375rem 0.5rem 0.5rem",
                    margin: 0,
                    borderBottom: "1px solid var(--border-1)",
                  }}
                >
                  Recent Analyses
                </p>
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onLoadHistory(item)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "8px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(139, 92, 246, 0.08)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    <span style={{ fontSize: "0.8125rem", color: "var(--fg1)", fontWeight: 500 }}>
                      {item.snapshot.brandName}
                    </span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--fg3)" }}>
                      {item.snapshot.industry} · {formatTimestamp(item.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode toggle */}
          <ModeToggle simulationMode={simulationMode} onToggle={onToggleSimulation} />

          {/* Export JSON */}
          <button
            className="btn-ghost"
            onClick={handleExport}
            disabled={!hasResult}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}
          >
            <Download size={13} />
            <span style={{ fontSize: "0.75rem" }}>Export JSON</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Mode toggle pill ─────────────────────────────────────────────────────────

function ModeToggle({
  simulationMode,
  onToggle,
}: {
  simulationMode: boolean;
  onToggle: () => void;
}) {
  const isLive = !simulationMode;

  return (
    <button
      onClick={onToggle}
      title={
        simulationMode
          ? "Simulation Mode – Using demo data. Click to switch to Live Mode."
          : "Live Mode – Real campaign inputs only. Click to enable demo scenarios."
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.3rem 0.625rem 0.3rem 0.375rem",
        borderRadius: "9999px",
        border: `1px solid ${simulationMode ? "rgba(245,158,11,0.3)" : "rgba(52,211,153,0.25)"}`,
        background: simulationMode
          ? "rgba(245,158,11,0.07)"
          : "rgba(52,211,153,0.06)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        outline: "none",
      }}
    >
      {/* Track */}
      <div
        style={{
          width: "28px",
          height: "15px",
          borderRadius: "9999px",
          background: simulationMode
            ? "linear-gradient(135deg, #d97706, #f59e0b)"
            : "linear-gradient(135deg, #059669, #34d399)",
          position: "relative",
          transition: "background 0.3s",
          flexShrink: 0,
          boxShadow: simulationMode
            ? "0 0 6px rgba(245,158,11,0.4)"
            : "0 0 6px rgba(52,211,153,0.4)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: simulationMode ? "calc(100% - 13px)" : "2px",
            width: "11px",
            height: "11px",
            borderRadius: "50%",
            background: "white",
            transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Label */}
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          color: simulationMode ? "#f59e0b" : "#34d399",
          letterSpacing: "0.01em",
          transition: "color 0.25s",
          lineHeight: 1,
        }}
      >
        {isLive ? "Live" : "Sim"}
      </span>
    </button>
  );
}
