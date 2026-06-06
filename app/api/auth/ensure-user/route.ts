// POST /api/auth/ensure-user — 确保用户存在于DB（用于测试登录等场景）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "缺少email" }, { status: 400 });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const code = "sz" + Math.random().toString(36).substring(2, 8);
      user = await prisma.user.create({
        data: {
          email,
          password: "test",
          referralViewCount: 10,
          myReferralCode: code,
        },
      });
      // Create UserCredit
      await prisma.userCredit.create({
        data: { email, referralCredits: 10, purchasedCredits: 0, totalUsed: 0 },
      });
      // Create chat token
      await prisma.userChatToken.create({
        data: { email, tokens: 100, totalUsed: 0 },
      });
    }

    return NextResponse.json({ success: true, email, referralCode: user.myReferralCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
