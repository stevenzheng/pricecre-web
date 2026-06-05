/**
 * GET /api/admin/referrals — List all user referral codes and stats
 * POST /api/admin/referrals — Regenerate or modify referral codes
 */
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        myReferralCode: true,
        referralViewCount: true,
        purchasedViewCount: true,
        lifetimeReferralEarned: true,
        createdAt: true,
        _count: { select: { referralsMade: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const referrals = await prisma.referral.findMany({
      select: {
        id: true,
        rewardGranted: true,
        createdAt: true,
        referrer: { select: { email: true, myReferralCode: true } },
        referee: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      users: users.map(u => ({
        ...u,
        referralsCount: u._count.referralsMade,
      })),
      referrals: referrals.map(r => ({
        id: r.id,
        referrerEmail: r.referrer.email,
        referrerCode: r.referrer.myReferralCode,
        refereeEmail: r.referee.email,
        rewarded: r.rewardGranted,
        createdAt: r.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ users: [], referrals: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();
    if (!userId) return NextResponse.json({ error: "缺少userId" }, { status: 400 });

    if (action === "regenerate") {
      const newCode = generateReferralCode();
      await prisma.user.update({
        where: { id: userId },
        data: { myReferralCode: newCode },
      });
      return NextResponse.json({ success: true, referralCode: newCode });
    }

    if (action === "resetLifetime") {
      await prisma.user.update({
        where: { id: userId },
        data: { lifetimeReferralEarned: 0 },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
