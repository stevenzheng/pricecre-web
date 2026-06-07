// GET /api/ai/get-report?id=xxx — Get full report content
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });
  try {
    const r = await prisma.aiAnalysisCache.findUnique({ where: { id } });
    if (!r) return NextResponse.json({ error: "报告不存在" }, { status: 404 });
    return NextResponse.json({
      id: r.id,
      projectName: r.projectName,
      city: r.city,
      createdAt: r.createdAt,
      content: (r.analysisData as any)?.content || "",
      summary: (r.analysisData as any)?.summary || "",
    });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
