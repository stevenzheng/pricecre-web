// GET /api/ai/get-report?id=xxx — Get full report content
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

  try {
    const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: null }));
    if (!prisma) {
      return NextResponse.json({ id, projectName: "", city: "", createdAt: "", content: "", summary: "" });
    }

    const r = await prisma.aiAnalysisCache.findUnique({ where: { id } }).catch(() => null);
    if (!r) {
      return NextResponse.json({ id, projectName: "", city: "", createdAt: "", content: "", summary: "" });
    }

    return NextResponse.json({
      id: r.id,
      projectName: r.projectName,
      city: r.city,
      createdAt: r.createdAt,
      content: (r.analysisData as any)?.content || "",
      summary: (r.analysisData as any)?.summary || "",
    });
  } catch {
    return NextResponse.json({ id, projectName: "", city: "", createdAt: "", content: "", summary: "" });
  }
}
