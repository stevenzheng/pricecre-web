// GET /api/admin/ai-reports — Admin: list all AI reports
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const records = await prisma.aiAnalysisCache.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const reports = records.map((r: any) => ({
      id: r.id,
      email: (r.analysisData as any)?.email || "",
      propertyId: (r.analysisData as any)?.propertyId || "",
      projectName: r.projectName,
      city: r.city,
      summary: (r.analysisData as any)?.summary || "",
      content: (r.analysisData as any)?.content || "",
      createdAt: r.createdAt,
    }));
    return NextResponse.json({ reports });
  } catch (err: any) {
    return NextResponse.json({ reports: [], error: err.message });
  }
}
