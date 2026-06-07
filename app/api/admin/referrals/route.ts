/**
 * GET /api/admin/referrals — List all user referral codes and stats
 * POST /api/admin/referrals — Regenerate or modify referral codes
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/admin-auth";

export async function GET() {
  try {
    await adminAuth();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        myReferralCode: true,
        referralViewCount: true,
        purchasedViewCount: true,
        lifetimeReferralEarned: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" as const },
    });

    // Fetch UserCredit data separately (no relation via FK — keyed by email)
    const emails = users.map(u => u.email).filter(Boolean) as string[];
    const credits = await prisma.userCredit.findMany({
      where: { email: { in: emails } },
      select: { email: true, referralCredits: true, purchasedCredits: true },
    });
    const creditMap = new Map(credits.map(c => [c.email, c]));

    // Count referrals per user
    const referralCounts = await prisma.referral.groupBy({
      by: ["referrerId"],
      _count: { id: true },
    });
    const countMap = new Map(referralCounts.map(r => [r.referrerId, r._count.id]));

    const referrals = await prisma.referral.findMany({
      select: {
        id: true,
        rewardGranted: true,
        createdAt: true,
        referrer: { select: { email: true, myReferralCode: true } },
        referee: { select: { email: true } },
      },
      orderBy: { createdAt: "desc" as const },
      take: 100,
    });

    return NextResponse.json({
      users: users.map(u => {
        const uc = u.email ? creditMap.get(u.email) : null;
        return {
          id: u.id,
          email: u.email,
          myReferralCode: u.myReferralCode,
          referralViewCount: uc?.referralCredits ?? u.referralViewCount,
          purchasedViewCount: uc?.purchasedCredits ?? u.purchasedViewCount,
          lifetimeReferralEarned: u.lifetimeReferralEarned,
          createdAt: u.createdAt,
          referralsCount: countMap.get(u.id) || 0,
        };
      }),
      referrals: referrals.map(r => ({
        id: r.id,
        referrerEmail: r.referrer.email,
        referrerCode: r.referrer.myReferralCode,
        refereeEmail: r.referee.email,
        rewarded: r.rewardGranted,
        createdAt: r.createdAt,
      })),
    });
  } catch (err: any) {
    if (err?.status) return err;
    return NextResponse.json({ users: [], referrals: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    await adminAuth();
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
  } catch (err: any) {
    if (err?.status) return err;
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
