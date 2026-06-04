"use server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();
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
              referralViewCount: { increment: 5 },
              lifetimeReferralEarned: { increment: 5 },
            },
          });
        }
      }

      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          myReferralCode: generatedCode,
          referralViewCount: 3,
          lifetimeReferralEarned: 0,
        },
      });

      const { password, ...userWithoutPassword } = newUser;
      return userWithoutPassword;
    });
  } catch {
    throw new Error(GENERIC_AUTH_ERROR);
  }
}
