// POST /api/auth/ensure-user — 确保用户存在于DB（用于测试登录等场景）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 与注册流程一致的 6 位大写邀请码（去除易混淆字符）
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "缺少email" }, { status: 400 });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          password: "test",
          referralViewCount: 10,
          myReferralCode: generateReferralCode(),
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

    // 历史遗留的 "sz" 前缀测试码 → 升级为标准格式（旧链接同时失效，属预期）
    if (/^sz[a-z0-9]{6}$/.test(user.myReferralCode)) {
      const newCode = generateReferralCode();
      try {
        user = await prisma.user.update({ where: { email }, data: { myReferralCode: newCode } });
      } catch {}
    }

    return NextResponse.json({ success: true, email, referralCode: user.myReferralCode });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
