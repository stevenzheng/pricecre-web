// POST /api/auth/forgot-password — Send reset code to email
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json().catch(() => ({}));
    if (!email) return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });

    // Check user exists
    let user;
    try { user = await prisma.user.findUnique({ where: { email } }); } catch { return NextResponse.json({ error: "系统繁忙" }, { status: 500 }); }
    if (!user) return NextResponse.json({ success: true }); // Don't reveal user existence

    // Generate 6-digit code, valid 10 minutes
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.verificationCode.create({
      data: {
        key: `reset:${email}`,
        value: code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    // TODO: send email in production
    console.log(`[Reset Password] Code for ${email}: ${code}`);

    return NextResponse.json({ success: true, message: "如果该邮箱已注册，重置验证码已发送" });
  } catch {
    return NextResponse.json({ success: true });
  }
}
