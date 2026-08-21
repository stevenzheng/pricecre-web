/**
 * POST /api/auth/verify
 *
 * 验证邮箱验证码 → 创建用户 → 处理裂变奖励
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generateCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "pricecre-dev-2026";
  const window = Math.floor(Date.now() / (10 * 60 * 1000));
  const hash = require("crypto").createHash("md5").update(`${email}:${secret}:${window}`).digest("hex");
  const chars = "0123456789";
  let c = "";
  for (let i = 0; i < 6; i++) {
    c += chars[parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length];
  }
  return c;
}

function verifyCodeStr(email: string, input: string): boolean {
  const secret = process.env.NEXTAUTH_SECRET || "pricecre-dev-2026";
  // Check current and previous 10-min window (clock skew)
  const now = Math.floor(Date.now() / (10 * 60 * 1000));
  for (const window of [now, now - 1]) {
    const hash = require("crypto").createHash("md5").update(`${email}:${secret}:${window}`).digest("hex");
    const chars = "0123456789";
    let c = "";
    for (let i = 0; i < 6; i++) {
      c += chars[parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length];
    }
    if (c === input) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // 邮箱统一转小写：覆盖验证码校验、User/UserCredit/UserChatToken 存储，避免大小写敏感
    const email = String(body.email || "").toLowerCase();
    const code = body.code;
    const password = body.password;

    if (!email || !code) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const isValid = verifyCodeStr(email, code);
    if (!isValid) {
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
    }

    // Referral code from request body
    const referralCode = req.nextUrl?.searchParams?.get("ref") || "";

    // Create user in Supabase — handle gracefully
    const hashedPw = password ? await bcrypt.hash(password, 10).catch(() => null) : null;
    const userData: any = {
      email,
      password: hashedPw,
      myReferralCode: generateReferralCode(),
      referralViewCount: 3,
    };

    let user;
    try {
      user = await prisma.user.create({ data: userData });
    } catch (e: any) {
      if (e?.code === "P2002") {
        return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
      }
      return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
    }

    // 注册福利落库：3 次解锁资产额度 + 20 次 AI 对话额度（与注册邮件中宣传一致）
    try {
      await prisma.userCredit.upsert({
        where: { email },
        update: {},
        create: { email, referralCredits: 3, purchasedCredits: 0, totalUsed: 0 },
      });
      await prisma.userChatToken.upsert({
        where: { email },
        update: {},
        create: { email, tokens: 20, totalUsed: 0 },
      });
    } catch {} // 额度初始化失败不阻断注册（unlock/chat 接口有兜底创建）

    // Handle referral reward if applicable (non-blocking)
    let referralBonus = 0;
    if (referralCode) {
      try {
        const referrer = await prisma.user.findFirst({ where: { myReferralCode: referralCode } });
        if (referrer && referrer.id !== user.id) {
          await prisma.$transaction([
            prisma.user.update({ where: { id: referrer.id }, data: { referralViewCount: { increment: 3 }, lifetimeReferralEarned: { increment: 3 } } }),
            prisma.user.update({ where: { id: user.id }, data: { referralViewCount: { increment: 3 } } }),
            prisma.referral.create({ data: { referrerId: referrer.id, refereeId: user.id, rewardGranted: true } }),
          ]);
          // 双方各 +3 真实查看额度（UserCredit 才是 unlock 实际扣减的表）
          await prisma.userCredit.upsert({ where: { email }, update: { referralCredits: { increment: 3 } }, create: { email, referralCredits: 6 } }).catch(() => {});
          if (referrer.email) {
            await prisma.userCredit.upsert({ where: { email: referrer.email }, update: { referralCredits: { increment: 3 } }, create: { email: referrer.email, referralCredits: 13 } }).catch(() => {});
          }
          referralBonus = 3;
        }
      } catch {} // referral failure shouldn't block registration
    }

    return NextResponse.json({
      success: true,
      message: "邮箱验证成功",
      token: `pk_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      referralCode: user.myReferralCode,
      referralBonus,
      totalCredits: userData.referralViewCount + referralBonus,
    });
  } catch (err: unknown) {
    console.error("[Verify Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
