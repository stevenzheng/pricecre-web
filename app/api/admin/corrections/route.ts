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

    // 联查资产主信息（数据库优先，mock 数据兜底），供审核页展示
    const propertyIds = Array.from(new Set(corrections.map((c) => c.propertyId)));
    const assetMap: Record<string, { projectName: string; city: string; district: string; propertyType: string }> = {};
    if (propertyIds.length > 0) {
      try {
        const dbProps = await prisma.commercialProperty.findMany({
          where: { id: { in: propertyIds } },
          select: { id: true, projectName: true, city: true, district: true, propertyType: true },
        });
        dbProps.forEach((p) => { assetMap[p.id] = { projectName: p.projectName, city: p.city, district: p.district, propertyType: p.propertyType }; });
      } catch {}
      try {
        const missing = propertyIds.filter((id) => !assetMap[id]);
        if (missing.length > 0) {
          const m = await import("@/lib/mock-data");
          for (const id of missing) {
            const p = (m.mockProperties as any[]).find((x) => x.id === id);
            if (p) assetMap[id] = { projectName: p.projectName, city: p.city, district: p.district, propertyType: String(p.propertyType) };
          }
        }
      } catch {}
    }

    const enriched = corrections.map((c) => ({ ...c, asset: assetMap[c.propertyId] || null }));
    return NextResponse.json({ corrections: enriched });
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

      // 1) 将新值落到资产数据（数据库中存在该资产时）
      try {
        const prop = await prisma.commercialProperty.findUnique({ where: { id: correction.propertyId } });
        if (prop) {
          const num = parseFloat(correction.newValue);
          const val = isNaN(num) ? correction.newValue : num;
          if (correction.fieldKey === "faceRent") {
            await prisma.commercialProperty.update({ where: { id: prop.id }, data: { faceRent: isNaN(num) ? prop.faceRent : num, agentUpdatedAt: new Date() } });
          } else {
            const indicators = { ...((prop.dynamicIndicators as any) || {}), [correction.fieldKey]: val };
            await prisma.commercialProperty.update({ where: { id: prop.id }, data: { dynamicIndicators: indicators, agentUpdatedAt: new Date() } });
          }
        }
      } catch {}

      // 2) 兑现「审核通过奖励额度」承诺：提交人 +2 次查看额度
      try {
        if (correction.submittedBy) {
          const email = correction.submittedBy;
          const uc = await prisma.userCredit.upsert({
            where: { email },
            update: { referralCredits: { increment: 2 } },
            create: { email, referralCredits: 12, purchasedCredits: 0 },
          });
          await prisma.creditAuditLog.create({
            data: {
              email, type: "add_credits", amount: 2,
              balance: (uc.referralCredits || 0) + (uc.purchasedCredits || 0),
              adminEmail: reviewedBy || "admin",
              note: `纠错审核通过奖励 · ${correction.fieldLabel || correction.fieldKey}`,
            },
          });
        }
      } catch {}
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
