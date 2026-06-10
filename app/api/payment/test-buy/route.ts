// POST /api/payment/test-buy — 模拟支付通道（未接入真实支付网关前的直通车）
// 创建已支付订单 + 发放对应额度 + 审计日志，订单在前台「我的订单」与后台订单管理可见
// body: { email, product: "single" | "monthly" | "ai-chat-100", amount, paymentMethod }
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PRODUCTS: Record<string, { name: string; amount: number; productType: number; credits: number; kind: "view" | "chat" }> = {
  "single":      { name: "查看权益×50次", amount: 99,  productType: 1, credits: 50,  kind: "view" },
  "monthly":     { name: "不限次包月",     amount: 299, productType: 3, credits: 999, kind: "view" },
  "ai-chat-100": { name: "AI对话×100条",  amount: 10,  productType: 2, credits: 100, kind: "chat" },
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const product = PRODUCTS[body.product];
    if (!product) return NextResponse.json({ error: "未知商品" }, { status: 400 });

    // 优先用登录态邮箱，防止替他人下单
    const session = await getServerSession(authOptions).catch(() => null);
    const email = session?.user?.email || body.email;
    if (!email) return NextResponse.json({ error: "请先登录" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "用户不存在，请重新登录" }, { status: 400 });

    const paymentMethod = body.paymentMethod === "alipay" ? "alipay" : "wechat";
    const orderNo = `PRC${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const now = new Date();

    // 1) 订单（状态=已支付）
    await prisma.order.create({
      data: {
        orderNo,
        userId: user.id,
        productType: product.productType,
        amount: product.amount,
        paymentMethod,
        status: 1,
        paidAt: now,
        note: "模拟支付通道",
        items: {
          create: [{
            productType: product.kind === "chat" ? "chat_quota" : "view_quota",
            productName: product.name,
            quantity: 1,
            unitPrice: product.amount,
            totalPrice: product.amount,
            creditsAdded: product.credits,
          }],
        },
      },
    });

    // 2) 发放额度
    let balance = 0;
    if (product.kind === "chat") {
      const tk = await prisma.userChatToken.upsert({
        where: { email },
        update: { tokens: { increment: product.credits } },
        create: { email, tokens: 100 + product.credits },
      });
      balance = tk.tokens;
    } else {
      const uc = await prisma.userCredit.upsert({
        where: { email },
        update: { purchasedCredits: { increment: product.credits } },
        create: { email, referralCredits: 10, purchasedCredits: product.credits },
      });
      balance = (uc.referralCredits || 0) + (uc.purchasedCredits || 0);
    }

    // 3) 审计日志
    await prisma.creditAuditLog.create({
      data: {
        email,
        type: product.kind === "chat" ? "add_tokens" : "add_credits",
        amount: product.credits,
        balance,
        note: `购买 ${product.name} · 订单 ${orderNo} · ${paymentMethod}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, orderNo, credits: product.credits, product: product.name });
  } catch (err: any) {
    return NextResponse.json({ error: "支付处理失败：" + (err.message || "").slice(0, 100) }, { status: 500 });
  }
}
