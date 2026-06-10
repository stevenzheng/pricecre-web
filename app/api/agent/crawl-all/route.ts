// app/api/agent/crawl-all/route.ts
// ============================================================
// POST /api/agent/crawl-all — 分批全量抓取（serverless 安全）
// body: { limit?: number }  每次最多处理 limit 个任务（默认 5），
// 按「最久未跑优先」轮转；响应返回 remaining，调用方循环到 0 即全量完成。
// 执行路径与 cron 完全一致（agent/job-runner.ts）。
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { runCrawlJobs, pickStalestJobs } from "@/agent/job-runner";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const now = new Date();
  try {
    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 5, 1), 10);

    const totalActive = await prisma.scheduledCrawlJob.count({ where: { isActive: true } });
    if (totalActive === 0) {
      return NextResponse.json({ success: true, msg: "无活跃爬取目标", crawled: 0, remaining: 0 });
    }

    console.log(`[CrawlAll] ${now.toISOString()} — 批次启动（${limit}/${totalActive}）`);
    const jobs = await pickStalestJobs(limit);
    const summary = await runCrawlJobs(jobs);

    // 还有多少任务从未在本轮跑过（lastRunAt 早于本次启动时间）
    const remaining = await prisma.scheduledCrawlJob.count({
      where: { isActive: true, OR: [{ lastRunAt: null }, { lastRunAt: { lt: now } }] },
    });

    return NextResponse.json({
      success: true,
      msg: `批次完成: ${summary.totalListings}条原始 / ${summary.qualityPassed}条质检通过 / ${summary.written}条入库 · 剩余 ${remaining} 个任务`,
      ...summary,
      remaining,
    });
  } catch (err: any) {
    console.error("[CrawlAll]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
