import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const StatusSchema = z.object({
  status: z.enum(["Proposed", "Running", "Completed", "Archived"]),
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const parsed = StatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.experiment.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ id: updated.id, status: updated.status });
  } catch (err) {
    console.error("Status update error:", err);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}
