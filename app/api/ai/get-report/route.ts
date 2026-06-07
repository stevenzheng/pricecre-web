// GET /api/ai/get-report?id=xxx — Get full report content
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });
  try {
    const report = await (prisma as any).aIAnalysis?.findUnique?.({ where: { id } });
    if (!report) return NextResponse.json({ error: "报告不存在" }, { status: 404 });
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
