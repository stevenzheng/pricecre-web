/**
 * POST /api/data/redeem
 *
 * 兑换激活码：查 VerificationCode（key = redeem:码），校验邮箱归属与有效期，
 * 按生成时指定的类型发放，兑换即销码（单次使用）。
 *   view*   → UserCredit（查看额度）
 *   monthly → UserCredit +999（包月近似实现）
 *   ai200   → UserChatToken（AI 对话额度）
 * 兼容旧版确定性码（邮箱哈希），旧码 +8 次查看额度。
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function legacyAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  const hash = createHash("sha256").update(`${email}:${secret}:activate`).digest("hex");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length];
  return code;
}

async function grant(email: string, codeType: string, amount: number): Promise<{ message: string; balance: number }> {
  if (codeType === "ai200") {
    const tk = await prisma.userChatToken.upsert({
      where: { email },
      update: { tokens: { increment: amount } },
      create: { email, tokens: 100 + amount },
    });
    return { message: `${amount} 条 AI 对话额度已到账`, balance: tk.tokens };
  }
  const uc = await prisma.userCredit.upsert({
    where: { email },
    update: { referralCredits: { increment: amount } },
    create: { email, referralCredits: 10 + amount, purchasedCredits: 0, totalUsed: 0 },
  });
  const balance = (uc.referralCredits || 0) + (uc.purchasedCredits || 0);
  return {
    message: codeType === "monthly" ? "包月权益已开通（不限次查看）" : `${amount} 次查看额度已到账`,
    balance,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "无效的激活码，请输入6位字母数字码" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "请先登录以兑换激活码" }, { status: 400 });
    }

    const upperCode = code.toUpperCase();

    // ── 新版：随机唯一码（VerificationCode 表） ──
    const record = await prisma.verificationCode.findUnique({
      where: { key: `redeem:${upperCode}` },
    }).catch(() => null);

    if (record) {
      let meta: any = {};
      try { meta = JSON.parse(record.value); } catch {}

      if (meta.email && meta.email !== email) {
        return NextResponse.json({ error: "该激活码与当前登录邮箱不匹配" }, { status: 400 });
      }
      if (record.expiresAt && record.expiresAt < new Date()) {
        return NextResponse.json({ error: "激活码已过期" }, { status: 400 });
      }

      const codeType = meta.type || "view";
      const amount = Number(meta.credits) || 8;
      const { message, balance } = await grant(email, codeType, amount);

      // 销码（单次使用）+ 审计
      await prisma.verificationCode.delete({ where: { key: `redeem:${upperCode}` } }).catch(() => {});
      await prisma.creditAuditLog.create({
        data: { email, type: "redeem_code", amount, balance, note: `CODE:${upperCode}|TYPE:${codeType}|激活码兑换成功` },
      }).catch(() => {});

      return NextResponse.json({ success: true, credits: amount, message });
    }

    // ── 旧版兼容：确定性邮箱哈希码（+8 查看额度，每码限兑一次） ──
    if (upperCode === legacyAuthCode(email)) {
      const already = await prisma.creditAuditLog.findFirst({
        where: { email, type: "redeem_code", note: { contains: `CODE:${upperCode}` } },
      }).catch(() => null);
      if (already) {
        return NextResponse.json({ error: "该激活码已兑换过" }, { status: 400 });
      }
      const { message, balance } = await grant(email, "view", 8);
      await prisma.creditAuditLog.create({
        data: { email, type: "redeem_code", amount: 8, balance, note: `CODE:${upperCode}|TYPE:legacy|激活码兑换成功` },
      }).catch(() => {});
      return NextResponse.json({ success: true, credits: 8, message });
    }

    return NextResponse.json({ error: "激活码无效或已被使用" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "兑换失败" }, { status: 500 });
  }
}
