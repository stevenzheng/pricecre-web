/**
 * POST /api/data/redeem
 *
 * 验证激活码 → 返回额度
 */
import { NextRequest, NextResponse } from "next/server";
import { redeemActivationCode } from "@/lib/codeStore";

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "无效的激活码" }, { status: 400 });
    }

    const credits = redeemActivationCode(code.toUpperCase());

    if (credits === null) {
      return NextResponse.json({ error: "激活码无效或已过期" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      credits,
      message: `${credits} 次查看额度已到账`,
    });
  } catch (err: unknown) {
    console.error("[Redeem Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "兑换失败" }, { status: 500 });
  }
}
