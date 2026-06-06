/**
 * GET /api/user/history?email=xxx
 * Returns the user's unlocked property view history
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "缺少邮箱参数" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ history: [] });
    }

    const logs = await prisma.userViewLog.findMany({
      where: { userId: user.id },
      orderBy: { viewedAt: "desc" },
      take: 50,
    });

    if (logs.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // Fetch property details
    const propertyIds = logs.map((l) => l.propertyId);
    const properties = await prisma.commercialProperty.findMany({
      where: { id: { in: propertyIds } },
      select: {
        id: true,
        projectName: true,
        city: true,
        district: true,
        propertyType: true,
        faceRent: true,
      },
    });

    const propMap = new Map(properties.map((p) => [p.id, p]));
    const history = logs
      .map((log) => propMap.get(log.propertyId))
      .filter(Boolean)
      .map((p) => ({
        id: p!.id,
        projectName: p!.projectName,
        city: p!.city,
        district: p!.district,
        propertyType: p!.propertyType,
        faceRent: Number(p!.faceRent),
      }));

    return NextResponse.json({ history });
  } catch (err: unknown) {
    console.error("[History Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ history: [] });
  }
}
