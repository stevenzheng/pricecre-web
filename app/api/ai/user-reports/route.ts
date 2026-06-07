// GET /api/ai/user-reports?email=xxx — List user's AI reports from AiAnalysisCache
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ reports: [] });

  try {
    const records = await prisma.aiAnalysisCache.findMany({
      where: { cacheKey: { startsWith: email } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      reports: records.map((r: any) => ({
        id: r.id,
        projectName: r.projectName,
        city: r.city,
        summary: (r.analysisData as any)?.summary || "",
        createdAt: r.createdAt,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ reports: [] });
  }
}
