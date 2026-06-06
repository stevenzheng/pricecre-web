/**
 * POST /api/auth/verify
 *
 * 验证邮箱验证码 → 创建用户 → 处理裂变奖励
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/lib/codeStore";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";



export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const isValid = verifyCode(email, code);
    if (!isValid) {
      return NextResponse.json({ error: "验证码错误或已过期" }, { status: 400 });
    }

    // Check for referral code
    const { getReferral } = await import("@/lib/codeStore");
    const referralCode = getReferral(email);

    // Create user in Supabase
    const userData: any = {
      email,
      password: password ? await bcrypt.hash(password, 10) : null,
      myReferralCode: generateReferralCode(),
      referralViewCount: 3, // base credits
    };

    const user = await prisma.user.create({ data: userData });

    // Handle referral reward if applicable
    let referralBonus = 0;
    if (referralCode) {
      const referrer = await prisma.user.findFirst({
        where: { myReferralCode: referralCode },
      });

      if (referrer && referrer.id !== user.id) {
        // Reward both parties: +3 credits each
        await prisma.$transaction([
          prisma.user.update({
            where: { id: referrer.id },
            data: {
              referralViewCount: { increment: 3 },
              lifetimeReferralEarned: { increment: 3 },
            },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { referralViewCount: { increment: 3 } },
          }),
          prisma.referral.create({
            data: {
              referrerId: referrer.id,
              refereeId: user.id,
              rewardGranted: true,
            },
          }),
        ]);
        referralBonus = 3;
      }
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
