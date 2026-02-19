"use client";

import { useEffect, useState } from "react";
import { Brain, Trophy, GitCompare, Loader2, ChevronDown, ChevronUp, CheckCircle2, BookOpen } from "lucide-react";
import type { SimilarCase, AnalysisResult, HistoryItem } from "@/lib/schema";
import { loadHistory } from "@/lib/utils";

// ─── Run meta stored in localStorage ─────────────────────────────────────────

interface RunMeta {
  notes: string;
  resolved: boolean;
}

function loadRunMeta(): Record<string, RunMeta> {
  try { return JSON.parse(localStorage.getItem("ago_run_meta") ?? "{}"); } catch { return {}; }
}

function saveRunMeta(meta: Record<string, RunMeta>) {
  localStorage.setItem("ago_run_meta", JSON.stringify(meta));
}

interface MemoryTabProps {
  runId: string | null;
  currentResult: AnalysisResult | null;
}

const BOTTLENECK_COLORS: Record<string, string> = {
  Creative: "#a855f7",
  Conversion: "#3b82f6",
  Scaling: "#10b981",
  Efficiency: "#f59e0b",
};

function SimilarityBar({ score }: { score: number }) {
  const color = score >= 70 ? "#34d399" : score >= 45 ? "#f59e0b" : "#94a3b8";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: "4px", background: "var(--surface-d)", borderRadius: "9999px", overflow: "hidden" }}>
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            borderRadius: "9999px",
            transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
      <span style={{ fontSize: "0.6875rem", fontWeight: 700, color, minWidth: "28px" }}>
        {score}%
      </span>
    </div>
  );
}

function ComparePanel({
  current,
  past,
}: {
  current: AnalysisResult;
  past: { aiOutput: AnalysisResult; riskScore: number; primaryBottleneck: string };
}) {
  const curRisk = current.risk?.riskScore ?? 0;
  const pastRisk = past.riskScore;
  const riskDelta = curRisk - pastRisk;

  return (
    <div
      style={{
        marginTop: "0.75rem",
        padding: "0.875rem",
        background: "rgba(139,92,246,0.06)",
        border: "1px solid rgba(139,92,246,0.15)",
        borderRadius: "10px",
      }}
    >
      <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#a78bfa", letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>
        Comparison
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <CompareCell label="Current" bottleneck={current.primaryBottleneck} risk={curRisk} isCurrent />
        <CompareCell label="Past Run" bottleneck={past.primaryBottleneck} risk={pastRisk} />
      </div>
      {riskDelta !== 0 && (
        <p style={{ fontSize: "0.75rem", color: riskDelta > 0 ? "#f87171" : "#34d399", marginTop: "0.625rem", fontWeight: 500 }}>
          Risk {riskDelta > 0 ? `+${riskDelta}` : riskDelta} pts vs this case
        </p>
      )}
    </div>
  );
}

