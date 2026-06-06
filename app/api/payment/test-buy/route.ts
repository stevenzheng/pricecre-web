/**
 * POST /api/payment/test-buy
 *
 * 测试模式购买 — 模拟微信/支付宝支付成功
 * 直接创建订单 + 增加额度 + 写审计日志
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, product, amount, paymentMethod } = body;

    if (!email) {
      return NextResponse.json({ error: "请先登录" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const isMonthly = product === "monthly";
    const payAmount = amount || 99;
    const creditsAdded = isMonthly ? 9999 : 50; // monthly = effectively unlimited
    const productType = "view_quota";
    const productName = isMonthly ? "不限次包月" : "查看额度 × 50 次";
    const orderNo = `PAY${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const method = paymentMethod || "wechat";

    // 创建订单 + 增加额度（事务）
    const result = await prisma.$transaction(async (tx) => {
      // 1. 创建订单
      const order = await tx.order.create({
        data: {
          orderNo,
          userId: user.id,
          productType: 1,
          amount: payAmount,
          paymentMethod: method,
          status: 1, // 已支付
          paidAt: new Date(),
          tradeNo: `TEST_${orderNo}`,
          note: `${method === "wechat" ? "微信" : "支付宝"} 测试支付 · ${productName}`,
          items: {
            create: [{
              productType,
              productName,
              quantity: 1,
              unitPrice: payAmount,
              totalPrice: payAmount,
              creditsAdded,
            }],
          },
        },
      });

      // 2. 增加额度到 UserCredit
      let uc = await tx.userCredit.findUnique({ where: { email } });
      if (!uc) {
        const u = await tx.user.findUnique({ where: { email }, select: { referralViewCount: true } });
        uc = await tx.userCredit.create({
          data: { email, referralCredits: u?.referralViewCount ?? 10, purchasedCredits: 0, totalUsed: 0 },
        });
      }
      await tx.userCredit.update({
        where: { email },
        data: { purchasedCredits: { increment: creditsAdded } },
      });

      // 3. 写审计日志
      await tx.creditAuditLog.create({
        data: {
          email,
          type: "add_credits",
          amount: creditsAdded,
          balance: uc.referralCredits + uc.purchasedCredits + creditsAdded,
          note: `购买 ${productName} (${method})`,
        },
      });

      return order;
    });

    // 模拟支付处理延迟
    await new Promise((r) => setTimeout(r, 500));

    return NextResponse.json({
      success: true,
      orderNo: result.orderNo,
      orderId: result.id,
      amount: payAmount,
      creditsAdded,
      paymentMethod: method,
      message: isMonthly
        ? "不限次包月已开通 · 30 天有效"
        : `50 次查看额度已到账 · 永久有效`,
      paidAt: result.paidAt,
    });
  } catch (err: any) {
    console.error("Test payment error:", err);
    return NextResponse.json({ error: err.message || "支付处理失败" }, { status: 500 });
  }
}
