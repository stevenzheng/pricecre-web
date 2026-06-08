// GET /api/admin/audit-log?type=redeem — Query audit logs by type
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "";
  try {
    const where: any = {};
    if (type === "redeem") where.note = { contains: "激活码" };
    const logs = await prisma.creditAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
