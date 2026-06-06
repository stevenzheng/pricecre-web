// app/api/admin/review-queue/[id]/action/route.ts
// POST { action: "approve" | "reject" } — 审核操作
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { action, rejectReason } = body;

    const item = await prisma.agentReviewQueue.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (action === "approve") {
      // Allow edited indicators from the request body (detail page edits before approving)
      const submittedIndicators = body.dynamicIndicators;
      const finalIndicators = submittedIndicators || item.dynamicIndicators;

      // Upsert into CommercialProperty (production table)
      await prisma.commercialProperty.upsert({
        where: {
          projectName_rawAddress: {
            projectName: item.projectName,
            rawAddress: item.rawAddress,
          },
        },
        create: {
          projectName: item.projectName,
          city: item.city,
          district: item.district,
          rawAddress: item.rawAddress,
          propertyType: item.propertyType,
          faceRent: item.faceRent,
          area: item.area,
          dataSource: item.dataSource,
          dynamicIndicators: finalIndicators as any,
          confidenceScore: item.confidenceScore,
          agentUpdatedAt: new Date(),
        },
        update: {
          faceRent: item.faceRent,
          area: item.area,
          dataSource: item.dataSource,
          dynamicIndicators: finalIndicators as any,
          confidenceScore: item.confidenceScore,
          agentUpdatedAt: new Date(),
        },
      });

      // Also update the review queue item with edited indicators
      if (submittedIndicators) {
        await prisma.agentReviewQueue.update({
          where: { id: params.id },
          data: { dynamicIndicators: submittedIndicators as any },
        });
      }

      // Update review queue status
      await prisma.agentReviewQueue.update({
        where: { id: params.id },
        data: { status: "APPROVED" },
      });

      return NextResponse.json({ success: true, action: "approved" });
    }

    if (action === "reject") {
      await prisma.agentReviewQueue.update({
        where: { id: params.id },
        data: {
          status: "REJECTED",
          auditLog: JSON.stringify([
            ...(typeof item.auditLog === "string" ? JSON.parse(item.auditLog) : []),
            {
              action: "REJECTED",
              operator: "admin",
              timestamp: new Date().toISOString(),
              reason: rejectReason || "未说明",
            },
          ]),
        },
      });
      return NextResponse.json({ success: true, action: "rejected" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
