"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ChevronDown, Zap, RotateCcw, TrendingUp, FlaskConical } from "lucide-react";
import type { CampaignSnapshot, ComputedFields } from "@/lib/schema";
import { computeFields, channelMixWarning, formatMultiplier, formatCurrency } from "@/lib/utils";
import { SCENARIOS } from "@/lib/scenarios";

const DEFAULT_SNAPSHOT: CampaignSnapshot = {
  brandName: "",
  industry: "Beauty",
  timeWindow: "14 days",
  channelMix: { meta: 60, google: 25, tiktok: 15 },
  metrics: {
    spend: 0,
    revenue: 0,
    ctr: 0,
    cpm: 0,
    conversionRate: 0,
    aov: 0,
    ltv: 0,
  },
  trends: {
    roasDelta: null,
    ctrDelta: null,
    cvrDelta: null,
  },
  notes: "",
};

interface CampaignSnapshotFormProps {
  onAnalyze: (snapshot: CampaignSnapshot, computed: ComputedFields) => void;
  isLoading: boolean;
  simulationMode: boolean;
}

export function CampaignSnapshotForm({
  onAnalyze,
  isLoading,
  simulationMode,
}: CampaignSnapshotFormProps) {
  const [snapshot, setSnapshot] = useState<CampaignSnapshot>(DEFAULT_SNAPSHOT);
  const [computed, setComputed] = useState<ComputedFields>({
    roas: 0,
    cpc: 0,
    estimatedCac: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);

  useEffect(() => {
    setComputed(computeFields(snapshot));
  }, [snapshot]);

  const mixWarning = channelMixWarning(snapshot.channelMix);

  function updateMetric(key: keyof typeof snapshot.metrics, value: string) {
    const num = value === "" ? 0 : parseFloat(value);
    setSnapshot((prev) => ({
      ...prev,
      metrics: { ...prev.metrics, [key]: isNaN(num) ? 0 : num },
    }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function updateChannelMix(key: keyof typeof snapshot.channelMix, value: string) {
    const num = value === "" ? 0 : parseFloat(value);
    setSnapshot((prev) => ({
      ...prev,
      channelMix: { ...prev.channelMix, [key]: isNaN(num) ? 0 : num },
    }));
  }

  function updateTrend(key: keyof typeof snapshot.trends, value: string) {
    setSnapshot((prev) => ({
      ...prev,
      trends: {
        ...prev.trends,
        [key]: value === "" ? null : parseFloat(value),
      },
    }));
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!snapshot.brandName.trim()) errs.brandName = "Required";
    if (snapshot.metrics.spend < 0) errs.spend = "Must be ≥ 0";
    if (snapshot.metrics.revenue < 0) errs.revenue = "Must be ≥ 0";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onAnalyze(snapshot, computed);
  }

  function loadScenario(key: string) {
    const scenario = SCENARIOS[key];
    if (scenario) {
      setSnapshot(scenario.snapshot);
      setErrors({});
    }
    setScenarioMenuOpen(false);
  }

  function handleClear() {
    setSnapshot(DEFAULT_SNAPSHOT);
    setErrors({});
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      {/* Sim mode banner */}
      {simulationMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1.375rem",
            background: "rgba(245,158,11,0.07)",
            borderBottom: "1px solid rgba(245,158,11,0.18)",
            animation: "fadeInUp 0.2s ease-out",
          }}
        >
          <FlaskConical size={12} color="#f59e0b" />
          <span style={{ fontSize: "0.6875rem", color: "#f59e0b", fontWeight: 600 }}>
            Simulation Mode – Demo Data
          </span>
          <span style={{ fontSize: "0.6875rem", color: "rgba(245,158,11,0.6)", marginLeft: "0.25rem" }}>
            · Use scenarios for testing and training
          </span>
        </div>
      )}

      {/* Form header */}
      <div
        style={{
          padding: "1.25rem 1.375rem 1rem",
          borderBottom: "1px solid var(--border-1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              background: simulationMode ? "rgba(245,158,11,0.1)" : "rgba(139, 92, 246, 0.12)",
              border: `1px solid ${simulationMode ? "rgba(245,158,11,0.22)" : "rgba(139, 92, 246, 0.2)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
            }}
          >
            <TrendingUp size={13} color={simulationMode ? "#f59e0b" : "#a78bfa"} />
          </div>
          <h2
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--fg1)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Campaign Snapshot
          </h2>
        </div>
        <p style={{ fontSize: "0.75rem", color: "var(--fg4)", margin: "0.375rem 0 0", lineHeight: 1.5 }}>
          {simulationMode
            ? "Load a demo scenario or enter custom values to test the system"
            : "Enter your live campaign metrics for AI-powered diagnosis"}
        </p>
      </div>

      {/* Scrollable form body */}
      <div
        style={{
          padding: "1.25rem 1.375rem",
          overflowY: "auto",
          overflowX: "hidden",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Brand + Industry row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
          <div>
            <label className="field-label" htmlFor="brandName">Brand Name</label>
            <input
              id="brandName"
              type="text"
              className="input-field"
              placeholder="e.g. Lumière Beauty"
              value={snapshot.brandName}
              onChange={(e) => {
                setSnapshot((prev) => ({ ...prev, brandName: e.target.value }));
                if (errors.brandName) setErrors((prev) => ({ ...prev, brandName: "" }));
              }}
            />
            {errors.brandName && (
              <p style={{ fontSize: "0.6875rem", color: "#f87171", marginTop: "0.25rem" }}>
                {errors.brandName}
              </p>
            )}
          </div>
          <div>
            <label className="field-label" htmlFor="industry">Industry</label>
            <select
              id="industry"
              className="input-field"
              value={snapshot.industry}
              onChange={(e) =>
                setSnapshot((prev) => ({
                  ...prev,
                  industry: e.target.value as CampaignSnapshot["industry"],
                }))
              }
            >
              <option>Beauty</option>
              <option>Wellness</option>
              <option>Fashion</option>
            </select>
          </div>
        </div>

        {/* Time Window */}
        <div>
          <label className="field-label" htmlFor="timeWindow">Time Window</label>
          <select
            id="timeWindow"
            className="input-field"
            value={snapshot.timeWindow}
            onChange={(e) =>
              setSnapshot((prev) => ({
                ...prev,
                timeWindow: e.target.value as CampaignSnapshot["timeWindow"],
              }))
            }
          >
            <option>7 days</option>
            <option>14 days</option>
            <option>30 days</option>
          </select>
        </div>

        <hr className="section-divider" />

        {/* Channel Mix */}
        <div>
          <label className="field-label">Channel Mix (%)</label>
          {mixWarning && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.625rem",
                borderRadius: "8px",
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                marginBottom: "0.625rem",
              }}
            >
              <AlertTriangle size={12} color="#f59e0b" />
              <span style={{ fontSize: "0.6875rem", color: "#f59e0b" }}>
                {mixWarning}
              </span>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem" }}>
            {(["meta", "google", "tiktok"] as const).map((ch) => (
              <div key={ch}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.6875rem",
                    color: "var(--fg4)",
                    marginBottom: "0.25rem",
                    textTransform: "capitalize",
                  }}
                >
                  {ch === "tiktok" ? "TikTok" : ch.charAt(0).toUpperCase() + ch.slice(1)}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    className="input-field"
                    style={{ paddingRight: "1.5rem" }}
                    min={0}
                    max={100}
                    step={1}
                    placeholder="0"
                    value={snapshot.channelMix[ch] || ""}
                    onChange={(e) => updateChannelMix(ch, e.target.value)}
                  />
                  <span
                    style={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "0.6875rem",
                      color: "var(--fg4)",
                    }}
                  >
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="section-divider" />

        {/* Metrics */}
        <div>
          <label className="field-label">Performance Metrics</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <MetricInput
              label="Spend"
              prefix="$"
              id="spend"
              value={snapshot.metrics.spend}
              onChange={(v) => updateMetric("spend", v)}
              error={errors.spend}
              placeholder="0"
            />
            <MetricInput
              label="Revenue"
              prefix="$"
              id="revenue"
              value={snapshot.metrics.revenue}
              onChange={(v) => updateMetric("revenue", v)}
              error={errors.revenue}
              placeholder="0"
            />
            <MetricInput
              label="CTR"
              suffix="%"
              id="ctr"
              value={snapshot.metrics.ctr}
              onChange={(v) => updateMetric("ctr", v)}
              placeholder="0.0"
              step="0.1"
            />
            <MetricInput
              label="CPM"
              prefix="$"
              id="cpm"
              value={snapshot.metrics.cpm}
              onChange={(v) => updateMetric("cpm", v)}
              placeholder="0.00"
              step="0.01"
            />
            <MetricInput
              label="Conv. Rate"
              suffix="%"
              id="conversionRate"
              value={snapshot.metrics.conversionRate}
              onChange={(v) => updateMetric("conversionRate", v)}
              placeholder="0.0"
              step="0.1"
            />
            <MetricInput
              label="AOV"
              prefix="$"
              id="aov"
              value={snapshot.metrics.aov}
              onChange={(v) => updateMetric("aov", v)}
              placeholder="0.00"
              step="0.01"
            />
            <MetricInput
              label="LTV"
              prefix="$"
              id="ltv"
              value={snapshot.metrics.ltv}
              onChange={(v) => updateMetric("ltv", v)}
              placeholder="0.00"
              step="0.01"
              colSpan={2}
            />
          </div>
        </div>

        {/* Computed fields */}
        <div
          style={{
            background: "rgba(139, 92, 246, 0.04)",
            border: "1px solid rgba(139, 92, 246, 0.1)",
            borderRadius: "10px",
            padding: "0.875rem",
          }}
        >
          <p style={{ fontSize: "0.6875rem", color: "var(--fg3)", fontWeight: 600, margin: "0 0 0.625rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Computed
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.625rem" }}>
            <ComputedDisplay label="ROAS" value={formatMultiplier(computed.roas)} />
            <ComputedDisplay label="CPC" value={formatCurrency(computed.cpc)} />
            <ComputedDisplay
              label="Est. CAC ⓘ"
              value={formatCurrency(computed.estimatedCac)}
              tooltip="Estimated: AOV ÷ ROAS"
            />
          </div>
        </div>

        <hr className="section-divider" />

        {/* Trends */}
        <div>
          <label className="field-label">Trend Deltas (% vs prior period — optional)</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
            <TrendInput
              label="ROAS Δ"
              value={snapshot.trends.roasDelta}
              onChange={(v) => updateTrend("roasDelta", v)}
            />
            <TrendInput
              label="CTR Δ"
              value={snapshot.trends.ctrDelta}
              onChange={(v) => updateTrend("ctrDelta", v)}
            />
            <TrendInput
              label="CVR Δ"
              value={snapshot.trends.cvrDelta}
              onChange={(v) => updateTrend("cvrDelta", v)}
            />
          </div>
        </div>

        <hr className="section-divider" />

        {/* Notes */}
        <div>
          <label className="field-label" htmlFor="notes">Context Notes</label>
          <textarea
            id="notes"
            className="input-field"
            style={{ minHeight: "80px", resize: "vertical", lineHeight: 1.6 }}
            placeholder="Promo events, stockouts, creative refresh, tracking changes, competitor activity…"
            value={snapshot.notes}
            onChange={(e) =>
              setSnapshot((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Actions */}
      <div
        style={{
          padding: "1rem 1.375rem",
          borderTop: "1px solid var(--border-1)",
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
        }}
      >
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem",
            fontSize: "0.9375rem",
          }}
        >
          {isLoading ? (
            <>
              <span
                className="spin"
                style={{
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  display: "inline-block",
                }}
              />
              Analyzing…
            </>
          ) : (
            <>
              <Zap size={16} />
              {simulationMode ? "Run Simulation" : "Analyze Performance"}
            </>
          )}
        </button>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: simulationMode ? "1fr auto" : "1fr",
            gap: "0.5rem",
            transition: "grid-template-columns 0.2s",
          }}
        >
          {/* Scenario loader — only visible in Simulation Mode */}
          {simulationMode && (
            <div style={{ position: "relative", animation: "fadeInUp 0.2s ease-out" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.375rem",
                  borderColor: "rgba(245,158,11,0.3)",
                  color: "#f59e0b",
                }}
                onClick={() => setScenarioMenuOpen((v) => !v)}
              >
                <FlaskConical size={12} />
                Load Scenario
                <ChevronDown
                  size={13}
                  style={{
                    transform: scenarioMenuOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.2s",
                  }}
                />
              </button>
              {scenarioMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: "var(--dropdown-bg)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: "10px",
                    overflow: "hidden",
                    zIndex: 30,
                    boxShadow: "0 -8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {Object.entries(SCENARIOS).map(([key, scenario]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => loadScenario(key)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "2px",
                        width: "100%",
                        padding: "0.625rem 0.875rem",
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        borderBottom: "1px solid var(--border-1)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLElement).style.background =
                          "rgba(245, 158, 11, 0.07)")
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLElement).style.background = "transparent")
                      }
                    >
                      <span style={{ fontSize: "0.8125rem", color: "var(--fg1)", fontWeight: 500 }}>
                        {scenario.label}
                      </span>
                      <span style={{ fontSize: "0.6875rem", color: "var(--fg3)", lineHeight: 1.4 }}>
                        {scenario.description}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Clear */}
          <button
            type="button"
            className="btn-ghost"
            onClick={handleClear}
            title="Clear form"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem" }}
          >
            <RotateCcw size={13} />
            Clear
          </button>
        </div>
      </div>
    </form>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetricInput({
  label,
  id,
  value,
  onChange,
  prefix,
  suffix,
  error,
  placeholder,
  step = "1",
  colSpan,
}: {
  label: string;
  id: string;
  value: number;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  error?: string;
  placeholder?: string;
  step?: string;
  colSpan?: number;
}) {
  return (
    <div style={colSpan ? { gridColumn: `span ${colSpan}` } : {}}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "0.6875rem",
          color: "var(--fg4)",
          marginBottom: "0.25rem",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {prefix && (
          <span
            style={{
              position: "absolute",
              left: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.8125rem",
              color: "var(--fg4)",
              pointerEvents: "none",
            }}
          >
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          className="input-field"
          style={{
            paddingLeft: prefix ? "1.5rem" : undefined,
            paddingRight: suffix ? "1.75rem" : undefined,
          }}
          min={0}
          step={step}
          placeholder={placeholder || "0"}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span
            style={{
              position: "absolute",
              right: "9px",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "0.8125rem",
              color: "var(--fg4)",
              pointerEvents: "none",
            }}
          >
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p style={{ fontSize: "0.6875rem", color: "#f87171", marginTop: "0.25rem" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ComputedDisplay({
  label,
  value,
  tooltip,
}: {
  label: string;
  value: string;
  tooltip?: string;
}) {
  return (
    <div>
      <p
        style={{
          fontSize: "0.6875rem",
          color: "var(--fg4)",
          marginBottom: "0.25rem",
          fontWeight: 500,
        }}
        title={tooltip}
      >
        {label}
      </p>
      <div className="computed-field">{value}</div>
    </div>
  );
}

function TrendInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: string) => void;
}) {
  const isPositive = value !== null && value > 0;
  const isNegative = value !== null && value < 0;

  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: "0.6875rem",
          color: "var(--fg4)",
          marginBottom: "0.25rem",
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          type="number"
          className="input-field"
          style={{
            paddingRight: "1.75rem",
            color: isPositive ? "#34d399" : isNegative ? "#f87171" : undefined,
          }}
          placeholder="—"
          step="0.1"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
        <span
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "0.75rem",
            color: "var(--fg4)",
            pointerEvents: "none",
          }}
        >
          %
        </span>
      </div>
    </div>
  );
}
