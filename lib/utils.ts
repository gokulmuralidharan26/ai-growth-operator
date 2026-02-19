import type { CampaignSnapshot, ComputedFields, HistoryItem } from "./schema";

// ─── Computed metrics ─────────────────────────────────────────────────────────

export function computeFields(snapshot: CampaignSnapshot): ComputedFields {
  const { spend, revenue, ctr, cpm, aov } = snapshot.metrics;

  const roas = spend > 0 ? revenue / spend : 0;

  // CPC = CPM / (CTR * 10) — CTR is %, CPM is per 1000 impressions
  const cpc = ctr > 0 ? cpm / (ctr * 10) : 0;

  // Estimated CAC = AOV / ROAS (proxy when orders unavailable)
  const estimatedCac = roas > 0 ? aov / roas : 0;

  return {
    roas: round(roas, 2),
    cpc: round(cpc, 2),
    estimatedCac: round(estimatedCac, 2),
  };
}

function round(n: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}x`;
}

export function formatDelta(value: number | null): string {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return ts;
  }
}

// ─── localStorage history ─────────────────────────────────────────────────────

const HISTORY_KEY = "ago_history";
const MAX_HISTORY = 5;

export function loadHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveToHistory(item: HistoryItem): void {
  if (typeof window === "undefined") return;
  try {
    const history = loadHistory();
    const updated = [item, ...history].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // silently ignore storage errors
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
}

// ─── Export helpers ───────────────────────────────────────────────────────────

export function buildExportPayload(
  snapshot: CampaignSnapshot,
  computed: ComputedFields,
  result: object
) {
  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    snapshot,
    computed,
    analysis: result,
  };
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Copy helpers ─────────────────────────────────────────────────────────────

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// ─── Channel mix validation ───────────────────────────────────────────────────

export function channelMixWarning(mix: {
  meta: number;
  google: number;
  tiktok: number;
}): string | null {
  const total = mix.meta + mix.google + mix.tiktok;
  if (total === 0) return null;
  if (Math.abs(total - 100) > 1) {
    return `Channel mix sums to ${total}% (should be 100%)`;
  }
  return null;
}

// ─── ID generator ─────────────────────────────────────────────────────────────

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Text formatting for copy-all ────────────────────────────────────────────

export function formatResultAsText(
  snapshot: CampaignSnapshot,
  computed: ComputedFields,
  result: {
    summary: { oneLiner: string };
    primaryBottleneck: string;
    confidence: number;
    bottlenecks: Array<{
      type: string;
      signalStrength: number;
      reasoning: string[];
    }>;
    checksToConfirm: string[];
    actionPlan: Array<{
      priority: number;
      title: string;
      expectedImpact: string;
      risk: string;
    }>;
    experiments: Array<{
      name: string;
      hypothesis: string;
      setup: string;
      successMetrics: string[];
      guardrails: string[];
    }>;
    creativeDirections: {
      angles: string[];
      hooks: string[];
      ctas: string[];
    };
  }
): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════");
  lines.push("AI GROWTH OPERATOR — ANALYSIS REPORT");
  lines.push(`${snapshot.brandName} | ${snapshot.industry} | ${snapshot.timeWindow}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("═══════════════════════════════════════");
  lines.push("");

  lines.push("SUMMARY");
  lines.push("───────");
  lines.push(result.summary.oneLiner);
  lines.push(`Primary Bottleneck: ${result.primaryBottleneck}`);
  lines.push(`Confidence: ${Math.round(result.confidence * 100)}%`);
  lines.push("");

  lines.push("DIAGNOSIS");
  lines.push("─────────");
  for (const b of result.bottlenecks) {
    lines.push(`• ${b.type} (Signal: ${Math.round(b.signalStrength * 100)}%)`);
    for (const r of b.reasoning) {
      lines.push(`  - ${r}`);
    }
  }
  lines.push("");

  lines.push("CHECKS TO CONFIRM");
  lines.push("─────────────────");
  for (const c of result.checksToConfirm) {
    lines.push(`• ${c}`);
  }
  lines.push("");

  lines.push("ACTION PLAN");
  lines.push("───────────");
  for (const a of result.actionPlan) {
    lines.push(`${a.priority}. ${a.title}`);
    lines.push(`   Impact: ${a.expectedImpact}`);
    lines.push(`   Risk: ${a.risk}`);
  }
  lines.push("");

  lines.push("EXPERIMENTS");
  lines.push("───────────");
  for (const e of result.experiments) {
    lines.push(`• ${e.name}`);
    lines.push(`  Hypothesis: ${e.hypothesis}`);
    lines.push(`  Setup: ${e.setup}`);
    lines.push(`  Success Metrics: ${e.successMetrics.join(", ")}`);
    lines.push(`  Guardrails: ${e.guardrails.join(", ")}`);
  }
  lines.push("");

  lines.push("CREATIVE DIRECTIONS");
  lines.push("───────────────────");
  lines.push("Angles:");
  for (const a of result.creativeDirections.angles) lines.push(`  • ${a}`);
  lines.push("Hooks:");
  for (const h of result.creativeDirections.hooks) lines.push(`  • ${h}`);
  lines.push("CTAs:");
  for (const c of result.creativeDirections.ctas) lines.push(`  • ${c}`);
  lines.push("");

  lines.push("COMPUTED METRICS");
  lines.push("────────────────");
  lines.push(`ROAS: ${computed.roas.toFixed(2)}x`);
  lines.push(`CPC: $${computed.cpc.toFixed(2)}`);
  lines.push(`Estimated CAC: $${computed.estimatedCac.toFixed(2)}`);
  lines.push("═══════════════════════════════════════");

  return lines.join("\n");
}
