/**
 * POST /api/assets/unlock
 * 使用 Next.js App Router 正确的 session 获取方式
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, projectName, city } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });
    }

    // App Router 正确获取 session 的方式
    // 注意：不能传 request 参数，直接调用即可
    const session = await getServerSession(authOptions);

    // 未登录严格拒绝
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const userId = session.user.id;

    // 查询或初始化用户额度
    let userCredit = await prisma.userCredit.findUnique({ where: { email } });
    if (!userCredit) {
      userCredit = await prisma.userCredit.create({
        data: { email, referralCredits: 10, purchasedCredits: 0 },
      });
    }

    const total = userCredit.referralCredits + userCredit.purchasedCredits;

    // 额度不足
    if (total <= 0) {
      return NextResponse.json(
        { error: "额度不足，请购买或邀请好友获取", requirePurchase: true },
        { status: 402 }
      );
    }

    // 检查是否已解锁（防重复扣费）
    if (userId) {
      const existing = await prisma.userViewLog.findUnique({
        where: { userId_propertyId: { userId, propertyId } },
      });
      if (existing) {
        const updated = await prisma.userCredit.findUnique({ where: { email } });
        return NextResponse.json({
          unlocked: true,
          alreadyUnlocked: true,
          remainingCredits: (updated?.referralCredits || 0) + (updated?.purchasedCredits || 0),
          property: { id: propertyId, projectName: projectName || "", city: city || "" },
        });
      }
    }

    // 扣费：优先扣推荐额度
    if (userCredit.referralCredits > 0) {
      await prisma.userCredit.update({
        where: { email },
        data: { referralCredits: { decrement: 1 }, totalUsed: { increment: 1 } },
      });
    } else {
      await prisma.userCredit.update({
        where: { email },
        data: { purchasedCredits: { decrement: 1 }, totalUsed: { increment: 1 } },
      });
    }

    // 记录解锁日志
    if (userId) {
      await prisma.userViewLog.create({
        data: { userId, propertyId },
      }).catch(() => {});
    }

    const updated = await prisma.userCredit.findUnique({ where: { email } });

    return NextResponse.json({
      unlocked: true,
      remainingCredits: (updated?.referralCredits || 0) + (updated?.purchasedCredits || 0),
      property: { id: propertyId, projectName: projectName || "", city: city || "" },
    });

  } catch (err: any) {
    console.error("[Unlock Error]", err.message);
    return NextResponse.json(
      { error: "服务器错误: " + (err.message || "").slice(0, 80) },
      { status: 500 }
    );
  }
}
