// GET /api/admin/ai-reports — Admin: list all AI reports
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const reports = await (prisma as any).aIAnalysis?.findMany?.({
      orderBy: { createdAt: "desc" },
      take: 100,
    }) || [];
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
