/**
 * POST /api/data/redeem
 *
 * 验证激活码 → 确认后增加互享额度到 UserCredit
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function generateAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  const hash = createHash("sha256").update(`${email}:${secret}:activate`).digest("hex");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length;
    code += chars[idx];
  }
  return code;
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

    const expectedCode = generateAuthCode(email);
    if (code.toUpperCase() !== expectedCode) {
      return NextResponse.json({ error: "激活码无效或与注册邮箱不匹配" }, { status: 400 });
    }

    // 兑换码已验证成功 → 增加互享额度（referralCredits）
    let uc = await prisma.userCredit.findUnique({ where: { email } });
    if (!uc) {
      // Migrate from legacy or create new
      const user = await prisma.user.findUnique({ where: { email }, select: { referralViewCount: true } });
      uc = await prisma.userCredit.create({
        data: { email, referralCredits: (user?.referralViewCount ?? 10) + 8, purchasedCredits: 0, totalUsed: 0 },
      });
    } else {
      await prisma.userCredit.update({
        where: { email },
        data: { referralCredits: { increment: 8 } },
      });
    }

    // Audit log
    await prisma.creditAuditLog.create({
      data: {
        email,
        type: "add_credits",
        amount: 8,
        balance: (uc.referralCredits || 0) + (uc.purchasedCredits || 0) + 8,
        note: `激活码兑换: ${code.toUpperCase()} · 互享额度+8`,
      },
    });

    return NextResponse.json({
      success: true,
      credits: 8,
      message: "8 次查看额度已到账",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "兑换失败" }, { status: 500 });
  }
}
