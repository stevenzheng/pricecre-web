// POST /api/data/correct — 用户提报字段纠错
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { propertyId, fieldKey, fieldLabel, oldValue, newValue, reason, email } = await req.json();
    if (!propertyId || !fieldKey || !newValue) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
    }

    await prisma.fieldCorrection.create({
      data: {
        propertyId, fieldKey,
        fieldLabel: fieldLabel || fieldKey,
        oldValue: oldValue || "",
        newValue,
        reason: reason || "",
        submittedBy: email || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, message: "纠错申请已提交，审核通过后将更新数据" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
