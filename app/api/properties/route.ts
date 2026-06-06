// app/api/properties/route.ts — Public property listing (for frontend display)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || undefined;
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {};
    if (city && city !== "全部") where.city = city;
    if (type && type !== "ALL") where.propertyType = type;
    if (search) where.projectName = { contains: search, mode: "insensitive" };

    const properties = await prisma.commercialProperty.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        projectName: true,
        city: true,
        district: true,
        propertyType: true,
        faceRent: true,
        area: true,
        dataSource: true,
        dynamicIndicators: true,
        confidenceScore: true,
        updatedAt: true,
      },
    });

    const formatted = properties.map(p => ({
      ...p,
      faceRent: Number(p.faceRent),
    }));

    return NextResponse.json({ properties: formatted, total: formatted.length });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}
