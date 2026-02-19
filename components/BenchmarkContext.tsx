"use client";

import type { CampaignSnapshot, ComputedFields } from "@/lib/schema";

interface BenchmarkContextProps {
  snapshot: CampaignSnapshot;
  computed: ComputedFields;
}

type BenchmarkStatus = "green" | "amber" | "red";

const BENCHMARKS: Record<
  string,
  { ctr: [number, number]; cvr: [number, number]; roas: [number, number]; cpm: [number, number] }
> = {
  Beauty:   { ctr: [1.2, 2.5], cvr: [2.0, 4.0], roas: [2.5, 4.0], cpm: [12, 30] },
  Wellness: { ctr: [1.0, 2.2], cvr: [1.5, 3.5], roas: [2.0, 3.5], cpm: [10, 28] },
  Fashion:  { ctr: [0.8, 2.0], cvr: [1.0, 3.0], roas: [2.0, 4.5], cpm: [10, 35] },
};

function getStatus(value: number, [low, high]: [number, number]): BenchmarkStatus {
  if (value === 0) return "red";
  if (value >= low && value <= high) return "green";
  if (value > high) return "green"; // above range is good for ROAS/CTR/CVR, borderline for CPM
  const gap = (low - value) / low;
  if (gap <= 0.2) return "amber";
  return "red";
}

function getCpmStatus(value: number, [low, high]: [number, number]): BenchmarkStatus {
  if (value === 0) return "red";
  if (value >= low && value <= high) return "green";
  if (value > high) {
    const over = (value - high) / high;
    return over <= 0.25 ? "amber" : "red";
  }
  return "green"; // below range = efficient CPM
}

const STATUS_CONFIG = {
  green: { color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)", label: "Within Range" },
  amber: { color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Borderline"   },
  red:   { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)", label: "Below Target" },
} as const;

function BenchmarkRow({
  label,
  value,
  range,
  unit,
  status,
}: {
  label: string;
  value: string;
  range: string;
  unit?: string;
  status: BenchmarkStatus;
}) {
  const s = STATUS_CONFIG[status];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.5rem 0",
        borderBottom: "1px solid var(--border-1)",
      }}
    >
      <div>
        <p style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg1)", margin: 0 }}>
          {label}
        </p>
        <p style={{ fontSize: "0.6875rem", color: "var(--fg3)", margin: "0.1rem 0 0" }}>
          Healthy: {range}
        </p>
      </div>
      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--fg1)", whiteSpace: "nowrap" }}>
        {value}{unit}
      </span>
      <span
        style={{
          padding: "0.15rem 0.5rem",
          borderRadius: "9999px",
          background: s.bg,
          border: `1px solid ${s.border}`,
          fontSize: "0.625rem",
          fontWeight: 700,
          color: s.color,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {s.label}
      </span>
    </div>
  );
}

export function BenchmarkContext({ snapshot, computed }: BenchmarkContextProps) {
  const industry = snapshot.industry as keyof typeof BENCHMARKS;
  const bench = BENCHMARKS[industry] ?? BENCHMARKS.Beauty;
  const { metrics } = snapshot;

  // Skip rendering if no meaningful data entered yet
  if (metrics.spend === 0 && metrics.ctr === 0 && metrics.conversionRate === 0) return null;

  const rows = [
    {
      label: "CTR",
      value: metrics.ctr.toFixed(2),
      unit: "%",
      range: `${bench.ctr[0]}% – ${bench.ctr[1]}%`,
      status: getStatus(metrics.ctr, bench.ctr),
    },
    {
      label: "Conversion Rate",
      value: metrics.conversionRate.toFixed(2),
      unit: "%",
      range: `${bench.cvr[0]}% – ${bench.cvr[1]}%`,
      status: getStatus(metrics.conversionRate, bench.cvr),
    },
    {
      label: "ROAS",
      value: computed.roas.toFixed(2),
      unit: "x",
      range: `${bench.roas[0]}x – ${bench.roas[1]}x`,
      status: getStatus(computed.roas, bench.roas),
    },
    {
      label: "CPM",
      value: `$${metrics.cpm.toFixed(2)}`,
      unit: "",
      range: `$${bench.cpm[0]} – $${bench.cpm[1]}`,
      status: getCpmStatus(metrics.cpm, bench.cpm),
    },
  ].filter((r) => (r.label === "ROAS" ? computed.roas > 0 : true));

  return (
    <div
      style={{
        background: "var(--surface-b)",
        border: "1px solid var(--border-2)",
        borderRadius: "10px",
        padding: "0.875rem 1rem",
      }}
    >
      <p
        style={{
          fontSize: "0.6875rem",
          fontWeight: 700,
          color: "var(--fg3)",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          margin: "0 0 0.125rem",
        }}
      >
        Benchmark Context
      </p>
      <p style={{ fontSize: "0.6875rem", color: "var(--fg4)", margin: "0 0 0.625rem" }}>
        {industry} industry · paid social
      </p>
      <div>
        {rows.map((row, i) => (
          <div key={row.label} style={i === rows.length - 1 ? { borderBottom: "none" } : {}}>
            <BenchmarkRow {...row} />
          </div>
        ))}
      </div>
    </div>
  );
}
