/**
 * POST /api/auth/verify
 *
 * 验证邮箱验证码
 */

import { NextRequest, NextResponse } from "next/server";

// 与 register 共享的内存存储
const codeStore = new Map<string, { code: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const stored = codeStore.get(email);
    if (!stored) {
      return NextResponse.json({ error: "请先发送验证码" }, { status: 400 });
    }

    if (Date.now() > stored.expires) {
      codeStore.delete(email);
      return NextResponse.json({ error: "验证码已过期，请重新获取" }, { status: 400 });
    }

    if (stored.code !== code) {
      return NextResponse.json({ error: "验证码错误" }, { status: 400 });
    }

    // 验证成功，清理
    codeStore.delete(email);

    return NextResponse.json({
      success: true,
      message: "邮箱验证成功",
      token: `pk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    });
  } catch (err) {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
