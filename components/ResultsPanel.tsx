"use client";

import { useState } from "react";
import {
  Copy, Check, BarChart2, ListChecks, FlaskConical,
  Palette, Brain, ChevronRight, AlertCircle, RefreshCw,
  Sparkles, FileText, Play, CheckCircle, Archive, Save,
} from "lucide-react";
import type { AnalysisResult, CampaignSnapshot, ComputedFields, ExperimentStatus } from "@/lib/schema";
import { InsightTimeline } from "./InsightTimeline";
import { RiskRadar } from "./RiskRadar";
import { MemoryTab } from "./MemoryTab";
import { OutcomeModal } from "./OutcomeModal";
import { WeeklyMemo } from "./WeeklyMemo";
import { LoadingSkeleton, ActionPlanSkeleton, ExperimentsSkeleton, CreativeSkeleton } from "./LoadingSkeleton";
import { copyToClipboard, formatResultAsText } from "@/lib/utils";

type Tab = "diagnosis" | "actionPlan" | "experiments" | "creativeDirections" | "memory";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "diagnosis", label: "Diagnosis", icon: <BarChart2 size={13} /> },
  { id: "actionPlan", label: "Action Plan", icon: <ListChecks size={13} /> },
  { id: "experiments", label: "Experiments", icon: <FlaskConical size={13} /> },
  { id: "creativeDirections", label: "Creative", icon: <Palette size={13} /> },
  { id: "memory", label: "Memory", icon: <Brain size={13} /> },
];

const BOTTLENECK_COLORS: Record<string, string> = {
  Creative: "#a855f7",
  Conversion: "#3b82f6",
  Scaling: "#10b981",
  Efficiency: "#f59e0b",
};

interface ResultsPanelProps {
  result: AnalysisResult | null;
  snapshot: CampaignSnapshot | null;
  computed: ComputedFields | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  runId: string | null;
  experimentIds: Array<{ name: string; id: string }>;
}

