// app/api/admin/properties/route.ts — 资产数据管理：查询/新增/删除
// GET: 优先读数据库 CommercialProperty；数据库为空或不可用时降级返回 mock 数据（与前台展示一致）
// POST: 手动添加资产（写入数据库）
// DELETE: 删除资产（?id=xxx，仅数据库记录可删）
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 提取列表页排序/筛选所需的核心精算指标
function pickIndicators(di: any) {
  const d = di || {};
  const num = (v: any) => (v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));
  return {
    vacancy: num(d.submarketVacancy),
    capRate: num(d.capRate),
    netEffectiveRent: num(d.netEffectiveRent),
    salesEfficiency: num(d.salesEfficiency),
  };
}

/** 资产名称标准化（去空白/全角/分隔符），用于跨来源去重 */
function normName(name: string): string {
  return (name || "").replace(/\s+/g, "").replace(/·|•|・/g, "").toLowerCase();
}

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
    ...pickIndicators(p.dynamicIndicators),
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
        dynamicIndicators: true,
      },
    });
    dbProperties = rows.map((p) => ({
      id: p.id, projectName: p.projectName, city: p.city, district: p.district,
      propertyType: p.propertyType, faceRent: Number(p.faceRent), dataSource: p.dataSource,
      updatedAt: p.updatedAt, confidenceScore: p.confidenceScore, createdAt: p.createdAt,
      ...pickIndicators(p.dynamicIndicators),
      isMock: false,
    }));
  } catch {
    dbProperties = [];
  }

  // 合并去重：标准化名称+城市为指纹；数据库优先，库内重名保留可信度最高的一条
  try {
    const mock = await getMockProperties();
    const seen = new Map<string, any>();
    for (const p of [...dbProperties, ...mock]) {
      const fp = `${normName(p.projectName)}_${p.city}`;
      const existing = seen.get(fp);
      if (!existing) { seen.set(fp, p); continue; }
      // 数据库记录优先于 mock；同为数据库记录取可信度高者
      if (existing.isMock && !p.isMock) seen.set(fp, p);
      else if (existing.isMock === p.isMock && (p.confidenceScore || 0) > (existing.confidenceScore || 0)) seen.set(fp, p);
    }
    const merged = Array.from(seen.values());
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
