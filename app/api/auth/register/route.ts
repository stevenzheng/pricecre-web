/**
 * POST /api/auth/register
 *
 * 注册流程：
 * 1. 接收邮箱 + 密码
 * 2. 生成 6 位验证码
 * 3. 通过 Hostinger SMTP 发送验证邮件
 * 4. 返回 success + 验证码（开发模式）或仅 success
 */

import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateVerificationCode, verificationEmailTemplate } from "@/lib/email";

// 内存存储验证码（生产环境请用 Redis 或数据库）
const codeStore = new Map<string, { code: string; expires: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    // 生成验证码
    const code = generateVerificationCode();
    codeStore.set(email, { code, expires: Date.now() + 10 * 60 * 1000 });

    // 发送邮件
    const result = await sendEmail({
      to: email,
      subject: "PriceCRE 邮箱验证码",
      html: verificationEmailTemplate(code),
    });

    if (!result.success) {
      return NextResponse.json({ error: "邮件发送失败，请稍后重试" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "验证码已发送至您的邮箱",
      // 开发模式下返回验证码方便调试
      ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
    });
  } catch (err: unknown) {
    console.error("[Register Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
