// app/api/admin/orders/route.ts — 订单管理 API（电商后台核心）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const statusLabels: Record<number, string> = {
  0: "待支付", 1: "已支付", 2: "已取消", 3: "已退款", 4: "退款中", 5: "已完成",
};
const productTypeLabels: Record<number, string> = {
  1: "查看额度", 2: "AI 对话额度", 3: "VIP 会员",
};

// GET — 订单列表（支持分页、搜索、状态筛选）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status"); // 逗号分隔多状态
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      const statuses = status.split(",").map(Number).filter(n => !isNaN(n));
      if (statuses.length > 0) where.status = { in: statuses };
    }
    if (search) {
      where.OR = [
        { orderNo: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { tradeNo: { contains: search, mode: "insensitive" } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const list = orders.map(o => ({
      id: o.id,
      orderNo: o.orderNo,
      userEmail: o.user.email,
      productType: o.productType,
      productTypeLabel: productTypeLabels[o.productType] || "未知",
      amount: Number(o.amount),
      paymentMethod: o.paymentMethod,
      status: o.status,
      statusLabel: statusLabels[o.status] || "未知",
      tradeNo: o.tradeNo,
      paidAt: o.paidAt,
      cancelledAt: o.cancelledAt,
      refundReason: o.refundReason,
      refundAmount: o.refundAmount ? Number(o.refundAmount) : null,
      refundedAt: o.refundedAt,
      note: o.note,
      items: o.items.map(i => ({
        id: i.id,
        productType: i.productType,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
        creditsAdded: i.creditsAdded,
      })),
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return NextResponse.json({ orders: list, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — 手动创建订单（管理员赠送额度等场景）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, productType, amount, paymentMethod, items, note } = body;

    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "用户不存在" }, { status: 404 });

    const orderNo = `ORD${Date.now()}${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNo,
        userId: user.id,
        productType: productType || 1,
        amount: amount || 0,
        paymentMethod: paymentMethod || "admin_manual",
        status: 1, // 管理员手动创建直接设为已支付
        paidAt: new Date(),
        note: note || "管理员手动创建",
        items: items ? {
          create: items.map((item: any) => ({
            productType: item.productType || "view_quota",
            productName: item.productName || "查看额度",
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            creditsAdded: item.creditsAdded || 0,
          })),
        } : undefined,
      },
      include: { items: true, user: { select: { email: true } } },
    });

    // 将额度实际添加到用户账户
    if (items) {
      for (const item of items) {
        const credits = item.creditsAdded || 0;
        if (credits <= 0) continue;

        if (item.productType === "chat_quota") {
          // 添加到 AI 对话额度
          let token = await prisma.userChatToken.findUnique({ where: { email } });
          if (!token) {
            token = await prisma.userChatToken.create({ data: { email, tokens: 100, totalUsed: 0 } });
          }
          await prisma.userChatToken.update({ where: { email }, data: { tokens: { increment: credits } } });
          await prisma.creditAuditLog.create({
            data: { email, type: "add_tokens", amount: credits, balance: token.tokens + credits, adminEmail: "admin", note: `订单 ${orderNo} 赠送` },
          });
        } else {
          // 添加到查看额度 (purchasedCredits)
          let uc = await prisma.userCredit.findUnique({ where: { email } });
          if (!uc) {
            const user = await prisma.user.findUnique({ where: { email }, select: { referralViewCount: true } });
            uc = await prisma.userCredit.create({ data: { email, referralCredits: user?.referralViewCount ?? 10, purchasedCredits: 0 } });
          }
          await prisma.userCredit.update({ where: { email }, data: { purchasedCredits: { increment: credits } } });
          await prisma.creditAuditLog.create({
            data: { email, type: "add_credits", amount: credits, balance: uc.referralCredits + uc.purchasedCredits + credits, adminEmail: "admin", note: `订单 ${orderNo} 赠送` },
          });
        }
      }
    }

    return NextResponse.json({ order: { ...order, amount: Number(order.amount) }, msg: "订单已创建，额度已到账" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
