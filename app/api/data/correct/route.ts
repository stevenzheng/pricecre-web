/**
 * POST /api/data/correct
 * 用户提交精算字段纠错 → 写入 FieldCorrection 表，供后台 /admin/corrections 审核
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { propertyId, fieldKey, fieldLabel, oldValue, newValue, reason, email } = body;

    if (!propertyId || !fieldKey) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    if (!newValue && newValue !== 0) {
      return NextResponse.json({ error: "请输入新估值" }, { status: 400 });
    }

    // 持久化到数据库（失败也不让用户感知失败，但记录日志）
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.fieldCorrection.create({
        data: {
          propertyId: String(propertyId),
          fieldKey: String(fieldKey),
          fieldLabel: fieldLabel ? String(fieldLabel) : null,
          oldValue: oldValue !== undefined && oldValue !== null ? String(oldValue) : "—",
          newValue: String(newValue),
          reason: reason ? String(reason) : null,
          submittedBy: email ? String(email) : null,
          status: "PENDING",
        },
      });
    } catch (e: any) {
      console.error("[Correction] DB write failed:", e?.message);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Never fail the user
  }
}
