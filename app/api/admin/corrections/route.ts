// GET/PUT /api/admin/corrections — 管理员审核字段纠错
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const where: any = {};
    if (status) where.status = status;

    const corrections = await prisma.fieldCorrection.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ corrections });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, action, reviewedBy } = await req.json();
    // action: "approve" | "reject"

    const correction = await prisma.fieldCorrection.findUnique({ where: { id } });
    if (!correction) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

    if (action === "approve") {
      await prisma.fieldCorrection.update({
        where: { id },
        data: { status: "APPROVED", reviewedBy: reviewedBy || "admin", reviewedAt: new Date() },
      });
      // Note: actual data update requires complex indicator handling; mark as approved for now
    } else if (action === "reject") {
      await prisma.fieldCorrection.update({
        where: { id },
        data: { status: "REJECTED", reviewedBy: reviewedBy || "admin", reviewedAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
