// app/api/ai/analysis-cache/route.ts — Cache AI analyses (reuse 1 week)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — lookup cached analysis by project identifiers
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  if (!key) return NextResponse.json({ found: false });
  try {
    const cached = await prisma.aiAnalysisCache.findFirst({
      where: { cacheKey: key },
      orderBy: { createdAt: "desc" },
    });
    if (!cached) return NextResponse.json({ found: false });
    const age = Date.now() - new Date(cached.createdAt).getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    if (age > oneWeek) {
      return NextResponse.json({ found: false, expired: true });
    }
    return NextResponse.json({ found: true, id: cached.id, analysis: cached.analysisData });
  } catch {
    return NextResponse.json({ found: false });
  }
}

// POST — save or update cached analysis
export async function POST(request: Request) {
  try {
    const body = await request.json() as any;
    const keyParts = [body.projectName, body.city, body.district, body.propertyType].join("|");
    const cacheKey = keyParts.toLowerCase().replace(/\s+/g, "-");

    // Upsert: delete old, create new
    await prisma.aiAnalysisCache.deleteMany({ where: { cacheKey } });
    const entry = await prisma.aiAnalysisCache.create({
      data: {
        cacheKey,
        projectName: body.projectName,
        city: body.city,
        district: body.district,
        propertyType: body.propertyType,
        analysisData: { ...body.analysis, indicators: body.indicators || [], faceRent: body.faceRent, netEffectiveRent: body.netEffectiveRent },
      },
    });
    return NextResponse.json({ ok: true, id: entry.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
