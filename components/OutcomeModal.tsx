"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import type { OutcomeStatus } from "@/lib/schema";

interface OutcomeModalProps {
  experimentId: string;
  experimentName: string;
  onClose: () => void;
  onSaved: (experimentId: string) => void;
}

const OUTCOME_OPTIONS: { value: OutcomeStatus; label: string; color: string; bg: string }[] = [
  { value: "Win", label: "Win", color: "#34d399", bg: "rgba(52,211,153,0.12)" },
  { value: "Loss", label: "Loss", color: "#f87171", bg: "rgba(248,113,113,0.12)" },
  { value: "Neutral", label: "Neutral", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  { value: "Inconclusive", label: "Inconclusive", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
];

export function OutcomeModal({ experimentId, experimentName, onClose, onSaved }: OutcomeModalProps) {
  const [outcomeStatus, setOutcomeStatus] = useState<OutcomeStatus>("Win");
  const [notes, setNotes] = useState("");
  const [metricsDelta, setMetricsDelta] = useState({ roas: "", cac: "", ctr: "", cvr: "" });
  const [learnings, setLearnings] = useState<string[]>([""]);
  const [recommendedNext, setRecommendedNext] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addLine(setter: React.Dispatch<React.SetStateAction<string[]>>) {
    setter((prev) => [...prev, ""]);
  }

  function removeLine(setter: React.Dispatch<React.SetStateAction<string[]>>, i: number) {
    setter((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLine(setter: React.Dispatch<React.SetStateAction<string[]>>, i: number, val: string) {
    setter((prev) => prev.map((v, idx) => (idx === i ? val : v)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/experiments/${experimentId}/outcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcomeStatus,
          notes,
          metricsDelta: {
            roas: metricsDelta.roas !== "" ? parseFloat(metricsDelta.roas) : null,
            cac: metricsDelta.cac !== "" ? parseFloat(metricsDelta.cac) : null,
            ctr: metricsDelta.ctr !== "" ? parseFloat(metricsDelta.ctr) : null,
            cvr: metricsDelta.cvr !== "" ? parseFloat(metricsDelta.cvr) : null,
          },
          learnings: learnings.filter((l) => l.trim()),
          recommendedNext: recommendedNext.filter((r) => r.trim()),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save outcome");
      }
      onSaved(experimentId);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          width: "min(560px, calc(100vw - 2rem))",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "var(--dropdown-bg)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: "18px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          animation: "fadeInUp 0.2s ease-out",
        }}
      >
        {/* Modal header */}
        <div
          style={{
            padding: "1.25rem 1.375rem 1rem",
            borderBottom: "1px solid var(--border-1)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <p style={{ fontSize: "0.6875rem", color: "var(--fg3)", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", margin: "0 0 0.25rem" }}>
              Record Outcome
            </p>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--fg1)", margin: 0, lineHeight: 1.3 }}>
              {experimentName}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg3)", padding: "0.25rem", flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "1.25rem 1.375rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Outcome status */}
          <div>
            <label className="field-label">Outcome</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem" }}>
              {OUTCOME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutcomeStatus(opt.value)}
                  style={{
                    padding: "0.5rem",
                    borderRadius: "8px",
                    border: `1px solid ${outcomeStatus === opt.value ? opt.color + "60" : "var(--border-3)"}`,
                    background: outcomeStatus === opt.value ? opt.bg : "transparent",
                    cursor: "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: outcomeStatus === opt.value ? opt.color : "var(--fg3)",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="field-label" htmlFor="outcome-notes">Notes</label>
            <textarea
              id="outcome-notes"
              className="input-field"
              style={{ minHeight: "72px" }}
              placeholder="What happened? Key observations…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Metric deltas */}
          <div>
            <label className="field-label">Metric Deltas (optional)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem" }}>
              {(["roas", "cac", "ctr", "cvr"] as const).map((key) => (
                <div key={key} style={{ position: "relative" }}>
                  <span style={{ fontSize: "0.6875rem", color: "var(--fg4)", display: "block", marginBottom: "0.2rem", fontWeight: 500 }}>
                    {key.toUpperCase()} Δ
                  </span>
                  <div style={{ position: "relative" }}>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="0.0"
                      step="0.01"
                      value={metricsDelta[key]}
                      onChange={(e) => setMetricsDelta((prev) => ({ ...prev, [key]: e.target.value }))}
                      style={{
                        color: metricsDelta[key] && parseFloat(metricsDelta[key]) > 0
                          ? "#34d399"
                          : metricsDelta[key] && parseFloat(metricsDelta[key]) < 0
                          ? "#f87171"
                          : undefined,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Learnings */}
          <DynamicList
            label="Learnings"
            placeholder="What we learned from this experiment…"
            items={learnings}
            onChange={(i, v) => updateLine(setLearnings, i, v)}
            onAdd={() => addLine(setLearnings)}
            onRemove={(i) => removeLine(setLearnings, i)}
          />

          {/* Recommended next */}
          <DynamicList
            label="Recommended Next Steps"
            placeholder="Follow-on idea or action…"
            items={recommendedNext}
            onChange={(i, v) => updateLine(setRecommendedNext, i, v)}
            onAdd={() => addLine(setRecommendedNext)}
            onRemove={(i) => removeLine(setRecommendedNext, i)}
          />

          {error && (
            <p style={{ fontSize: "0.8125rem", color: "#f87171", margin: 0 }}>{error}</p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.625rem", paddingTop: "0.25rem" }}>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ flex: 1 }}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.375rem" }}
            >
              {saving ? (
                <>
                  <span className="spin" style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", display: "inline-block" }} />
                  Saving…
                </>
              ) : (
                "Save Outcome"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function DynamicList({
  label,
  placeholder,
  items,
  onChange,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <label className="field-label">{label}</label>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "0.375rem", alignItems: "center" }}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--fg3)", flexShrink: 0 }} />
            <input
              type="text"
              className="input-field"
              placeholder={placeholder}
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
            />
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--fg3)", padding: "0.25rem", flexShrink: 0 }}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--fg3)",
            fontSize: "0.75rem",
            padding: "0.25rem 0",
            alignSelf: "flex-start",
          }}
        >
          <Plus size={13} />
          Add line
        </button>
      </div>
    </div>
  );
}
