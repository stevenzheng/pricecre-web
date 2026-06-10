/**
 * GET /api/cron — Vercel Cron（每天 8:00，见 vercel.json）
 *
 * 轮转批次设计：每次只跑「最久未跑」的 CRON_BATCH 个任务，
 * 多天滚动覆盖全部任务 — 单次调用永不超时。
 * 执行路径与手动「全量抓取」完全一致（agent/job-runner.ts）。
 */
import { NextRequest, NextResponse } from "next/server";
import { runCrawlJobs, pickStalestJobs } from "@/agent/job-runner";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 给足精算外呼时间（按 Vercel 套餐自动封顶）

const CRON_BATCH = 3;

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  console.log(`[Cron] ${now.toISOString()} — 定时抓取触发（轮转批次 ${CRON_BATCH}）`);

  try {
    const jobs = await pickStalestJobs(CRON_BATCH);
    if (jobs.length === 0) {
      return NextResponse.json({ success: true, crawled: 0, msg: "无活跃爬取目标" });
    }

    const summary = await runCrawlJobs(jobs);

    console.log(`[Cron] 完成 — ${summary.totalListings} 条房源 / 入库 ${summary.written} 条`);
    return NextResponse.json({
      success: true,
      ...summary,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error("[Cron Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
