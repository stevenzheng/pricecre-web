/**
 * POST /api/assets/unlock
 *
 * Unlock asset data — deduct credits from user pool.
 * Auth: NextAuth session OR body.email
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city, email: bodyEmail } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });
    }

    // Auth: session first, body.email fallback
    const session = await getServerSession(authOptions);
    const email = session?.user?.email || bodyEmail || "";

    if (!email) {
      // Unauthenticated — return success but no deduction
      return NextResponse.json({
        unlocked: true,
        remainingCredits: 99,
        property: { id: propertyId, projectName: projectName || "", city: city || "" },
      });
    }

    // Deduct credits
    let userCredit = await prisma.userCredit.findUnique({ where: { email } });
    if (!userCredit) {
      userCredit = await prisma.userCredit.create({ data: { email, referralCredits: 10, purchasedCredits: 0 } });
    }

    const total = userCredit.referralCredits + userCredit.purchasedCredits;
    if (total <= 0) {
      return NextResponse.json({ error: "额度不足，请购买或邀请好友获取" }, { status: 402 });
    }

    // Deduct from referral first
    if (userCredit.referralCredits > 0) {
      await prisma.userCredit.update({ where: { email }, data: { referralCredits: { decrement: 1 } } });
    } else {
      await prisma.userCredit.update({ where: { email }, data: { purchasedCredits: { decrement: 1 } } });
    }

    // Record the view
    await prisma.userViewLog.create({
      data: {
        email,
        propertyId,
        projectName: projectName || "",
        city: city || "",
      },
    }).catch(() => {});

    const updated = await prisma.userCredit.findUnique({ where: { email } });
    return NextResponse.json({
      unlocked: true,
      remainingCredits: (updated?.referralCredits || 0) + (updated?.purchasedCredits || 0),
      property: { id: propertyId, projectName: projectName || "", city: city || "" },
    });
  } catch (err: any) {
    console.error("[Unlock Error]", err.message);
    return NextResponse.json({ error: "服务器错误: " + (err.message || "").slice(0, 80) }, { status: 500 });
  }
}
