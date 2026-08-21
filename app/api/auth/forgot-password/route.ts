// POST /api/auth/forgot-password — Send reset code to email
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}));
    const email = String(raw.email || "").toLowerCase(); // 小写归一化，验证码 key 与用户查询一致
    if (!email) return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });

    // Check user exists（大小写不敏感，兼容历史大写邮箱）
    let user;
    try { user = await prisma.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } }); } catch { return NextResponse.json({ error: "系统繁忙" }, { status: 500 }); }
    if (!user) return NextResponse.json({ success: true, message: "如果该邮箱已注册，重置验证码已发送" }); // Don't reveal user existence

    // Generate 6-digit code, valid 10 minutes
    // upsert：key 唯一，重复请求时覆盖旧码（原 create 第二次必然 P2002 失败）
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.verificationCode.upsert({
      where: { key: `reset:${email}` },
      update: { value: code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
      create: { key: `reset:${email}`, value: code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    // 发送重置邮件（原实现只 console.log，用户永远收不到验证码）
    await sendEmail({
      to: email,
      subject: "PriceCRE 密码重置验证码",
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8F9FA;padding:40px 0">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #E5E7EB">
<div style="font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:8px">PriceCRE · 地产价值</div>
<div style="font-size:12px;color:#9CA3AF;margin-bottom:28px;letter-spacing:0.1em">PASSWORD RESET</div>
<p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:24px">您正在重置 PriceCRE 账户密码，请使用以下验证码：</p>
<div style="text-align:center;margin-bottom:28px">
<span style="display:inline-block;padding:12px 32px;background:#2563EB;color:#fff;font-size:28px;font-weight:700;letter-spacing:0.2em;border-radius:12px;font-family:monospace">${code}</span>
</div>
<p style="font-size:13px;color:#9CA3AF;line-height:1.6">验证码 10 分钟内有效。如非本人操作，请忽略此邮件，您的密码不会被更改。</p>
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF">&copy; 2026 PriceCRE</div>
</div></body></html>`,
    });

    return NextResponse.json({ success: true, message: "如果该邮箱已注册，重置验证码已发送" });
  } catch {
    return NextResponse.json({ success: true, message: "如果该邮箱已注册，重置验证码已发送" });
  }
}
