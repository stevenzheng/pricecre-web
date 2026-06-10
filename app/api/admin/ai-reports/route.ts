// GET /api/admin/ai-reports — Admin: list all AI reports (safe Prisma, 所有字段强制转字符串防止前端渲染崩溃)
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function asText(v: any): string {
  if (v === undefined || v === null) return "";
  if (typeof v === "string") return v;
  try { return JSON.stringify(v); } catch { return String(v); }
}

export async function GET() {
  try {
    let reports: any[] = [];
    try {
      const { prisma } = await import("@/lib/prisma");
      const records = await prisma.aiAnalysisCache.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      reports = records.map((r: any) => {
        const a = (r.analysisData as any) || {};
        return {
          id: String(r.id),
          email: asText(a.email),
          projectName: asText(r.projectName),
          city: asText(r.city),
          summary: asText(a.summary || (a.score !== undefined ? `${a.score}分` : "")),
          content: asText(a.content || a.conclusion),
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        };
      });
    } catch {}
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
