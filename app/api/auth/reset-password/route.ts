// POST /api/auth/reset-password — Verify code + set new password
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json().catch(() => ({}));
    if (!email || !code || !password) return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "密码至少6位" }, { status: 400 });

    // Verify code
    let vc;
    try {
      vc = await prisma.verificationCode.findFirst({
        where: { key: `reset:${email}`, value: code, expiresAt: { gt: new Date() } },
      });
    } catch { return NextResponse.json({ error: "系统繁忙" }, { status: 500 }); }
    if (!vc) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });

    // Update password
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { email }, data: { password: hashed } });

    // Delete used code
    await prisma.verificationCode.delete({ where: { id: vc.id } });

    return NextResponse.json({ success: true, message: "密码已重置，请重新登录" });
  } catch (err: any) {
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
