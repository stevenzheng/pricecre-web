import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  try {
    await adminAuth();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const dayAgo = new Date(now.getTime() - 86400000);

    const [
      totalAssets, cities, totalUsers, totalViews,
      newAssetsThisWeek, newUsersThisWeek, viewsThisWeek,
      pendingReviews, approvedThisWeek, totalCrawlJobs,
      activeCrawlJobs, activeDataSources, totalDataSources,
      crawlSuccessRate, totalOrders, totalReferrals,
      avgConfidence, highConfidenceCount, lowConfidenceCount,
      lastCrawlAt, lastReviewAt,
      // 新增指标
      totalOrdersPaid, totalOrdersThisWeek, totalOrdersAmount,
      totalUnlockedAssets, totalConversations, conversationsThisWeek,
      totalViewCreditsSum, totalChatTokensSum,
    ] = await Promise.all([
      prisma.commercialProperty.count(),
      prisma.commercialProperty.findMany({ select: { city: true }, distinct: ["city"] }).then(r => r.map(c => c.city)),
      prisma.user.count(),
      prisma.userViewLog.count(),
      prisma.commercialProperty.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.userViewLog.count({ where: { viewedAt: { gte: weekAgo } } }),
      prisma.agentReviewQueue.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.agentReviewQueue.count({ where: { status: "APPROVED", updatedAt: { gte: weekAgo } } }),
      prisma.scheduledCrawlJob.count(),
      prisma.scheduledCrawlJob.count({ where: { isActive: true } }),
      prisma.dataSourceRegistry.count({ where: { isActive: true } }),
      prisma.dataSourceRegistry.count(),
      prisma.scheduledCrawlJob.count({ where: { lastRunStatus: "SUCCESS", lastRunAt: { gte: weekAgo } } }),
      prisma.order.count(),
      prisma.referral.count(),
      prisma.commercialProperty.aggregate({ _avg: { confidenceScore: true } }),
      prisma.commercialProperty.count({ where: { confidenceScore: { gte: 0.8 } } }),
      prisma.commercialProperty.count({ where: { confidenceScore: { lt: 0.6 } } }),
      prisma.scheduledCrawlJob.findFirst({ where: { lastRunAt: { gte: new Date(0) } }, orderBy: { lastRunAt: "desc" }, select: { lastRunAt: true } }),
      prisma.agentReviewQueue.findFirst({ where: { updatedAt: { gte: new Date(0) } }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true } }),
      // 新增指标查询
      prisma.order.count({ where: { status: { in: [1, 5] } } }), // 已支付+已完成订单数
      prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.order.aggregate({ _sum: { amount: true }, where: { status: { in: [1, 5] } } }),
      prisma.userViewLog.count(), // 已解锁资产卡片总数
      prisma.creditAuditLog.count({ where: { type: "consume_chat" } }), // 总对话量
      prisma.creditAuditLog.count({ where: { type: "consume_chat", createdAt: { gte: weekAgo } } }),
      prisma.userCredit.aggregate({ _sum: { referralCredits: true, purchasedCredits: true } }),
      prisma.userChatToken.aggregate({ _sum: { tokens: true } }),
    ]);

    // Properties by type
    const byType: Record<string, number> = { OFFICE: 0, SHOPS: 0, INDUSTRIAL: 0 };
    (await prisma.commercialProperty.groupBy({ by: ["propertyType"], _count: true })).forEach(g => { byType[g.propertyType] = g._count; });

    // Views trend: daily counts for last 7 days
    const dailyViews: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const end = new Date(start.getTime() + 86400000);
      const count = await prisma.userViewLog.count({ where: { viewedAt: { gte: start, lt: end } } });
      dailyViews.push({ date: `${start.getMonth() + 1}/${start.getDate()}`, count });
    }

    const totalCrawlRuns = totalCrawlJobs > 0 ? await prisma.scheduledCrawlJob.count({ where: { lastRunAt: { gte: weekAgo } } }) : 0;
    const crawlSuccessPct = totalCrawlRuns > 0 ? Math.round((crawlSuccessRate / totalCrawlRuns) * 100) : 100;

    return NextResponse.json({
      summary: {
        totalAssets, cities: cities.length, totalUsers, totalViews,
        newAssetsThisWeek, newUsersThisWeek, viewsThisWeek,
      },
      pipeline: {
        pendingReviews, approvedThisWeek,
        activeCrawlJobs, totalCrawlJobs,
        activeDataSources, totalDataSources,
        crawlSuccessPct,
        lastCrawlAt: lastCrawlAt?.lastRunAt || null,
        lastReviewAt: lastReviewAt?.updatedAt || null,
      },
      quality: {
        avgConfidence: avgConfidence._avg.confidenceScore ? Math.round(avgConfidence._avg.confidenceScore * 100) : 0,
        highConfidenceCount, lowConfidenceCount,
      },
      growth: {
        totalOrders, totalReferrals,
        totalOrdersPaid,
        totalOrdersThisWeek,
        totalOrdersAmount: totalOrdersAmount._sum.amount || 0,
        totalUnlockedAssets,
        totalConversations,
        conversationsThisWeek,
      },
      quotaPool: {
        totalViewCredits: (totalViewCreditsSum._sum.referralCredits || 0) + (totalViewCreditsSum._sum.purchasedCredits || 0),
        totalChatTokens: totalChatTokensSum._sum.tokens || 0,
      },
      byType,
      dailyViews,
    });
  } catch (error) {
    if ((error as any)?.status) return error as any;
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