export function ResultsPanel({
  result, snapshot, computed, isLoading, error, onRetry,
  runId, experimentIds,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("diagnosis");
  const [copiedTab, setCopiedTab] = useState<Tab | "all" | null>(null);
  const [showMemo, setShowMemo] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState<{ id: string; name: string } | null>(null);
  const [expStatuses, setExpStatuses] = useState<Record<string, ExperimentStatus>>({});

  function getExpId(name: string): string | null {
    return experimentIds.find((e) => e.name === name)?.id ?? null;
  }

  function getExpStatus(name: string): ExperimentStatus {
    const id = getExpId(name);
    if (!id) return "Proposed";
    return expStatuses[id] ?? "Proposed";
  }

  async function updateStatus(name: string, status: ExperimentStatus) {
    const id = getExpId(name);
    if (!id) return;
    try {
      await fetch(`/api/experiments/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setExpStatuses((prev) => ({ ...prev, [id]: status }));
    } catch {
      // silent
    }
  }

  function handleOutcomeSaved(expId: string) {
    setExpStatuses((prev) => ({ ...prev, [expId]: "Completed" }));
  }

  async function handleCopyTab() {
    if (!result) return;
    const text =
      activeTab === "diagnosis" ? formatDiagnosisText(result)
      : activeTab === "actionPlan" ? formatActionPlanText(result)
      : activeTab === "experiments" ? formatExperimentsText(result)
      : activeTab === "creativeDirections" ? formatCreativeText(result)
      : "";
    if (!text) return;
    await copyToClipboard(text);
    setCopiedTab(activeTab);
    setTimeout(() => setCopiedTab(null), 1800);
  }

  async function handleCopyAll() {
    if (!result || !snapshot || !computed) return;
    const text = formatResultAsText(snapshot, computed, result);
    await copyToClipboard(text);
    setCopiedTab("all");
    setTimeout(() => setCopiedTab(null), 1800);
  }

  const canCopy = result && activeTab !== "memory";

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* Panel header */}
      <div style={{ padding: "1.25rem 1.375rem 0", borderBottom: "1px solid var(--border-1)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={13} color="#a78bfa" />
            </div>
            <h2 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg1)", margin: 0, letterSpacing: "-0.01em" }}>
              Analysis Results
            </h2>
            {result && (
              <span style={{ padding: "0.125rem 0.5rem", borderRadius: "9999px", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", fontSize: "0.625rem", fontWeight: 700, color: "#34d399", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Ready
              </span>
            )}
          </div>

          {result && (
            <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
              {canCopy && (
                <button className="btn-ghost" onClick={handleCopyTab}>
                  {copiedTab === activeTab
                    ? <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#34d399" }}><Check size={12} /> Copied</span>
                    : <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Copy size={12} /> Copy</span>}
                </button>
              )}
              <button className="btn-ghost" onClick={handleCopyAll} disabled={activeTab === "memory"}>
                {copiedTab === "all"
                  ? <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#34d399" }}><Check size={12} /> Copied</span>
                  : <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Copy size={12} /> All</span>}
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowMemo(true)}
                style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#a78bfa", borderColor: "rgba(139,92,246,0.25)" }}
              >
                <FileText size={12} />
                Client Memo
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "0.25rem", padding: "0.25rem", background: "var(--surface-b)", borderRadius: "12px", border: "1px solid var(--border-1)" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`pill-tab ${activeTab === tab.id ? "active" : ""}`}
              style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1.375rem", minHeight: 0 }}>
        {!result && !isLoading && !error && <EmptyState />}
        {error && !isLoading && <ErrorState error={error} onRetry={onRetry} />}

        {isLoading && (
          <>
            {activeTab === "diagnosis" && <LoadingSkeleton />}
            {activeTab === "actionPlan" && <ActionPlanSkeleton />}
            {activeTab === "experiments" && <ExperimentsSkeleton />}
            {activeTab === "creativeDirections" && <CreativeSkeleton />}
            {activeTab === "memory" && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--fg3)", fontSize: "0.8125rem" }}>
                <span className="spin" style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--surface-e)", borderTopColor: "#a78bfa", display: "inline-block" }} />
                Loading memory…
              </div>
            )}
          </>
        )}

        {result && !isLoading && (
          <div className="fade-in-up" key={activeTab}>
            {activeTab === "diagnosis" && <DiagnosisTab result={result} />}
            {activeTab === "actionPlan" && <ActionPlanTab result={result} />}
            {activeTab === "experiments" && (
              <ExperimentsTab
                result={result}
                getExpId={getExpId}
                getExpStatus={getExpStatus}
                onStatusChange={updateStatus}
                onOpenOutcome={(id, name) => setOutcomeModal({ id, name })}
              />
            )}
            {activeTab === "creativeDirections" && <CreativeDirectionsTab result={result} />}
            {activeTab === "memory" && (
              <MemoryTab runId={runId} currentResult={result} />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showMemo && result && snapshot && computed && (
        <WeeklyMemo result={result} snapshot={snapshot} computed={computed} onClose={() => setShowMemo(false)} />
      )}
      {outcomeModal && (
        <OutcomeModal
          experimentId={outcomeModal.id}
          experimentName={outcomeModal.name}
          onClose={() => setOutcomeModal(null)}
          onSaved={handleOutcomeSaved}
        />
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "320px", gap: "1rem", textAlign: "center" }}>
      <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Sparkles size={24} color="#a78bfa" strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg2)", margin: "0 0 0.375rem" }}>
          Enter a snapshot and click Analyze
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--fg3)", margin: 0 }}>
          Fill in your campaign metrics to get a full AI-powered diagnosis, action plan, experiments, and creative directions.
        </p>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", padding: "0.5rem 0.875rem", background: "rgba(139,92,246,0.06)", borderRadius: "8px", border: "1px solid rgba(139,92,246,0.12)" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--fg3)" }}>
          Tip: Try a preset scenario using <strong style={{ color: "var(--fg2)" }}>Load Scenario</strong>
        </span>
      </div>
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ padding: "1.25rem", borderRadius: "12px", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0, marginTop: "1px" }} />
        <div>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#f87171", margin: "0 0 0.25rem" }}>Analysis Failed</p>
          <p style={{ fontSize: "0.8125rem", color: "#fca5a5", margin: 0, lineHeight: 1.6 }}>{error}</p>
        </div>
      </div>
      <button className="btn-ghost" onClick={onRetry} style={{ display: "flex", alignItems: "center", gap: "0.375rem", alignSelf: "flex-start", color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}>
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );
}

// ─── Diagnosis tab ────────────────────────────────────────────────────────────

function DiagnosisTab({ result }: { result: AnalysisResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary */}
      <div style={{ padding: "1rem 1.125rem", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "12px" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#8b5cf6", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>Summary</p>
        <p style={{ fontSize: "0.9375rem", color: "var(--fg1)", margin: 0, lineHeight: 1.65, fontWeight: 500 }}>{result.summary.oneLiner}</p>
      </div>

      {/* Bottlenecks */}
      <div>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>
          Bottleneck Analysis
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {result.bottlenecks.map((b, i) => {
            const color = BOTTLENECK_COLORS[b.type] || "#8b5cf6";
            const isPrimary = b.type === result.primaryBottleneck;
            return (
              <div key={b.type} className="fade-in-up" style={{ background: isPrimary ? `${hexToRgb(color, 0.07)}` : "var(--surface-b)", border: `1px solid ${isPrimary ? color + "30" : "var(--border-2)"}`, borderRadius: "12px", padding: "0.875rem 1rem", animationDelay: `${i * 80}ms` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.2rem 0.625rem", borderRadius: "9999px", background: `${color}18`, border: `1px solid ${color}35`, fontSize: "0.75rem", fontWeight: 600, color }}>
                      {isPrimary && <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />}
                      {b.type}
                    </span>
                    {isPrimary && <span style={{ fontSize: "0.625rem", color: "var(--fg3)", fontWeight: 500 }}>Primary</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: "64px", height: "4px", background: "var(--surface-d)", borderRadius: "9999px", overflow: "hidden" }}>
                      <div style={{ width: `${b.signalStrength * 100}%`, height: "100%", background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: "9999px", transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
                    </div>
                    <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg2)", minWidth: "28px", textAlign: "right" }}>
                      {Math.round(b.signalStrength * 100)}%
                    </span>
                  </div>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                  {b.reasoning.map((r, j) => (
                    <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                      <ChevronRight size={12} color={color} style={{ flexShrink: 0, marginTop: "3px" }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--fg2)", lineHeight: 1.6 }}>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Risk Radar */}
      {result.risk && <RiskRadar risk={result.risk} />}

      {/* Checks to confirm */}
      {result.checksToConfirm.length > 0 && (
        <div>
          <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg3)", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>
            Checks to Confirm
          </p>
          <div style={{ background: "var(--surface-b)", border: "1px solid var(--border-2)", borderRadius: "10px", padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {result.checksToConfirm.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.6rem", color: "#8b5cf6", fontWeight: 700, marginTop: "2px" }}>{i + 1}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--fg2)", lineHeight: 1.6 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insight Timeline */}
      <div style={{ background: "var(--surface-b)", border: "1px solid var(--border-2)", borderRadius: "12px", padding: "1.125rem" }}>
        <InsightTimeline result={result} />
      </div>
    </div>
  );
}

// ─── Action Plan tab ──────────────────────────────────────────────────────────

function ActionPlanTab({ result }: { result: AnalysisResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
      {result.actionPlan.map((item, i) => (
        <div key={i} className="fade-in-up" style={{ background: "var(--surface-b)", border: "1px solid var(--border-2)", borderRadius: "12px", padding: "1rem 1.125rem", display: "flex", gap: "0.875rem", animationDelay: `${i * 80}ms` }}>
          <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: item.priority === 1 ? "linear-gradient(135deg, #7c3aed, #a855f7)" : item.priority === 2 ? "rgba(139,92,246,0.15)" : "var(--surface-d)", border: item.priority === 1 ? "none" : "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: item.priority === 1 ? "0 0 12px rgba(139,92,246,0.35)" : "none" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: item.priority === 1 ? "white" : "#a78bfa" }}>{item.priority}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--fg1)", margin: "0 0 0.5rem", lineHeight: 1.4 }}>{item.title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#34d399", flexShrink: 0 }}>Impact:</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--fg2)", lineHeight: 1.5 }}>{item.expectedImpact}</span>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "#f59e0b", flexShrink: 0 }}>Risk:</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--fg2)", lineHeight: 1.5 }}>{item.risk}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Experiments tab ──────────────────────────────────────────────────────────

function ExperimentsTab({
  result,
  getExpId,
  getExpStatus,
  onStatusChange,
  onOpenOutcome,
}: {
  result: AnalysisResult;
  getExpId: (name: string) => string | null;
  getExpStatus: (name: string) => ExperimentStatus;
  onStatusChange: (name: string, status: ExperimentStatus) => void;
  onOpenOutcome: (id: string, name: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {result.experiments.map((exp, i) => {
        const color = BOTTLENECK_COLORS[exp.category] ?? "#a78bfa";
        const status = getExpStatus(exp.name);
        const expId = getExpId(exp.name);

        return (
          <div key={i} className="fade-in-up" style={{ background: "var(--surface-b)", border: "1px solid var(--border-2)", borderRadius: "14px", overflow: "hidden", animationDelay: `${i * 100}ms` }}>
            {/* Experiment header */}
            <div style={{ padding: "0.875rem 1.125rem", borderBottom: "1px solid var(--border-1)", background: "var(--surface-a)", display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", padding: "0.15rem 0.5rem", borderRadius: "9999px", background: `${color}15`, border: `1px solid ${color}30`, fontSize: "0.6875rem", fontWeight: 600, color, flexShrink: 0, marginTop: "2px" }}>
                {exp.category}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--fg1)", margin: 0, lineHeight: 1.4 }}>{exp.name}</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--fg3)", margin: "0.25rem 0 0", lineHeight: 1.5, fontStyle: "italic" }}>{exp.hypothesis}</p>
              </div>
              {/* Status badge */}
              <StatusBadge status={status} />
            </div>

            <div style={{ padding: "0.875rem 1.125rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg3)", letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.375rem" }}>Setup</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--fg2)", margin: 0, lineHeight: 1.6 }}>{exp.setup}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
                <MetricsList label="Success Metrics" items={exp.successMetrics} color="#34d399" />
                <MetricsList label="Guardrails" items={exp.guardrails} color="#f59e0b" />
              </div>

              {/* Experiment actions */}
              {expId && status !== "Completed" && (
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", paddingTop: "0.25rem", borderTop: "1px solid var(--border-1)" }}>
                  {status === "Proposed" && (
                    <button
                      onClick={() => onStatusChange(exp.name, "Running")}
                      className="btn-ghost"
                      style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#34d399", borderColor: "rgba(52,211,153,0.25)" }}
                    >
                      <Play size={11} /> Mark Running
                    </button>
                  )}
                  {(status === "Running" || status === "Proposed") && (
                    <button
                      onClick={() => onOpenOutcome(expId, exp.name)}
                      className="btn-ghost"
                      style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#a78bfa", borderColor: "rgba(139,92,246,0.25)" }}
                    >
                      <CheckCircle size={11} /> Record Outcome
                    </button>
                  )}
                  <button
                    onClick={() => onStatusChange(exp.name, "Archived")}
                    className="btn-ghost"
                    style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem" }}
                  >
                    <Archive size={11} /> Archive
                  </button>
                </div>
              )}

              {status === "Completed" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.625rem", background: "rgba(52,211,153,0.06)", borderRadius: "6px", border: "1px solid rgba(52,211,153,0.15)", marginTop: "0.25rem" }}>
                  <CheckCircle size={12} color="#34d399" />
                  <span style={{ fontSize: "0.75rem", color: "#34d399", fontWeight: 500 }}>Outcome recorded</span>
                </div>
              )}

              {!expId && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <Save size={11} color="var(--fg3)" />
                  <span style={{ fontSize: "0.6875rem", color: "var(--fg3)" }}>Auto-saved to library</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: ExperimentStatus }) {
  const config: Record<ExperimentStatus, { color: string; bg: string; border: string }> = {
    Proposed:    { color: "#94a3b8", bg: "rgba(148,163,184,0.1)", border: "rgba(148,163,184,0.2)" },
    Running:     { color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.25)" },
    Completed:   { color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.25)" },
    Archived:    { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.2)" },
  };
  const c = config[status];
  return (
    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "9999px", background: c.bg, border: `1px solid ${c.border}`, fontSize: "0.625rem", fontWeight: 700, color: c.color, letterSpacing: "0.06em", textTransform: "uppercase", flexShrink: 0 }}>
      {status}
    </span>
  );
}

function MetricsList({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div>
      <p style={{ fontSize: "0.6875rem", fontWeight: 600, color, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 0.375rem" }}>{label}</p>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {items.map((m, j) => (
          <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", fontSize: "0.75rem", color: "var(--fg2)", lineHeight: 1.5 }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: color, flexShrink: 0, marginTop: "5px" }} />
            {m}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Creative Directions tab ──────────────────────────────────────────────────

function CreativeDirectionsTab({ result }: { result: AnalysisResult }) {
  const sections = [
    { label: "Creative Angles", items: result.creativeDirections.angles, color: "#a855f7", bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.15)" },
    { label: "Hook Formulas",   items: result.creativeDirections.hooks,  color: "#3b82f6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.15)" },
    { label: "CTA Variants",    items: result.creativeDirections.ctas,   color: "#f97316", bg: "rgba(249,115,22,0.06)", border: "rgba(249,115,22,0.15)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
      {sections.map((section, i) => (
        <div key={section.label} className="fade-in-up" style={{ background: section.bg, border: `1px solid ${section.border}`, borderRadius: "12px", padding: "1rem 1.125rem", animationDelay: `${i * 100}ms` }}>
          <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: section.color, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 0.75rem" }}>{section.label}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {section.items.map((item, j) => (
              <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", padding: "0.5rem 0.625rem", background: "var(--surface-b)", borderRadius: "8px", border: "1px solid var(--border-1)" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "5px", background: `${section.color}20`, border: `1px solid ${section.color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.625rem", color: section.color, fontWeight: 700, marginTop: "1px" }}>{j + 1}</span>
                <span style={{ fontSize: "0.8125rem", color: "var(--fg1)", lineHeight: 1.6 }}>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ─── Text formatters ──────────────────────────────────────────────────────────

function formatDiagnosisText(result: AnalysisResult): string {
  const lines = [`DIAGNOSIS\nSummary: ${result.summary.oneLiner}\nPrimary: ${result.primaryBottleneck} | Confidence: ${Math.round(result.confidence * 100)}% | Risk: ${result.risk?.riskScore ?? "N/A"}/100\n`];
  for (const b of result.bottlenecks) {
    lines.push(`${b.type} (${Math.round(b.signalStrength * 100)}% signal)`);
    for (const r of b.reasoning) lines.push(`  • ${r}`);
  }
  lines.push("\nChecks to Confirm:");
  for (const c of result.checksToConfirm) lines.push(`  • ${c}`);
  if (result.risk?.riskDrivers?.length) {
    lines.push("\nRisk Drivers:");
    for (const d of result.risk.riskDrivers) lines.push(`  • ${d}`);
  }
  return lines.join("\n");
}

function formatActionPlanText(result: AnalysisResult): string {
  const lines = ["ACTION PLAN\n"];
  for (const a of result.actionPlan) {
    lines.push(`${a.priority}. ${a.title}\n   Impact: ${a.expectedImpact}\n   Risk: ${a.risk}\n`);
  }
  return lines.join("\n");
}

function formatExperimentsText(result: AnalysisResult): string {
  const lines = ["EXPERIMENTS\n"];
  for (const e of result.experiments) {
    lines.push(`[${e.category}] ${e.name}\nHypothesis: ${e.hypothesis}\nSetup: ${e.setup}\nSuccess: ${e.successMetrics.join(", ")}\nGuardrails: ${e.guardrails.join(", ")}\n`);
  }
  return lines.join("\n");
}

function formatCreativeText(result: AnalysisResult): string {
  const { angles, hooks, ctas } = result.creativeDirections;
  return ["CREATIVE DIRECTIONS\n", "Angles:", ...angles.map((a) => `  • ${a}`), "\nHooks:", ...hooks.map((h) => `  • ${h}`), "\nCTAs:", ...ctas.map((c) => `  • ${c}`)].join("\n");
}

function hexToRgb(hex: string, alpha: number): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return `rgba(139,92,246,${alpha})`;
  return `rgba(${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)},${alpha})`;
}
