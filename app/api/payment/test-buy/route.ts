/**
 * POST /api/payment/test-buy
 *
 * 测试模式购买 API — 无需真实支付，直接模拟成功
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { product, amount } = await req.json();

    const orderNo = `TEST-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // 模拟 1 秒处理延迟
    await new Promise((r) => setTimeout(r, 800));

    return NextResponse.json({
      success: true,
      orderNo,
      code,
      amount: amount || 99,
      quota: product === "monthly" ? -1 : 50, // -1 = unlimited
      message: product === "monthly"
        ? "不限次包月已开通 · 30 天有效"
        : "50 次查看额度已到账 · 永久有效",
      paidAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: "支付处理失败" }, { status: 500 });
  }
}
