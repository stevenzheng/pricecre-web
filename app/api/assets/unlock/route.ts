import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { propertyId, projectName, city, userId, email } = await request.json();

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

    // Look up user by ID or email
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({ where: { id: userId } });
    } else if (email) {
      dbUser = await prisma.user.findUnique({ where: { email } });
    }

    // If user is authenticated, handle credit deduction
    let remainingCredits = 99;
    let unlocked = true;

    if (dbUser) {
      const totalCredits = dbUser.referralViewCount + dbUser.purchasedViewCount;
      if (totalCredits <= 0) {
        return NextResponse.json(
          { error: "额度不足", remainingCredits: 0 },
          { status: 402 }
        );
      }

      // Deduct credits: referral pool first
      await prisma.$transaction(async (tx) => {
        if (dbUser.referralViewCount > 0) {
          await tx.user.update({
            where: { id: dbUser.id },
            data: { referralViewCount: { decrement: 1 } },
          });
        } else {
          await tx.user.update({
            where: { id: dbUser.id },
            data: { purchasedViewCount: { decrement: 1 } },
          });
        }

        // Record unlock view
        await tx.userViewLog.upsert({
          where: { userId_propertyId: { userId: dbUser.id, propertyId: property!.id } },
          create: { userId: dbUser.id, propertyId: property!.id },
          update: { viewedAt: new Date() },
        });
      });

      const updatedUser = await prisma.user.findUnique({ where: { id: dbUser.id } });
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
