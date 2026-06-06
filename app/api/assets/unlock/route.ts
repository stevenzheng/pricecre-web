// app/api/assets/unlock/route.ts — 资产解锁（需登录 + 扣额度）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city, userId, email } = await request.json();
    if (!propertyId) return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });

    // Find property
    let property = await prisma.commercialProperty.findUnique({ where: { id: propertyId } });
    if (!property && projectName && city) {
      property = await prisma.commercialProperty.findFirst({ where: { projectName, city }, orderBy: { updatedAt: "desc" } });
    }
    if (!property) return NextResponse.json({ error: "资产不存在" }, { status: 404 });

    // Require login
    let dbUser = null;
    if (userId) dbUser = await prisma.user.findUnique({ where: { id: userId } });
    else if (email) dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser || !dbUser.email) {
      return NextResponse.json({ error: "请先登录以解锁资产数据" }, { status: 401 });
    }

    // Source of Truth: UserCredit
    let uc = await prisma.userCredit.findUnique({ where: { email: dbUser.email } });
    if (!uc) {
      uc = await prisma.userCredit.create({
        data: { email: dbUser.email, referralCredits: dbUser.referralViewCount ?? 10, purchasedCredits: dbUser.purchasedViewCount ?? 0, totalUsed: 0 },
      });
    }

    const totalCredits = uc.referralCredits + uc.purchasedCredits;
    if (totalCredits <= 0) {
      return NextResponse.json({ error: "额度不足，请购买或邀请好友获取", remainingCredits: 0 }, { status: 402 });
    }

    // Deduct
    await prisma.$transaction(async (tx) => {
      if (uc!.referralCredits > 0) {
        await tx.userCredit.update({ where: { email: dbUser!.email! }, data: { referralCredits: { decrement: 1 }, totalUsed: { increment: 1 } } });
        await tx.user.update({ where: { id: dbUser!.id }, data: { referralViewCount: { decrement: 1 } } });
      } else {
        await tx.userCredit.update({ where: { email: dbUser!.email! }, data: { purchasedCredits: { decrement: 1 }, totalUsed: { increment: 1 } } });
        await tx.user.update({ where: { id: dbUser!.id }, data: { purchasedViewCount: { decrement: 1 } } });
      }
      await tx.creditAuditLog.create({
        data: { email: dbUser!.email!, type: "consume_view", amount: -1, balance: (uc!.referralCredits + uc!.purchasedCredits - 1), note: `解锁: ${property!.projectName || propertyId}` },
      });
      await tx.userViewLog.upsert({
        where: { userId_propertyId: { userId: dbUser!.id, propertyId: property!.id } },
        create: { userId: dbUser!.id, propertyId: property!.id },
        update: { viewedAt: new Date() },
      });
    });

    const updated = await prisma.userCredit.findUnique({ where: { email: dbUser.email } });
    const remainingCredits = (updated?.referralCredits ?? 0) + (updated?.purchasedCredits ?? 0);

    return NextResponse.json({
      unlocked: true,
      remainingCredits,
      property: {
        id: property.id, projectName: property.projectName, city: property.city, district: property.district,
        faceRent: property.faceRent, propertyType: property.propertyType,
        dynamicIndicators: property.dynamicIndicators,
      },
    });
  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
