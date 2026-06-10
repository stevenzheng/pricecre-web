// GET /api/admin/ai-reports — Admin: list all AI reports
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // Always return empty reports safely, try Prisma if available
  try {
    const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: null }));
    if (!prisma) return NextResponse.json({ reports: [] });

    const records = await prisma.aiAnalysisCache.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }).catch(() => []);

    const reports = (records || []).map((r: any) => ({
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
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
