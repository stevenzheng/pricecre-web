// GET /api/property/[id]/corrections — 获取某资产所有纠错记录
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const corrections = await prisma.fieldCorrection.findMany({
      where: { propertyId: params.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return NextResponse.json({ corrections });
  } catch {
    return NextResponse.json({ corrections: [] });
  }
}
