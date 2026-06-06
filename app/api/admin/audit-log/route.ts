// app/api/admin/audit-log/route.ts — Query audit logs
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "";
  const limit = Math.min(Number(searchParams.get("limit")) || 30, 100);

  if (!email) return NextResponse.json({ logs: [] });

  try {
    const logs = await prisma.creditAuditLog.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return NextResponse.json({ email, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, logs: [] }, { status: 500 });
  }
}
