// app/api/admin/properties/route.ts — 资产数据管理：查询/新增/删除
// GET: 优先读数据库 CommercialProperty；数据库为空或不可用时降级返回 mock 数据（与前台展示一致）
// POST: 手动添加资产（写入数据库）
// DELETE: 删除资产（?id=xxx，仅数据库记录可删）
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getMockProperties() {
  const m = await import("@/lib/mock-data");
  return m.mockProperties.map((p: any) => ({
    id: String(p.id || ""),
    projectName: String(p.projectName || ""),
    city: String(p.city || ""),
    district: String(p.district || ""),
    propertyType: String(p.propertyType || "OFFICE"),
    faceRent: Number(p.faceRent) || 0,
    dataSource: String(p.dataSource || "mock"),
    confidenceScore: Number(p.confidenceScore) || 0.85,
    createdAt: String(p.updatedAt || ""),
    isMock: true,
  }));
}

export async function GET(request: NextRequest) {
  let dbProperties: any[] = [];
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city") || undefined;
    const type = searchParams.get("type") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: any = {};
    if (city && city !== "全部") where.city = city;
    if (type && type !== "all" && type !== "ALL") where.propertyType = type;
    if (search) where.projectName = { contains: search, mode: "insensitive" };

    const { prisma } = await import("@/lib/prisma");
    const rows = await prisma.commercialProperty.findMany({
      where,
      take: 500,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true, projectName: true, city: true, district: true,
        propertyType: true, faceRent: true, dataSource: true,
        updatedAt: true, confidenceScore: true, createdAt: true,
      },
    });
    dbProperties = rows.map((p) => ({ ...p, faceRent: Number(p.faceRent), isMock: false }));
  } catch {
    dbProperties = [];
  }

  // 数据库有数据 → 数据库优先，mock 中不重名的补充在后（与前台合并逻辑一致）
  try {
    const mock = await getMockProperties();
    const names = new Set(dbProperties.map((p) => p.projectName));
    const merged = [...dbProperties, ...mock.filter((m) => !names.has(m.projectName))];
    return NextResponse.json({ properties: merged, total: merged.length, dbCount: dbProperties.length });
  } catch {
    return NextResponse.json({ properties: dbProperties, total: dbProperties.length, dbCount: dbProperties.length });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, city, district, propertyType, faceRent, dataSource, confidenceScore } = body;
    if (!projectName) return NextResponse.json({ error: "项目名称必填" }, { status: 400 });

    const { prisma } = await import("@/lib/prisma");
    const item = await prisma.commercialProperty.upsert({
      where: { projectName_rawAddress: { projectName, rawAddress: city || "" } },
      update: {
        city: city || "上海",
        district: district || "",
        propertyType: propertyType || "OFFICE",
        faceRent: Number(faceRent) || 0,
        dataSource: dataSource || "manual",
        confidenceScore: Number(confidenceScore) || 0.9,
        agentUpdatedAt: new Date(),
      },
      create: {
        projectName,
        city: city || "上海",
        district: district || "",
        rawAddress: city || "",
        propertyType: propertyType || "OFFICE",
        faceRent: Number(faceRent) || 0,
        dataSource: dataSource || "manual",
        confidenceScore: Number(confidenceScore) || 0.9,
        dynamicIndicators: body.dynamicIndicators || {},
        agentUpdatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, id: item.id });
  } catch (err: any) {
    return NextResponse.json({ error: "添加失败：" + (err.message || "数据库不可用").slice(0, 120) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "缺少 id" }, { status: 400 });
    if (id.startsWith("prop-")) {
      return NextResponse.json({ error: "演示数据不可删除，仅数据库中的资产可删除" }, { status: 400 });
    }
    const { prisma } = await import("@/lib/prisma");
    // deleteMany 幂等：记录不存在不抛 P2025（重复点击/已被删除的情况）
    const result = await prisma.commercialProperty.deleteMany({ where: { id } });
    if (result.count === 0) {
      return NextResponse.json({ error: "该记录不存在或已被删除，请刷新列表" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "删除失败：" + (err.message || "").slice(0, 120) }, { status: 500 });
  }
}
