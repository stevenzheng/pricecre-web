// POST /api/auth/reset-password — Verify code + set new password
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase(); // 小写归一化，与 forgot-password 的验证码 key 一致
    const code = body.code;
    const password = body.password;
    if (!email || !code || !password) return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "密码至少6位" }, { status: 400 });

    // 大小写不敏感定位用户（兼容历史大写邮箱），再按 id 更新，避免 where:{email} 唯一查询的大小写敏感问题
    const target = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!target) return NextResponse.json({ error: "账号不存在" }, { status: 400 });

    // Verify code（key 使用小写邮箱）
    let vc;
    try {
      vc = await prisma.verificationCode.findFirst({
        where: { key: `reset:${email}`, value: code, expiresAt: { gt: new Date() } },
      });
    } catch { return NextResponse.json({ error: "系统繁忙" }, { status: 500 }); }
    if (!vc) return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });

    // Update password
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: target.id }, data: { password: hashed } });

    // Delete used code
    await prisma.verificationCode.delete({ where: { id: vc.id } });

    return NextResponse.json({ success: true, message: "密码已重置，请重新登录" });
  } catch (err: any) {
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
