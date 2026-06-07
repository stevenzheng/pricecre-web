// GET /api/ai/user-reports?email=xxx — List user's AI reports from AiAnalysisCache
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ reports: [] });

  try {
    const records = await prisma.aiAnalysisCache.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Filter by email stored in analysisData JSON
    const reports = records
      .filter((r: any) => {
        const data = r.analysisData as any;
        return data?.email === email;
      })
      .map((r: any) => ({
        id: r.id,
        propertyId: (r.analysisData as any)?.propertyId || "",
        projectName: r.projectName,
        city: r.city,
        summary: (r.analysisData as any)?.summary || "",
        createdAt: r.createdAt,
      }));

    return NextResponse.json({ reports });
  } catch (err: any) {
    console.error("user-reports error:", err.message);
    return NextResponse.json({ reports: [] });
  }
}
