import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AnalysisResult } from "@/lib/schema";

// ─── Similarity scoring ───────────────────────────────────────────────────────

function trendSign(v: number | null | undefined): -1 | 0 | 1 {
  if (v === null || v === undefined) return 0;
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}

interface RunData {
  primaryBottleneck: string;
  aiOutput: AnalysisResult;
  trends: { roasDelta: number | null; ctrDelta: number | null; cvrDelta: number | null };
}

function computeSimilarity(target: RunData, candidate: RunData): number {
  let score = 0;

  // Primary bottleneck match — 35 pts
  if (target.primaryBottleneck === candidate.primaryBottleneck) score += 35;

  // Secondary bottleneck overlap — up to 20 pts (10 per shared, max 2)
  const tSec = target.aiOutput.secondaryBottlenecks ?? [];
  const cSec = candidate.aiOutput.secondaryBottlenecks ?? [];
  const overlap = tSec.filter((b) => cSec.includes(b as never)).length;
  score += Math.min(overlap * 10, 20);

  // Confidence band — 20 pts within ±0.15, 8 pts within ±0.30
  const confDiff = Math.abs(
    (target.aiOutput.confidence ?? 0) - (candidate.aiOutput.confidence ?? 0)
  );
  if (confDiff <= 0.15) score += 20;
  else if (confDiff <= 0.3) score += 8;

  // Trend sign match — 8 pts each (ROAS, CTR, CVR) = up to 25 pts
  const tt = target.trends;
  const ct = candidate.trends;
  if (tt.roasDelta !== null && ct.roasDelta !== null) {
    if (trendSign(tt.roasDelta) === trendSign(ct.roasDelta)) score += 8;
  }
  if (tt.ctrDelta !== null && ct.ctrDelta !== null) {
    if (trendSign(tt.ctrDelta) === trendSign(ct.ctrDelta)) score += 8;
  }
  if (tt.cvrDelta !== null && ct.cvrDelta !== null) {
    if (trendSign(tt.cvrDelta) === trendSign(ct.cvrDelta)) score += 9;
  }

  return Math.min(Math.round(score), 100);
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json({ error: "runId required" }, { status: 400 });
    }

    const targetRun = await prisma.analysisRun.findUnique({ where: { id: runId } });
    if (!targetRun) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const targetOutput = JSON.parse(targetRun.aiOutput) as AnalysisResult;
    const targetTrends = JSON.parse(targetRun.trends);
    const targetData: RunData = {
      primaryBottleneck: targetRun.primaryBottleneck,
      aiOutput: targetOutput,
      trends: targetTrends,
    };

    // Fetch other runs in same industry
    const candidates = await prisma.analysisRun.findMany({
      where: {
        industry: targetRun.industry,
        id: { not: runId },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        experiments: {
          where: { status: "Completed" },
          include: { outcomes: { orderBy: { createdAt: "desc" }, take: 1 } },
        },
      },
    });

    // Score and rank
    const scored = candidates
      .map((c) => {
        const cOutput = JSON.parse(c.aiOutput) as AnalysisResult;
        const cTrends = JSON.parse(c.trends);
        const similarity = computeSimilarity(targetData, {
          primaryBottleneck: c.primaryBottleneck,
          aiOutput: cOutput,
          trends: cTrends,
        });
        return { run: c, similarity, cOutput };
      })
      .filter((s) => s.similarity >= 20)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    const result = scored.map(({ run, similarity }) => ({
      run: {
        id: run.id,
        createdAt: run.createdAt.toISOString(),
        brand: run.brand,
        industry: run.industry,
        window: run.window,
        primaryBottleneck: run.primaryBottleneck,
        confidence: run.confidence,
        riskScore: run.riskScore,
        aiOutput: JSON.parse(run.aiOutput) as AnalysisResult,
        channelMix: JSON.parse(run.channelMix),
        metrics: JSON.parse(run.metrics),
        trends: JSON.parse(run.trends),
        notes: run.notes,
      },
      similarityScore: similarity,
      winningExperiments: run.experiments
        .filter((e) => e.outcomes.some((o) => o.outcomeStatus === "Win"))
        .map((e) => ({
          id: e.id,
          name: e.name,
          status: e.status,
          bottleneckType: e.bottleneckType,
          hypothesis: e.hypothesis,
          successMetrics: JSON.parse(e.successMetrics),
          outcomes: e.outcomes.map((o) => ({
            id: o.id,
            outcomeStatus: o.outcomeStatus,
            notes: o.notes,
            learnings: JSON.parse(o.learnings),
            recommendedNext: JSON.parse(o.recommendedNext),
            metricsDelta: JSON.parse(o.metricsDelta),
            createdAt: o.createdAt.toISOString(),
          })),
        })),
    }));

    return NextResponse.json({ similar: result });
  } catch (err) {
    console.error("Similar route error:", err);
    return NextResponse.json({ error: "Failed to compute similar cases" }, { status: 500 });
  }
}
