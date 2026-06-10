// GET /api/admin/ai-reports — Admin: list all AI reports (no auth, safe Prisma)
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let reports: any[] = [];
    try {
      const { prisma } = await import("@/lib/prisma");
      const records = await prisma.aiAnalysisCache.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      reports = records.map((r: any) => ({
        id: r.id, email: (r.analysisData as any)?.email || "",
        projectName: r.projectName, city: r.city,
        summary: (r.analysisData as any)?.summary || "",
        content: (r.analysisData as any)?.content || (r.analysisData as any)?.conclusion || "",
        createdAt: r.createdAt,
      }));
    } catch {}
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
