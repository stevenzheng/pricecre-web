/**
 * POST /api/assets/unlock
 * 修复：未登录严格拒绝，不再伪造成功响应
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });
    }

    // ✅ 严格鉴权：只认 session，不接受 body.email
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;

    // ❌ 未登录：直接拒绝，不伪造成功
    if (!email) {
      return NextResponse.json(
        { error: "请先登录", requireLogin: true },
        { status: 401 }
      );
    }

    // 查询或初始化用户额度
    let userCredit = await prisma.userCredit.findUnique({ where: { email } });
    if (!userCredit) {
      userCredit = await prisma.userCredit.create({
        data: { email, referralCredits: 10, purchasedCredits: 0 },
      });
    }

    const total = userCredit.referralCredits + userCredit.purchasedCredits;

    // ❌ 额度不足：跳转购买
    if (total <= 0) {
      return NextResponse.json(
        { error: "额度不足，请购买或邀请好友获取", requirePurchase: true },
        { status: 402 }
      );
    }

    // ✅ 检查是否已解锁（防重复扣费）
    const existing = await prisma.userViewLog.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId,
        },
      },
    });

    if (existing) {
      // 已解锁过，不重复扣费
      const updated = await prisma.userCredit.findUnique({ where: { email } });
      return NextResponse.json({
        unlocked: true,
        alreadyUnlocked: true,
        remainingCredits:
          (updated?.referralCredits || 0) + (updated?.purchasedCredits || 0),
        property: { id: propertyId, projectName: projectName || "", city: city || "" },
      });
    }

    // ✅ 扣费：优先扣推荐额度
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

    // ✅ 记录解锁日志（修复：不再静默忽略错误 - Issue #2）
    try {
      await prisma.userViewLog.create({
        data: { userId: session.user.id, propertyId },
      });
    } catch (e: any) {
      // P2002 = 唯一约束冲突（重复解锁），这是预期行为
      if (e?.code !== 'P2002') {
        console.error('[Unlock] Failed to create view log:', e.message);
      }
      // 重复解锁时继续执行，不影响用户体验
    }

    const updated = await prisma.userCredit.findUnique({ where: { email } });

    return NextResponse.json({
      unlocked: true,
      remainingCredits:
        (updated?.referralCredits || 0) + (updated?.purchasedCredits || 0),
      property: {
        id: propertyId,
        projectName: projectName || "",
        city: city || "",
      },
    });
  } catch (err: any) {
    console.error("[Unlock Error]", err.message);
    return NextResponse.json(
      { error: "服务器错误: " + (err.message || "").slice(0, 80) },
      { status: 500 }
    );
  }
}
