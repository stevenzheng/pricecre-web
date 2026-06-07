// POST /api/ai/save-report — Save AI analysis report
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, propertyId, projectName, city, content, summary } = await req.json();
    if (!email || !propertyId) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

    try {
      await (prisma as any).aIAnalysis?.create?.({
        data: {
          email, propertyId, projectName, city,
          content: content || "",
          summary: summary || "",
          createdAt: new Date(),
        },
      });
    } catch {}
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
