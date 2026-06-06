// app/api/admin/user-detail/route.ts — 用户详情聚合 API（查看记录 / 订单 / 对话）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email") || "";
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    // 查看记录（已解锁资产）
    const viewLogs = await prisma.userViewLog.findMany({
      where: { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id || "" },
      orderBy: { viewedAt: "desc" },
      take: 50,
    });

    const viewCount = await prisma.userViewLog.count({
      where: { userId: (await prisma.user.findUnique({ where: { email }, select: { id: true } }))?.id || "" },
    });

    // 订单记录
    const orders = await prisma.order.findMany({
      where: { user: { email } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const paidOrders = orders.filter(o => [1, 5].includes(o.status));
    const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.amount), 0);

    // 对话记录
    const chatLogs = await prisma.creditAuditLog.findMany({
      where: { email, type: "consume_chat" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const totalConversations = await prisma.creditAuditLog.count({
      where: { email, type: "consume_chat" },
    });

    return NextResponse.json({
      viewLogs: viewLogs.map(v => ({ id: v.id, propertyId: v.propertyId, viewedAt: v.viewedAt })),
      viewCount,
      orders: orders.map(o => ({
        id: o.id, orderNo: o.orderNo, amount: Number(o.amount),
        productType: o.productType, status: o.status, paidAt: o.paidAt,
        tradeNo: o.tradeNo, createdAt: o.createdAt,
      })),
      orderCount: orders.length,
      paidOrderCount: paidOrders.length,
      totalSpent,
      chatLogs: chatLogs.map(c => ({ id: c.id, amount: c.amount, balance: c.balance, createdAt: c.createdAt, note: c.note })),
      totalConversations,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