function CompareCell({
  label,
  bottleneck,
  risk,
  isCurrent,
}: {
  label: string;
  bottleneck: string;
  risk: number;
  isCurrent?: boolean;
}) {
  const color = BOTTLENECK_COLORS[bottleneck] ?? "#a78bfa";
  return (
    <div
      style={{
        padding: "0.625rem",
        borderRadius: "8px",
        background: isCurrent ? "rgba(139,92,246,0.08)" : "var(--surface-b)",
        border: `1px solid ${isCurrent ? "rgba(139,92,246,0.2)" : "var(--border-2)"}`,
      }}
    >
      <p style={{ fontSize: "0.6875rem", color: "var(--fg3)", fontWeight: 600, margin: "0 0 0.375rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </p>
      <p style={{ fontSize: "0.75rem", fontWeight: 700, color, margin: "0 0 0.25rem" }}>{bottleneck}</p>
      <p style={{ fontSize: "0.6875rem", color: "var(--fg3)", margin: 0 }}>Risk: {risk}/100</p>
    </div>
  );
}

export function MemoryTab({ runId, currentResult }: MemoryTabProps) {
  const [similar, setSimilar] = useState<SimilarCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCompare, setExpandedCompare] = useState<string | null>(null);

  useEffect(() => {
    if (!runId || runId.startsWith("sim-") || runId.startsWith("tmp-")) return;
    setLoading(true);
    setError(null);
    fetch(`/api/similar?runId=${runId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setSimilar(data.similar ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [runId]);

  // Collect all winning experiments across similar cases
  const topWins = similar
    .flatMap((s) =>
      s.winningExperiments.map((e) => ({
        ...e,
        fromBrand: s.run.brand,
        similarity: s.similarityScore,
      }))
    )
    .slice(0, 5);

  if (!runId) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "240px", gap: "0.75rem", textAlign: "center" }}>
        <Brain size={32} color="var(--fg3)" strokeWidth={1.5} />
        <p style={{ fontSize: "0.875rem", color: "var(--fg2)", margin: 0 }}>Run an analysis to unlock Memory</p>
        <p style={{ fontSize: "0.75rem", color: "var(--fg3)", margin: 0 }}>Similar past cases and winning experiments will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Similar Cases */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
          <Brain size={14} color="#a78bfa" />
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
            Similar Cases
          </p>
        </div>

        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--fg3)", fontSize: "0.8125rem" }}>
            <Loader2 size={14} className="spin" />
            Searching memory…
          </div>
        )}

        {error && (
          <p style={{ fontSize: "0.8125rem", color: "#f87171" }}>{error}</p>
        )}

        {!loading && !error && similar.length === 0 && (
          <div
            style={{
              padding: "1rem",
              background: "var(--surface-b)",
              borderRadius: "10px",
              border: "1px solid var(--border-2)",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "0.8125rem", color: "var(--fg3)", margin: 0 }}>
              No similar past runs found yet. More analyses will build your pattern library.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {similar.map((s) => {
            const isExpanded = expandedCompare === s.run.id;
            const color = BOTTLENECK_COLORS[s.run.primaryBottleneck] ?? "#a78bfa";
            return (
              <div
                key={s.run.id}
                className="fade-in-up"
                style={{
                  background: "var(--surface-b)",
                  border: "1px solid var(--border-2)",
                  borderRadius: "12px",
                  padding: "0.875rem 1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg1)", margin: "0 0 0.2rem" }}>
                      {s.run.brand}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--fg3)", margin: 0 }}>
                      {s.run.industry} · {s.run.window} ·{" "}
                      <span style={{ color, fontWeight: 600 }}>{s.run.primaryBottleneck}</span>
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, width: "100px" }}>
                    <SimilarityBar score={s.similarityScore} />
                  </div>
                </div>

                <p style={{ fontSize: "0.8125rem", color: "var(--fg2)", margin: "0 0 0.625rem", lineHeight: 1.55 }}>
                  {s.run.aiOutput?.summary?.oneLiner}
                </p>

                {currentResult && (
                  <button
                    onClick={() => setExpandedCompare(isExpanded ? null : s.run.id)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      color: "#a78bfa",
                      padding: 0,
                      fontWeight: 500,
                    }}
                  >
                    <GitCompare size={12} />
                    Compare with Current
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}

                {isExpanded && currentResult && (
                  <ComparePanel
                    current={currentResult}
                    past={{
                      aiOutput: s.run.aiOutput,
                      riskScore: s.run.riskScore,
                      primaryBottleneck: s.run.primaryBottleneck,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Run History */}
      <RunHistory />

      {/* Top Winning Experiments */}
      {topWins.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
            <Trophy size={14} color="#f59e0b" />
            <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
              Top Winning Experiments from Similar Cases
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {topWins.map((exp, i) => {
              const color = BOTTLENECK_COLORS[exp.bottleneckType] ?? "#a78bfa";
              const win = exp.outcomes?.find((o: { outcomeStatus: string }) => o.outcomeStatus === "Win");
              return (
                <div
                  key={exp.id + i}
                  className="fade-in-up"
                  style={{
                    padding: "0.875rem 1rem",
                    background: "rgba(52,211,153,0.04)",
                    border: "1px solid rgba(52,211,153,0.12)",
                    borderRadius: "10px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg1)", margin: 0 }}>
                      {exp.name}
                    </p>
                    <span style={{ padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)", fontSize: "0.6rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      WIN
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--fg3)", margin: "0 0 0.5rem" }}>
                    From <span style={{ color: color, fontWeight: 500 }}>{exp.fromBrand}</span> ({exp.similarity}% similar)
                  </p>
                  {win && Array.isArray(win.learnings) && win.learnings.length > 0 && (
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                      {(win.learnings as string[]).slice(0, 2).map((l: string, j: number) => (
                        <li key={j} style={{ display: "flex", gap: "0.375rem", fontSize: "0.75rem", color: "var(--fg2)", lineHeight: 1.5 }}>
                          <span style={{ width: "3px", height: "3px", borderRadius: "50%", background: "#34d399", flexShrink: 0, marginTop: "7px" }} />
                          {l}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Run History ──────────────────────────────────────────────────────────────

function RunHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [runMeta, setRunMeta] = useState<Record<string, RunMeta>>({});
  const [editingNotes, setEditingNotes] = useState<string | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
    setRunMeta(loadRunMeta());
  }, []);

  function handleNotesChange(id: string, notes: string) {
    const next = { ...runMeta, [id]: { ...runMeta[id], notes, resolved: runMeta[id]?.resolved ?? false } };
    setRunMeta(next);
    saveRunMeta(next);
  }

  function handleResolve(id: string) {
    const next = { ...runMeta, [id]: { notes: runMeta[id]?.notes ?? "", resolved: !(runMeta[id]?.resolved) } };
    setRunMeta(next);
    saveRunMeta(next);
  }

  if (history.length === 0) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.875rem" }}>
        <BookOpen size={14} color="#a78bfa" />
        <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>
          Run History
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {history.map((item) => {
          const meta = runMeta[item.id] ?? { notes: "", resolved: false };
          const color = BOTTLENECK_COLORS[item.result?.primaryBottleneck ?? ""] ?? "#a78bfa";
          const isEditing = editingNotes === item.id;

          return (
            <div
              key={item.id}
              className="fade-in-up"
              style={{
                background: meta.resolved ? "rgba(52,211,153,0.04)" : "var(--surface-b)",
                border: `1px solid ${meta.resolved ? "rgba(52,211,153,0.15)" : "var(--border-2)"}`,
                borderRadius: "12px",
                padding: "0.875rem 1rem",
              }}
            >
              {/* Run header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg1)", margin: 0 }}>
                      {item.snapshot.brandName}
                    </p>
                    {meta.resolved && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", padding: "0.1rem 0.4rem", borderRadius: "9999px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.25)", fontSize: "0.6rem", fontWeight: 700, color: "#34d399", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        <CheckCircle2 size={9} /> Resolved
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.6875rem", color: "var(--fg3)", margin: "0.1rem 0 0" }}>
                    {item.snapshot.industry} · {item.snapshot.timeWindow} ·{" "}
                    <span style={{ color, fontWeight: 500 }}>{item.result?.primaryBottleneck}</span>
                    {item.result?.confidence != null && (
                      <span> · {Math.round(item.result.confidence * 100)}% confidence</span>
                    )}
                  </p>
                </div>
                <p style={{ fontSize: "0.6875rem", color: "var(--fg4)", margin: 0, flexShrink: 0 }}>
                  {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>

              {/* Outcome notes */}
              {isEditing ? (
                <div style={{ marginBottom: "0.5rem" }}>
                  <textarea
                    autoFocus
                    className="input-field"
                    style={{ minHeight: "64px", fontSize: "0.8125rem", resize: "vertical" }}
                    placeholder="Post-execution outcome notes…"
                    value={meta.notes}
                    onChange={(e) => handleNotesChange(item.id, e.target.value)}
                    onBlur={() => setEditingNotes(null)}
                  />
                </div>
              ) : meta.notes ? (
                <p
                  onClick={() => setEditingNotes(item.id)}
                  style={{ fontSize: "0.8125rem", color: "var(--fg2)", margin: "0 0 0.5rem", lineHeight: 1.55, cursor: "text", padding: "0.375rem 0" }}
                >
                  {meta.notes}
                </p>
              ) : (
                <button
                  onClick={() => setEditingNotes(item.id)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.6875rem", color: "var(--fg4)", padding: "0.25rem 0", marginBottom: "0.25rem", display: "block" }}
                >
                  + Add outcome notes
                </button>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleResolve(item.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    background: "transparent",
                    border: `1px solid ${meta.resolved ? "rgba(52,211,153,0.25)" : "var(--border-2)"}`,
                    borderRadius: "6px",
                    padding: "0.2rem 0.5rem",
                    cursor: "pointer",
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    color: meta.resolved ? "#34d399" : "var(--fg3)",
                    transition: "all 0.15s",
                  }}
                >
                  <CheckCircle2 size={11} />
                  {meta.resolved ? "Unmark" : "Mark as Resolved"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
