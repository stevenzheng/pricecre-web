// app/api/admin/properties/route.ts — 生产表 CommercialProperty 查询
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await adminAuth();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const city = searchParams.get("city") || undefined;
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;
    const sort = searchParams.get("sort") || "updatedAt";
    const order = searchParams.get("order") || "desc";

    const where: any = {};
    if (city) where.city = city;
    if (type && type !== "all") where.propertyType = type;
    if (search) where.projectName = { contains: search, mode: "insensitive" };

    const orderBy: any = { [sort]: order };

    const [properties, total] = await Promise.all([
      prisma.commercialProperty.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy,
        select: { id: true, projectName: true, city: true, district: true, propertyType: true, faceRent: true, dataSource: true, updatedAt: true, confidenceScore: true },
      }),
      prisma.commercialProperty.count({ where }),
    ]);

    return NextResponse.json({ items: properties, total, page, limit });
  } catch (error) {
    if ((error as any)?.status) return error as any;
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
