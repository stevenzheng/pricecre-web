"use server";

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";



interface UnlockResponse {
  success: boolean;
  mode?: "CREDIT_CONSUMED" | "CACHE_HIT" | "VIP_FREE";
  unlockedData?: { netEffectiveRent: number | null };
  remainingCredits?: { referralViewCount: number; purchasedViewCount: number };
  error?: string;
}

export async function unlockPropertyData(propertyId: string): Promise<UnlockResponse> {
  // 1. 零信任前置安全登录凭证鉴权
  const session = await getServerSession();
  if (!session || !session.user || !session.user.id) {
    throw new Error("UNAUTHORIZED_ACCESS_DENIED");
  }
  const userId = session.user.id;

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("USER_NOT_FOUND_IN_SYSTEM");

    // 2. 账户隔离防爆破：联合隔离安全熔断判定 (AND 物理钢钉拦截，防止误杀邮箱手机用户)
    if (user.password === null && user.wechatOpenId === null && user.phone === null && user.email === null) {
      throw new Error("ZOMBIE_ACCOUNT_DETECTED_AND_MELTDOWN");
    }

    // 3. 24小时去重确权锁判定
    const existingLog = await tx.userViewLog.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    const property = await tx.commercialProperty.findUnique({ where: { id: propertyId } });
    if (!property) throw new Error("PROPERTY_ASSET_NOT_FOUND");
    const rawIndicators = property.dynamicIndicators as Record<string, any>;

    // 24小时内命中去重锁，执行 0 额度消耗无感直出
    if (existingLog && (new Date().getTime() - new Date(existingLog.viewedAt).getTime() < 24 * 60 * 60 * 1000)) {
      return {
        success: true,
        mode: "CACHE_HIT",
        unlockedData: { netEffectiveRent: typeof rawIndicators.netEffectiveRent === "number" ? rawIndicators.netEffectiveRent : null },
      };
    }

    // 4. 商业 VIP 判定轴与双池按序原子扣减
    const isVipActive = user.vipExpireTime !== null && new Date(user.vipExpireTime) > new Date();
    let currentReferral = user.referralViewCount;
    let currentPurchased = user.purchasedViewCount;

    if (!isVipActive) {
      if (currentReferral + currentPurchased <= 0) {
        return { success: false, error: "INSUFFICIENT_CREDIT" };
      }

      // 优先扣除裂变池赠额，枯竭归 0 后再扣付费池
      if (currentReferral > 0) {
        currentReferral--;
        await tx.user.update({
          where: { id: userId },
          data: { referralViewCount: currentReferral },
        });
      } else {
        currentPurchased--;
        await tx.user.update({
          where: { id: userId },
          data: { purchasedViewCount: currentPurchased },
        });
      }
    }

    // 5. 写入去重单一锁日志 (采用 Upsert 原子重写时间窗机制，彻底根除唯一性冲突爆头 Bug)
    await tx.userViewLog.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      update: { viewedAt: new Date() },
      create: { userId, propertyId, viewedAt: new Date() },
    });

    // 6. 服务端物理打码脱敏直出：一期项目仅释放租金主核心拦截点，其余 47 个附属指标重写为 null 返回，前台 LOCKED 拦截
    return {
      success: true,
      mode: isVipActive ? "VIP_FREE" : "CREDIT_CONSUMED",
      unlockedData: { netEffectiveRent: typeof rawIndicators.netEffectiveRent === "number" ? rawIndicators.netEffectiveRent : null },
      remainingCredits: {
        referralViewCount: currentReferral,
        purchasedViewCount: currentPurchased,
      },
    };
  });
}
