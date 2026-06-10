// GET/PUT /api/admin/property/[id] — 单个资产详情 + 编辑保存
// GET: 优先数据库，找不到再查 mock 数据（保证后台编辑器与前台展示一致）
// PUT: 数据库记录直接更新；mock 记录则 upsert 到数据库（编辑后即转为正式数据）
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function findMock(id: string) {
  const m = await import("@/lib/mock-data");
  return (m.mockProperties as any[]).find((x) => x.id === id) || null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // 1) 数据库
  try {
    const { prisma } = await import("@/lib/prisma");
    const p = await prisma.commercialProperty.findUnique({ where: { id: params.id } });
    if (p) {
      return NextResponse.json({
        id: p.id,
        projectName: p.projectName,
        city: p.city,
        district: p.district,
        propertyType: p.propertyType,
        faceRent: Number(p.faceRent),
        dataSource: p.dataSource,
        confidenceScore: p.confidenceScore,
        indicators: (p.dynamicIndicators as any) || {},
        source: "db",
      });
    }
  } catch {}

  // 2) mock 数据降级
  try {
    const p = await findMock(params.id);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: p.id,
      projectName: p.projectName,
      city: p.city,
      district: p.district,
      propertyType: typeof p.propertyType === "number" ? ["OFFICE", "SHOPS", "INDUSTRIAL"][p.propertyType] : p.propertyType,
      faceRent: Number(p.faceRent) || 0,
      dataSource: p.dataSource || "",
      confidenceScore: p.confidenceScore || 0.85,
      indicators: p.dynamicIndicators || {},
      source: "mock",
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const indicators = body.indicators || body.dynamicIndicators || {};
    const data = {
      projectName: body.projectName || "",
      city: body.city || "上海",
      district: body.district || "",
      propertyType: body.propertyType || "OFFICE",
      faceRent: Number(body.faceRent) || 0,
      dataSource: body.dataSource || "manual",
      confidenceScore: Number(body.confidenceScore) || 0.9,
      dynamicIndicators: indicators,
      agentUpdatedAt: new Date(),
    };

    const { prisma } = await import("@/lib/prisma");

    // 数据库已有该 id → 直接更新
    const existing = await prisma.commercialProperty.findUnique({ where: { id: params.id } }).catch(() => null);
    if (existing) {
      await prisma.commercialProperty.update({ where: { id: params.id }, data });
      return NextResponse.json({ success: true, id: params.id, persisted: "db" });
    }

    // mock 记录 → 按 projectName+rawAddress upsert 入库，编辑结果持久化
    const mock = await findMock(params.id).catch(() => null);
    const rawAddress = mock?.rawAddress || data.city;
    const item = await prisma.commercialProperty.upsert({
      where: { projectName_rawAddress: { projectName: data.projectName, rawAddress } },
      update: data,
      create: { ...data, rawAddress },
    });
    return NextResponse.json({ success: true, id: item.id, persisted: "db-upsert" });
  } catch (err: any) {
    // 数据库不可用时不要让管理员卡死，但要明确告知未持久化
    return NextResponse.json({ success: false, error: "保存失败（数据库不可用）：" + (err.message || "").slice(0, 120) }, { status: 500 });
  }
}
