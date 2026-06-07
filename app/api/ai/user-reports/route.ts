// GET /api/ai/user-reports?email=xxx — List user's AI reports
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ reports: [] });

  try {
    const reports = await (prisma as any).aIAnalysis?.findMany?.({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, propertyId: true, projectName: true, city: true, summary: true, createdAt: true },
    }) || [];
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
