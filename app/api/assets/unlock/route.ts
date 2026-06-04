import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city, userId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: "缺少 propertyId" }, { status: 400 });
    }

    // Find property — try by ID first, then by projectName+city (for mock-data IDs)
    let property = await prisma.commercialProperty.findUnique({
      where: { id: propertyId },
    });

    if (!property && projectName && city) {
      // Fallback: find first matching project name + city
      property = await prisma.commercialProperty.findFirst({
        where: { projectName, city },
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!property) {
      return NextResponse.json({ error: "资产不存在" }, { status: 404 });
    }

    // If user is authenticated, handle credit deduction
    let remainingCredits = 99; // default for anonymous
    let unlocked = true;

    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return NextResponse.json({ error: "用户不存在" }, { status: 404 });
      }

      const totalCredits = user.referralViewCount + user.purchasedViewCount;
      if (totalCredits <= 0) {
        return NextResponse.json(
          { error: "额度不足", remainingCredits: 0 },
          { status: 402 }
        );
      }

      // Deduct credits: referral pool first
      await prisma.$transaction(async (tx) => {
        if (user.referralViewCount > 0) {
          await tx.user.update({
            where: { id: userId },
            data: { referralViewCount: { decrement: 1 } },
          });
        } else {
          await tx.user.update({
            where: { id: userId },
            data: { purchasedViewCount: { decrement: 1 } },
          });
        }

        // Record unlock view
        await tx.userViewLog.upsert({
          where: { userId_propertyId: { userId, propertyId } },
          create: { userId, propertyId },
          update: { viewedAt: new Date() },
        });
      });

      const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
      remainingCredits = (updatedUser?.referralViewCount ?? 0) + (updatedUser?.purchasedViewCount ?? 0);
      unlocked = true;
    }

    // Return property data (all indicators visible when unlocked)
    return NextResponse.json({
      unlocked,
      remainingCredits,
      property: {
        id: property.id,
        projectName: property.projectName,
        city: property.city,
        district: property.district,
        faceRent: property.faceRent,
        propertyType: property.propertyType,
        dynamicIndicators: unlocked ? property.dynamicIndicators : null,
      },
    });
  } catch (error) {
    console.error("Unlock error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
