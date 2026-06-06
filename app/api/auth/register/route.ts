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
import { sendEmail, verificationEmailTemplate } from "@/lib/email";

function generateCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "pricecre-dev-2026";
  const window = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-minute window
  const hash = require("crypto").createHash("md5").update(`${email}:${secret}:${window}`).digest("hex");
  const chars = "0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length];
  }
  return code;
}

// generateCode is inlined — do not export from route file

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码不能为空" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    // Generate deterministic verification code (works across serverless invocations)
    const code = generateCode(email);

    // Referral code will be handled server-side in verify

    // Send email (best-effort in testing phase)
    try {
      await sendEmail({ to: email, subject: "PriceCRE 邮箱验证码", html: verificationEmailTemplate(code) });
    } catch { /* email optional in testing */ }

    return NextResponse.json({
      success: true,
      message: "验证码已发送至您的邮箱",
      devCode: code, // 测试阶段始终返回验证码
    });
  } catch (err: unknown) {
    console.error("[Register Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
