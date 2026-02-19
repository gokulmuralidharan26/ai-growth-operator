import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const OutcomeSchema = z.object({
  outcomeStatus: z.enum(["Win", "Loss", "Neutral", "Inconclusive"]),
  notes: z.string().default(""),
  metricsDelta: z
    .object({
      roas: z.number().nullable().optional(),
      cac: z.number().nullable().optional(),
      ctr: z.number().nullable().optional(),
      cvr: z.number().nullable().optional(),
    })
    .default({}),
  learnings: z.array(z.string()).default([]),
  recommendedNext: z.array(z.string()).default([]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = OutcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid outcome data", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const outcome = await prisma.experimentOutcome.create({
      data: {
        id: randomUUID(),
        experimentId: id,
        outcomeStatus: parsed.data.outcomeStatus,
        notes: parsed.data.notes,
        metricsDelta: JSON.stringify(parsed.data.metricsDelta),
        learnings: JSON.stringify(parsed.data.learnings),
        recommendedNext: JSON.stringify(parsed.data.recommendedNext),
      },
    });

    await prisma.experiment.update({
      where: { id },
      data: { status: "Completed" },
    });

    return NextResponse.json({
      outcomeId: outcome.id,
      experimentId: id,
      status: "Completed",
    });
  } catch (err) {
    console.error("Outcome create error:", err);
    return NextResponse.json({ error: "Failed to record outcome" }, { status: 500 });
  }
}
