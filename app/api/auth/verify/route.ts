/**
 * POST /api/auth/verify
 *
 * 验证邮箱验证码
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/codeStore";

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const isValid = verifyCode(email, code);
    if (!isValid) {
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "邮箱验证成功",
      token: `pk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    });
  } catch (_err) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
