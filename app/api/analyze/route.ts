import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import {
  AnalyzeRequestSchema,
  AnalysisResultSchema,
  type AnalysisResult,
  type CampaignSnapshot,
} from "@/lib/schema";
import { prisma } from "@/lib/prisma";

function getOpenAIClient(): OpenAI | null {
  if (process.env.NAVIGATOR_TOOLKIT_API_KEY) {
    return new OpenAI({
      apiKey: process.env.NAVIGATOR_TOOLKIT_API_KEY,
      baseURL: process.env.NAVIGATOR_BASE_URL ?? "https://api.ai.it.ufl.edu/v1",
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return null;
}

function getModel(): string {
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior growth strategist specializing in performance marketing for beauty, wellness, and fashion DTC brands across paid social (Meta, TikTok) and paid search (Google). You are part of the AI Growth Operator system.

RULES:
1. Classify bottlenecks into exactly these 4 types: Creative, Conversion, Scaling, Efficiency
   - Creative: ad fatigue, low CTR, high frequency, stale creative
   - Conversion: post-click issues, landing page, checkout friction, CVR/AOV
   - Scaling: audience saturation, CPM inflation, ROAS degradation at scale
   - Efficiency: CAC too high, LTV:CAC poor, channel mix sub-optimal
2. Ground EVERY reasoning point in specific metric relationships (e.g., "CTR -24% while CPM flat = creative exhaustion, not auction pressure")
3. signalStrength values must sum to approximately 1.0
4. confidence is 0.0–1.0 reflecting certainty given available data
5. riskScore is 0–100: tie directly to metric severity and trend direction
6. riskDrivers must justify the riskScore with specific metric relationships
7. Each experiment's category must match the bottleneck it targets
8. checksToConfirm are specific diagnostic actions to validate your hypothesis
9. Experiments must have concrete, measurable success metrics and enforceable guardrails
10. Creative directions must be specific to the industry and primary bottleneck
11. No generic advice. Every statement must reference the provided data.
12. OUTPUT ONLY VALID JSON — no markdown, no explanation, no code blocks, no commentary`;

// ─── User prompt ──────────────────────────────────────────────────────────────

function buildUserPrompt(body: {
  snapshot: CampaignSnapshot;
  computed: { roas: number; cpc: number; estimatedCac: number };
}): string {
  const { snapshot, computed } = body;
  const { metrics, trends, channelMix } = snapshot;

  const trendLines = [
    trends.roasDelta !== null ? `ROAS Δ: ${trends.roasDelta > 0 ? "+" : ""}${trends.roasDelta}%` : null,
    trends.ctrDelta !== null ? `CTR Δ: ${trends.ctrDelta > 0 ? "+" : ""}${trends.ctrDelta}%` : null,
    trends.cvrDelta !== null ? `CVR Δ: ${trends.cvrDelta > 0 ? "+" : ""}${trends.cvrDelta}%` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return `Analyze this campaign and return ONLY JSON:

BRAND: ${snapshot.brandName} | INDUSTRY: ${snapshot.industry} | WINDOW: ${snapshot.timeWindow}
CHANNELS: Meta ${channelMix.meta}% | Google ${channelMix.google}% | TikTok ${channelMix.tiktok}%

METRICS:
Spend: $${metrics.spend.toLocaleString()} | Revenue: $${metrics.revenue.toLocaleString()} | ROAS: ${computed.roas.toFixed(2)}x
CTR: ${metrics.ctr}% | CPM: $${metrics.cpm} | CPC: $${computed.cpc.toFixed(2)}
CVR: ${metrics.conversionRate}% | AOV: $${metrics.aov} | LTV: $${metrics.ltv} | Est. CAC: $${computed.estimatedCac.toFixed(2)}
${trendLines ? `TRENDS: ${trendLines}` : "TRENDS: No trend data provided"}

CONTEXT: ${snapshot.notes || "None provided."}

Return ONLY this JSON structure, nothing else:
{
  "summary": { "oneLiner": "string — one crisp sentence tying the primary issue to the data" },
  "bottlenecks": [
    { "type": "Creative|Conversion|Scaling|Efficiency", "signalStrength": 0.0-1.0, "reasoning": ["string grounded in metric relationships"] }
  ],
  "primaryBottleneck": "Creative|Conversion|Scaling|Efficiency",
  "secondaryBottlenecks": ["Creative|Conversion|Scaling|Efficiency"],
  "confidence": 0.0-1.0,
  "checksToConfirm": ["specific diagnostic action"],
  "risk": {
    "riskScore": 0-100,
    "riskDrivers": ["specific metric relationship driving risk"]
  },
  "actionPlan": [
    { "priority": 1, "title": "string", "expectedImpact": "string with numbers", "risk": "string" }
  ],
  "experiments": [
    {
      "category": "Creative|Conversion|Scaling|Efficiency",
      "name": "string",
      "hypothesis": "string — if X then Y because Z",
      "setup": "string — specific steps",
      "successMetrics": ["metric ≥ threshold"],
      "guardrails": ["pause condition"]
    }
  ],
  "creativeDirections": {
    "angles": ["string"],
    "hooks": ["string — opening line formula"],
    "ctas": ["string"]
  }
}`;
}

// ─── Call OpenAI ──────────────────────────────────────────────────────────────

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) throw new Error("No API key configured");
  const response = await openai.chat.completions.create({
    model: getModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 3500,
  });
  return response.choices[0]?.message?.content ?? "";
}

// ─── Simulation mock ──────────────────────────────────────────────────────────

function mockAnalysis(snapshot: { brandName: string; industry: string }): AnalysisResult {
  const brand = snapshot.brandName || "the brand";
  return {
    summary: {
      oneLiner: `${brand} is experiencing creative fatigue on Meta — ad frequency above 4x has compressed CTR by ~22%, driving ROAS decline; a creative rotation sprint is the highest-leverage intervention.`,
    },
    bottlenecks: [
      {
        type: "Creative",
        signalStrength: 0.54,
        reasoning: [
          "CTR down 24% while CPM held flat — audience recognition, not auction pressure",
          "Frequency above 4.2x exceeds the 3.5x engagement-decay threshold for this category",
          "No creative refresh in 14 days with sustained spend accelerates signal burn",
        ],
      },
      {
        type: "Conversion",
        signalStrength: 0.26,
        reasoning: [
          "CVR -15% is larger than creative fatigue alone explains — post-click degradation likely",
          "AOV held steady, isolating the issue to top-of-funnel to checkout entry",
        ],
      },
      {
        type: "Efficiency",
        signalStrength: 0.12,
        reasoning: [
          "ROAS -18% over period with stable CPM indicates marginal audience quality erosion",
          "Rising estimated CAC at flat AOV compresses contribution margin",
        ],
      },
      {
        type: "Scaling",
        signalStrength: 0.08,
        reasoning: [
          "Current budget is within range but creative exhaustion will cap future scaling headroom",
        ],
      },
    ],
    primaryBottleneck: "Creative",
    secondaryBottlenecks: ["Conversion", "Efficiency"],
    confidence: 0.82,
    checksToConfirm: [
      "Pull ad-level frequency breakdown — confirm which creatives exceed 4x frequency",
      "Compare pre/post CTR by creative to isolate fatigue by asset age",
      "Run session recordings on the landing page for post-click drop-off patterns",
      "Verify pixel event tracking consistency in Meta Events Manager",
    ],
    risk: {
      riskScore: 62,
      riskDrivers: [
        "ROAS -18% trending down with no creative refresh = compounding fatigue risk",
        "CVR -15% signals post-click vulnerability that could deepen if not addressed",
        "Frequency 4.2x — another 5–7 days at current spend will likely push CTR below 0.7%",
      ],
    },
    actionPlan: [
      {
        priority: 1,
        title: "Launch Creative Sprint — 6 Net-New Concepts",
        expectedImpact: "Restore CTR to 1.8–2.1% within 7 days, recover 0.3–0.5x ROAS",
        risk: "New creatives require 3–5 day learning phase before performance stabilizes",
      },
      {
        priority: 2,
        title: "Pause or Throttle Creatives with Frequency >4x",
        expectedImpact: "Immediate CPM efficiency +10–15%, reduce wasted impressions",
        risk: "Short-term revenue dip of 15–20% during creative transition",
      },
      {
        priority: 3,
        title: "Audit Landing Page Message-to-Creative Alignment",
        expectedImpact: "Recover 0.2–0.3% CVR if message mismatch confirmed",
        risk: "Low — diagnostic only until findings confirmed",
      },
    ],
    experiments: [
      {
        category: "Creative",
        name: "UGC Hook Rotation vs Branded Control",
        hypothesis: `If UGC-style testimonial hooks replace branded video for ${snapshot.industry} audiences, CTR will recover ≥15% within 7 days because social proof reduces creative recognition fatigue`,
        setup: "Create 3 UGC-style videos (15–30s). A/B test 50/50 vs top control creative. Run 7 days minimum. Hold all other variables constant.",
        successMetrics: ["CTR ≥ 1.8% (vs current 1.1%)", "ROAS ≥ 2.0x", "Frequency ≤ 3.5x"],
        guardrails: [
          "Pause test if CPA exceeds 2x target for 3 consecutive days",
          "Minimum 1,000 impressions per creative before evaluating",
        ],
      },
      {
        category: "Conversion",
        name: "Message-to-Landing-Page Alignment",
        hypothesis: "If landing page headlines match ad creative angle, CVR will improve ≥0.3% because reduced message mismatch lowers post-click abandonment",
        setup: "Create dedicated LP variants for each top creative angle. Route traffic via UTM. Track for 14 days with holdout control.",
        successMetrics: ["CVR ≥ 2.0% (vs 1.4%)", "Bounce rate -10%", "Add-to-cart ≥ 6%"],
        guardrails: [
          "Revert if revenue/session drops below control for 3 consecutive days",
          "Ensure tracking parity before launch",
        ],
      },
    ],
    creativeDirections: {
      angles: [
        "Transformation-first: Lead with dramatic before/after specific to the category pain point",
        "Social proof overload: Aggregate 5+ authentic customer reviews in first 3 seconds",
        "Ingredient/process transparency: Behind-the-scenes of formulation builds trust",
        "Scarcity tied to real constraint: limited batch, seasonal ingredient",
      ],
      hooks: [
        `"I was spending $${Math.floor(Math.random() * 200 + 50)}/month on [competitor] until I tried this…"`,
        '"POV: You finally found a [product] that actually works"',
        '"The real reason your [problem] isn\'t improving (and what to do)"',
        '"Dermatologist reacts to our formula" — authority hook',
      ],
      ctas: [
        "Shop the formula — limited stock",
        "Start your transformation today",
        "See why 10,000+ fans switched",
        "Get yours before it sells out",
      ],
    },
  };
}

// ─── Persist to database ──────────────────────────────────────────────────────

async function persistToDB(
  snapshot: CampaignSnapshot,
  computed: { roas: number; cpc: number; estimatedCac: number },
  result: AnalysisResult
): Promise<{ runId: string; experimentIds: Array<{ name: string; id: string }> }> {
  const runId = randomUUID();

  await prisma.analysisRun.create({
    data: {
      id: runId,
      brand: snapshot.brandName,
      industry: snapshot.industry,
      window: snapshot.timeWindow,
      channelMix: JSON.stringify(snapshot.channelMix),
      metrics: JSON.stringify({ ...snapshot.metrics, ...computed }),
      trends: JSON.stringify(snapshot.trends),
      notes: snapshot.notes,
      aiOutput: JSON.stringify(result),
      primaryBottleneck: result.primaryBottleneck,
      confidence: result.confidence,
      riskScore: result.risk.riskScore,
    },
  });

  const experimentIds: Array<{ name: string; id: string }> = [];

  for (const exp of result.experiments) {
    const expId = randomUUID();
    await prisma.experiment.create({
      data: {
        id: expId,
        brand: snapshot.brandName,
        industry: snapshot.industry,
        bottleneckType: exp.category,
        name: exp.name,
        hypothesis: exp.hypothesis,
        setup: exp.setup,
        successMetrics: JSON.stringify(exp.successMetrics),
        guardrails: JSON.stringify(exp.guardrails),
        linkedRunId: runId,
        status: "Proposed",
      },
    });
    experimentIds.push({ name: exp.name, id: expId });
  }

  return { runId, experimentIds };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = AnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { snapshot, computed, simulationMode } = parseResult.data;

    if (simulationMode) {
      // Simulation runs are never saved to the database — demo data only
      const mockResult = mockAnalysis(snapshot);
      const runId = "sim-" + Date.now();
      return NextResponse.json({ result: mockResult, runId, experimentIds: [] });
    }

    if (!process.env.NAVIGATOR_TOOLKIT_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "No API key configured. Add NAVIGATOR_TOOLKIT_API_KEY to .env.local or enable Simulation Mode." },
        { status: 500 }
      );
    }

    const userPrompt = buildUserPrompt({ snapshot, computed });
    let rawContent = await callOpenAI(SYSTEM_PROMPT, userPrompt);

    let validated = AnalysisResultSchema.safeParse(JSON.parse(rawContent));

    if (!validated.success) {
      console.warn("First OpenAI response failed Zod validation, retrying…");
      const fixPrompt = `The JSON you returned is invalid. Fix it to match the required schema exactly. Return ONLY valid JSON.

YOUR OUTPUT:
${rawContent}

VALIDATION ERRORS:
${JSON.stringify(validated.error.format(), null, 2)}

Return ONLY the corrected JSON.`;
      rawContent = await callOpenAI(SYSTEM_PROMPT, fixPrompt);
      validated = AnalysisResultSchema.safeParse(JSON.parse(rawContent));
    }

    if (!validated.success) {
      return NextResponse.json(
        { error: "AI returned invalid response format after retry. Please try again." },
        { status: 500 }
      );
    }

    const result = validated.data;
    let runId = "tmp-" + Date.now();
    let experimentIds: Array<{ name: string; id: string }> = [];
    try {
      const persisted = await persistToDB(snapshot, computed, result);
      runId = persisted.runId;
      experimentIds = persisted.experimentIds;
    } catch (dbErr) {
      console.error("DB persist failed:", dbErr);
    }

    return NextResponse.json({ result, runId, experimentIds });
  } catch (err: unknown) {
    console.error("Analyze route error:", err);
    const message = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
