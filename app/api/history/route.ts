import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const runs = await prisma.analysisRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        experiments: {
          include: { outcomes: true },
        },
      },
    });

    const serialized = runs.map((run) => ({
      id: run.id,
      createdAt: run.createdAt.toISOString(),
      brand: run.brand,
      industry: run.industry,
      window: run.window,
      primaryBottleneck: run.primaryBottleneck,
      confidence: run.confidence,
      riskScore: run.riskScore,
      aiOutput: JSON.parse(run.aiOutput),
      channelMix: JSON.parse(run.channelMix),
      metrics: JSON.parse(run.metrics),
      trends: JSON.parse(run.trends),
      notes: run.notes,
      experiments: run.experiments.map((exp) => ({
        id: exp.id,
        name: exp.name,
        status: exp.status,
        bottleneckType: exp.bottleneckType,
        outcomes: exp.outcomes.map((o) => ({
          id: o.id,
          outcomeStatus: o.outcomeStatus,
          createdAt: o.createdAt.toISOString(),
        })),
      })),
    }));

    return NextResponse.json({ runs: serialized });
  } catch (err) {
    console.error("History route error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
