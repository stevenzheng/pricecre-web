import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const city = searchParams.get("city") || undefined;
    const type = searchParams.get("type") || undefined;

    const where: any = {};
    if (city) where.city = city;
    if (type) where.propertyType = type;

    const [properties, total] = await Promise.all([
      prisma.commercialProperty.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          projectName: true,
          city: true,
          district: true,
          propertyType: true,
          faceRent: true,
          dataSource: true,
          updatedAt: true,
        },
      }),
      prisma.commercialProperty.count({ where }),
    ]);

    return NextResponse.json({ properties, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
