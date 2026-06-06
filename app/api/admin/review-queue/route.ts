// app/api/admin/review-queue/route.ts
// GET  — 列出 AgentReviewQueue 待审资产
// POST — 创建新审核条目
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || "PENDING_REVIEW";

    const where: any = { status };
    if (type && type !== "all") where.propertyType = type;
    if (search) where.projectName = { contains: search, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.agentReviewQueue.findMany({
        where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      }),
      prisma.agentReviewQueue.count({ where }),
    ]);

    const list = items.map((i) => ({
      id: i.id,
      projectName: i.projectName,
      city: i.city,
      district: i.district,
      propertyType: i.propertyType,
      faceRent: Number(i.faceRent),
      dataSource: i.dataSource,
      status: i.status,
      confidenceScore: i.confidenceScore,
      createdAt: i.createdAt.toISOString(),
    }));

    return NextResponse.json({ items: list, total, page, limit });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
