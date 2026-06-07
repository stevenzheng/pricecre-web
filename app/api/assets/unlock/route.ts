/**
 * POST /api/assets/unlock
 *
 * Unlock asset data — deducts credits from authenticated user's pool.
 * Identity comes from NextAuth session, NOT from request body.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });
    }

    const property = await prisma.commercialProperty.findUnique({ where: { id: propertyId } });
    if (!property) {
      return NextResponse.json({ error: "资产不存在" }, { status: 404 });
    }

    // Authenticate user from session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      // Anonymous user — allow unlock without deducting from DB
      return NextResponse.json({
        unlocked: true,
        remainingCredits: 99,
        property: {
          id: property.id,
          projectName: property.projectName,
          dynamicIndicators: property.dynamicIndicators as any,
        },
      });
    }

    const userId = session.user.id;

    // Re-read user inside transaction to avoid race conditions
    const result = await prisma.$transaction(async (tx) => {
      const dbUser = await tx.user.findUnique({ where: { id: userId } });
      if (!dbUser) throw new Error("USER_NOT_FOUND");

      const totalCredits = dbUser.referralViewCount + dbUser.purchasedViewCount;
      if (totalCredits <= 0) throw new Error("NO_CREDITS");

      let deducted = false;

      // Deduct referral pool first (unless anti-fraud lock)
      if (dbUser.referralViewCount > 0 && (dbUser.lifetimeReferralEarned ?? 0) < 100) {
        await tx.user.update({
          where: { id: userId },
          data: { referralViewCount: { decrement: 1 } },
        });
        deducted = true;
      }

      // Fall back to purchased pool
      if (!deducted && dbUser.purchasedViewCount > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { purchasedViewCount: { decrement: 1 } },
        });
        deducted = true;
      }

      if (!deducted) throw new Error("NO_CREDITS");

      // Record view
      await tx.userViewLog.upsert({
        where: { userId_propertyId: { userId, propertyId: property.id } },
        create: { userId, propertyId: property.id },
        update: { viewedAt: new Date() },
      });

      // Return fresh credit counts
      const updated = await tx.user.findUnique({ where: { id: userId } });
      return {
        remainingCredits: (updated?.referralViewCount ?? 0) + (updated?.purchasedViewCount ?? 0),
      };
    });

    return NextResponse.json({
      unlocked: true,
      remainingCredits: result.remainingCredits,
      property: {
        id: property.id,
        projectName: property.projectName,
        dynamicIndicators: property.dynamicIndicators as any,
      },
    });
  } catch (err: any) {
    if (err?.message === "NO_CREDITS") {
      return NextResponse.json({ error: "额度不足", remainingCredits: 0 }, { status: 402 });
    }
    if (err?.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    console.error("[Unlock Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
