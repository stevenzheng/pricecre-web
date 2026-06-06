"use server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";


const GENERIC_AUTH_ERROR = "账号或密码错误";

export async function registerUser(data: { email: string; password?: string; referralCode?: string }) {
  try {
    if (!data.email || !data.password) {
      throw new Error(GENERIC_AUTH_ERROR);
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const generatedCode = nanoid(8);

    return await prisma.$transaction(async (tx) => {
      if (data.referralCode) {
        const referrer = await tx.user.findUnique({ where: { myReferralCode: data.referralCode } });

        if (referrer && referrer.lifetimeReferralEarned < 100) {
          await tx.user.update({
            where: { id: referrer.id },
            data: {
              referralViewCount: { increment: 10 },
              lifetimeReferralEarned: { increment: 10 },
            },
          });
          // 同步更新 UserCredit 邀约额度
          const referrerCredit = await tx.userCredit.findUnique({ where: { email: referrer.email! } });
          if (referrerCredit) {
            await tx.userCredit.update({
              where: { email: referrer.email! },
              data: { referralCredits: { increment: 10 } },
            });
          } else {
            await tx.userCredit.create({
              data: { email: referrer.email!, referralCredits: 10, purchasedCredits: 0, totalUsed: 0 },
            });
          }
          await tx.creditAuditLog.create({
            data: { email: referrer.email!, type: "add_credits", amount: 10, balance: (referrerCredit?.referralCredits || 0) + (referrerCredit?.purchasedCredits || 0) + 10, note: "邀请用户注册奖励" },
          });
        }
      }

      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          myReferralCode: generatedCode,
          referralViewCount: 10,    // 新用户默认 10 次查看权益
          lifetimeReferralEarned: 0,
        },
      });

      // 创建 UserCredit（查看权益池）
      await tx.userCredit.create({
        data: { email: data.email, referralCredits: 10, purchasedCredits: 0, totalUsed: 0 },
      });

      // 创建 UserChatToken（AI 对话额度池）
      await tx.userChatToken.create({
        data: { email: data.email, tokens: 100, totalUsed: 0 },
      });

      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    });
  } catch {
    throw new Error(GENERIC_AUTH_ERROR);
  }
}
