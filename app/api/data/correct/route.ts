/**
 * POST /api/data/correct
 * 用户提交精算字段纠错 → 写入 FieldCorrection 表，待管理员审核
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { propertyId, fieldKey, fieldLabel, newValue, reason } = body;

    if (!propertyId || !fieldKey) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    // Get current value for audit trail
    let oldValue = "";
    try {
      const m = await import("@/lib/mock-data");
      const p = m.mockProperties.find((x: any) => x.id === propertyId);
      if (p) {
        const indicators = p.dynamicIndicators || {};
        oldValue = String(indicators[fieldKey] ?? p[fieldKey as keyof typeof p] ?? "");
      }
    } catch {}

    const submittedBy = session?.user?.email || body.email || "anonymous";

    const correction = await prisma.fieldCorrection.create({
      data: {
        propertyId,
        fieldKey,
        fieldLabel: fieldLabel || fieldKey,
        oldValue,
        newValue: String(newValue),
        reason: reason || "",
        submittedBy,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, id: correction.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
