import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const [propertyCount, cityCount, userCount] = await Promise.all([
      prisma.commercialProperty.count(),
      prisma.commercialProperty.findMany({
        select: { city: true },
        distinct: ["city"],
      }).then((r) => r.length),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      propertyCount,
      cityCount,
      userCount,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
