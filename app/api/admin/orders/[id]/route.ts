// app/api/admin/orders/[id]/route.ts — 订单详情 + 退款/修改
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function writeAuditLog(email: string, type: string, amount: number, balance: number, note?: string) {
  await prisma.creditAuditLog.create({
    data: { email, type, amount, balance, adminEmail: "admin", note: note || null },
  });
}

// GET — 订单详情（支持 UUID 或 orderNo）
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { email: true } }, items: true },
    });
    if (!order) {
      order = await prisma.order.findFirst({
        where: { orderNo: id },
        include: { user: { select: { email: true } }, items: true },
      });
    }
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

    return NextResponse.json({
      ...order,
      amount: Number(order.amount),
      refundAmount: order.refundAmount ? Number(order.refundAmount) : null,
      userEmail: order.user.email,
      items: order.items.map(i => ({ ...i, unitPrice: Number(i.unitPrice), totalPrice: Number(i.totalPrice) })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — 修改订单状态（退款/取消/完成）
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, refundReason, refundAmount, note } = body;
    // action: "cancel" | "refund" | "complete" | "update_note"

    const order = await prisma.order.findUnique({
      where: { id },
      include: { user: { select: { email: true } }, items: true },
    });
    if (!order) return NextResponse.json({ error: "订单不存在" }, { status: 404 });

    const userEmail = order.user.email!;

    switch (action) {
      case "cancel": {
        if (![0].includes(order.status)) {
          return NextResponse.json({ error: "只能取消待支付的订单" }, { status: 400 });
        }
        await prisma.order.update({
          where: { id },
          data: { status: 2, cancelledAt: new Date(), note: note || order.note },
        });
        return NextResponse.json({ msg: "订单已取消" });
      }

      case "refund": {
        if (![1, 5].includes(order.status)) {
          return NextResponse.json({ error: "只能对已支付或已完成的订单发起退款" }, { status: 400 });
        }

        // 计算退款金额（默认全额）
        const refundAmt = refundAmount ? refundAmount : Number(order.amount);
        const refundReasonText = refundReason || "管理员退款";

        await prisma.order.update({
          where: { id },
          data: {
            status: 3,
            refundReason: refundReasonText,
            refundAmount: refundAmt,
            refundedAt: new Date(),
            note: note || order.note,
          },
        });

        // 退款后扣除对应额度（如果订单有 items 记录了 creditsAdded）
        for (const item of order.items) {
          if (!item.creditsAdded || item.creditsAdded <= 0) continue;

          if (item.productType === "chat_quota") {
            const token = await prisma.userChatToken.findUnique({ where: { email: userEmail } });
            if (token) {
              const newTokens = Math.max(0, token.tokens - item.creditsAdded);
              await prisma.userChatToken.update({ where: { email: userEmail }, data: { tokens: newTokens } });
              await writeAuditLog(userEmail, "set_tokens", -item.creditsAdded, newTokens, `退款扣除: ${refundReasonText}`);
            }
          } else {
            // view_quota 或 vip — 扣除 purchasedCredits
            const uc = await prisma.userCredit.findUnique({ where: { email: userEmail } });
            if (uc) {
              const newPurchased = Math.max(0, uc.purchasedCredits - item.creditsAdded);
              await prisma.userCredit.update({ where: { email: userEmail }, data: { purchasedCredits: newPurchased } });
              await writeAuditLog(userEmail, "set_credits", -item.creditsAdded, newPurchased + uc.referralCredits, `退款扣除: ${refundReasonText}`);
            }
          }
        }

        return NextResponse.json({ msg: "退款成功，额度已扣除" });
      }

      case "complete": {
        if (order.status !== 1) {
          return NextResponse.json({ error: "只能完成已支付的订单" }, { status: 400 });
        }
        await prisma.order.update({
          where: { id },
          data: { status: 5, completedAt: new Date() },
        });
        return NextResponse.json({ msg: "订单已完成" });
      }

      case "update_note": {
        await prisma.order.update({ where: { id }, data: { note } });
        return NextResponse.json({ msg: "备注已更新" });
      }

      default:
        return NextResponse.json({ error: "无效的操作" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
