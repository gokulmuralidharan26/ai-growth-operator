import { z } from "zod";

// ─── Bottleneck types ─────────────────────────────────────────────────────────

export const BottleneckTypeEnum = z.enum([
  "Creative",
  "Conversion",
  "Scaling",
  "Efficiency",
]);
export type BottleneckType = z.infer<typeof BottleneckTypeEnum>;

// ─── Campaign Snapshot (form input) ──────────────────────────────────────────

export const CampaignSnapshotSchema = z.object({
  brandName: z.string().min(1, "Brand name is required"),
  industry: z.enum(["Beauty", "Wellness", "Fashion"]),
  timeWindow: z.enum(["7 days", "14 days", "30 days"]),
  channelMix: z.object({
    meta: z.number().min(0).max(100),
    google: z.number().min(0).max(100),
    tiktok: z.number().min(0).max(100),
  }),
  metrics: z.object({
    spend: z.number().min(0),
    revenue: z.number().min(0),
    ctr: z.number().min(0),
    cpm: z.number().min(0),
    conversionRate: z.number().min(0),
    aov: z.number().min(0),
    ltv: z.number().min(0),
  }),
  trends: z.object({
    roasDelta: z.number().nullable(),
    ctrDelta: z.number().nullable(),
    cvrDelta: z.number().nullable(),
  }),
  notes: z.string(),
});

export type CampaignSnapshot = z.infer<typeof CampaignSnapshotSchema>;

// ─── Computed fields ──────────────────────────────────────────────────────────

export const ComputedFieldsSchema = z.object({
  roas: z.number(),
  cpc: z.number(),
  estimatedCac: z.number(),
});

export type ComputedFields = z.infer<typeof ComputedFieldsSchema>;

// ─── AI Output schema (v2) ────────────────────────────────────────────────────

export const BottleneckSchema = z.object({
  type: BottleneckTypeEnum,
  signalStrength: z.number().min(0).max(1),
  reasoning: z.array(z.string()),
});

export const ActionItemSchema = z.object({
  priority: z.number().int().min(1),
  title: z.string(),
  expectedImpact: z.string(),
  risk: z.string(),
});

export const ExperimentSchema = z.object({
  category: BottleneckTypeEnum,
  name: z.string(),
  hypothesis: z.string(),
  setup: z.string(),
  successMetrics: z.array(z.string()),
  guardrails: z.array(z.string()),
});

export const RiskSchema = z.object({
  riskScore: z.number().int().min(0).max(100),
  riskDrivers: z.array(z.string()),
});

export const CreativeDirectionsSchema = z.object({
  angles: z.array(z.string()),
  hooks: z.array(z.string()),
  ctas: z.array(z.string()),
});

export const AnalysisResultSchema = z.object({
  summary: z.object({
    oneLiner: z.string(),
  }),
  bottlenecks: z.array(BottleneckSchema).min(2).max(4),
  primaryBottleneck: BottleneckTypeEnum,
  secondaryBottlenecks: z.array(BottleneckTypeEnum),
  confidence: z.number().min(0).max(1),
  checksToConfirm: z.array(z.string()),
  risk: RiskSchema,
  actionPlan: z.array(ActionItemSchema),
  experiments: z.array(ExperimentSchema),
  creativeDirections: CreativeDirectionsSchema,
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type Experiment = z.infer<typeof ExperimentSchema>;
export type Risk = z.infer<typeof RiskSchema>;

// ─── History (localStorage fallback) ─────────────────────────────────────────

export interface HistoryItem {
  id: string;
  timestamp: string;
  snapshot: CampaignSnapshot;
  computed: ComputedFields;
  result: AnalysisResult;
}

// ─── DB row shapes (returned from API routes) ─────────────────────────────────

export interface DBRun {
  id: string;
  createdAt: string;
  brand: string;
  industry: string;
  window: string;
  primaryBottleneck: string;
  confidence: number;
  riskScore: number;
  aiOutput: AnalysisResult;
  channelMix: CampaignSnapshot["channelMix"];
  metrics: CampaignSnapshot["metrics"];
  trends: CampaignSnapshot["trends"];
  notes: string;
}

export interface DBExperiment {
  id: string;
  createdAt: string;
  updatedAt: string;
  brand: string;
  industry: string;
  bottleneckType: string;
  name: string;
  hypothesis: string;
  setup: string;
  successMetrics: string[];
  guardrails: string[];
  linkedRunId: string;
  status: ExperimentStatus;
  outcomes: DBOutcome[];
}

export type ExperimentStatus = "Proposed" | "Running" | "Completed" | "Archived";
export type OutcomeStatus = "Win" | "Loss" | "Neutral" | "Inconclusive";

export interface DBOutcome {
  id: string;
  createdAt: string;
  outcomeStatus: OutcomeStatus;
  notes: string;
  metricsDelta: { roas?: number; cac?: number; ctr?: number; cvr?: number };
  learnings: string[];
  recommendedNext: string[];
}

export interface SimilarCase {
  run: DBRun;
  similarityScore: number;
  winningExperiments: DBExperiment[];
}

// ─── API request/response ─────────────────────────────────────────────────────

export const AnalyzeRequestSchema = z.object({
  snapshot: CampaignSnapshotSchema,
  computed: ComputedFieldsSchema,
  simulationMode: z.boolean().optional(),
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

export interface AnalyzeResponse {
  result: AnalysisResult;
  runId: string;
  experimentIds: Array<{ name: string; id: string }>;
}
