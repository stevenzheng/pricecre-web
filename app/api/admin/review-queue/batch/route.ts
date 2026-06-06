// app/api/admin/review-queue/batch/route.ts
// POST { ids: string[], action: "approve" | "reject" } — 批量操作
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { ids, action, rejectReason } = await request.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    const results: any[] = [];

    for (const id of ids) {
      const item = await prisma.agentReviewQueue.findUnique({ where: { id } });
      if (!item) { results.push({ id, status: "NOT_FOUND" }); continue; }

      if (action === "approve") {
        await prisma.commercialProperty.upsert({
          where: { projectName_rawAddress: { projectName: item.projectName, rawAddress: item.rawAddress } },
          create: {
            projectName: item.projectName, city: item.city, district: item.district,
            rawAddress: item.rawAddress, propertyType: item.propertyType,
            faceRent: item.faceRent, area: item.area, dataSource: item.dataSource,
            dynamicIndicators: item.dynamicIndicators as any,
            confidenceScore: item.confidenceScore, agentUpdatedAt: new Date(),
          },
          update: {
            faceRent: item.faceRent, area: item.area, dataSource: item.dataSource,
            dynamicIndicators: item.dynamicIndicators as any,
            confidenceScore: item.confidenceScore, agentUpdatedAt: new Date(),
          },
        });
        await prisma.agentReviewQueue.update({ where: { id }, data: { status: "APPROVED" } });
        results.push({ id, status: "APPROVED" });
      } else if (action === "reject") {
        await prisma.agentReviewQueue.update({
          where: { id },
          data: { status: "REJECTED", auditLog: JSON.stringify([...JSON.parse(String(item.auditLog || "[]")), { action: "REJECTED", operator: "admin", timestamp: new Date().toISOString(), reason: rejectReason || "批量驳回" }]) },
        });
        results.push({ id, status: "REJECTED" });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
