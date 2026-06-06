// app/api/assets/unlock/route.ts — 资产解锁（扣额度 → 返回指标数据）
// Source of truth: UserCredit (referralCredits + purchasedCredits)
// Legacy sync: also updates User.referralViewCount/purchasedViewCount for backward compat

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city, userId, email } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });
    }

    // Find property
    let property = await prisma.commercialProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property && projectName && city) {
      property = await prisma.commercialProperty.findFirst({
        where: { projectName, city },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!property) {
      return NextResponse.json({ error: "资产不存在" }, { status: 404 });
    }

    // Look up user
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      dbUser = await prisma.user.findUnique({ where: { email } });
    }

    let remainingCredits = 99;
    let unlocked = true;

    if (dbUser && dbUser.email) {
      // ── Source of Truth: UserCredit table ──
      let uc = await prisma.userCredit.findUnique({ where: { email: dbUser.email! } });
      if (!uc) {
        // First-time: migrate from legacy or default
        const referralVal = dbUser.referralViewCount ?? 10;
        const purchasedVal = dbUser.purchasedViewCount ?? 0;
        uc = await prisma.userCredit.create({
          data: { email: dbUser.email!, referralCredits: referralVal, purchasedCredits: purchasedVal, totalUsed: 0 },
        });
      }

      const totalCredits = uc.referralCredits + uc.purchasedCredits;
      if (totalCredits <= 0) {
        return NextResponse.json({ error: "额度不足", remainingCredits: 0 }, { status: 402 });
      }

      // Deduct: referral pool first, then purchased
      await prisma.$transaction(async (tx) => {
        // Update UserCredit
        if (uc!.referralCredits > 0) {
          await tx.userCredit.update({
            where: { email: dbUser!.email! },
            data: { referralCredits: { decrement: 1 }, totalUsed: { increment: 1 } },
          });
          // Sync legacy
          await tx.user.update({
            where: { id: dbUser!.id },
            data: { referralViewCount: { decrement: 1 } },
          });
        } else {
          await tx.userCredit.update({
            where: { email: dbUser!.email! },
            data: { purchasedCredits: { decrement: 1 }, totalUsed: { increment: 1 } },
          });
          // Sync legacy
          await tx.user.update({
            where: { id: dbUser!.id },
            data: { purchasedViewCount: { decrement: 1 } },
          });
        }

        // Audit log
        await tx.creditAuditLog.create({
          data: {
            email: dbUser!.email!,
            type: "consume_view",
            amount: -1,
            balance: (uc!.referralCredits + uc!.purchasedCredits - 1),
            note: `解锁资产: ${property!.projectName || propertyId}`,
          },
        });

        // Record unlock view
        await tx.userViewLog.upsert({
          where: { userId_propertyId: { userId: dbUser!.id, propertyId: property!.id } },
          create: { userId: dbUser!.id, propertyId: property!.id },
          update: { viewedAt: new Date() },
        });
      });

      const updatedUc = await prisma.userCredit.findUnique({ where: { email: dbUser.email! } });
      remainingCredits = (updatedUc?.referralCredits ?? 0) + (updatedUc?.purchasedCredits ?? 0);
      unlocked = true;
    }

    return NextResponse.json({
      unlocked,
      remainingCredits,
      property: {
        id: property.id,
        projectName: property.projectName,
        city: property.city,
        district: property.district,
        faceRent: property.faceRent,
        propertyType: property.propertyType,
        dynamicIndicators: unlocked ? property.dynamicIndicators : null,
      },
    });
  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
