// app/api/admin/review-queue/[id]/route.ts
// GET  — 获取单个资产全部47项指标
// PUT  — 更新指标数据
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.agentReviewQueue.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    // Update the dynamicIndicators JSONB field
    const item = await prisma.agentReviewQueue.update({
      where: { id: params.id },
      data: {
        dynamicIndicators: body.dynamicIndicators,
        faceRent: body.faceRent,
        projectName: body.projectName,
        city: body.city,
        district: body.district,
        propertyType: body.propertyType,
        dataSource: body.dataSource,
        confidenceScore: body.confidenceScore,
        // Append audit log entry
        auditLog: body.auditLog,
      },
    });
    return NextResponse.json(item);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
