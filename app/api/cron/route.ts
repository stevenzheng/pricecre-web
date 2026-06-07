/**
 * GET /api/cron — Vercel Cron Job trigger
 * Automatically runs full crawl pipeline on schedule
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { SsrHydrationScraper } from "@/agent/scrapers/ssr-hydration-scraper";
import { batchUploadAssets } from "@/agent/uploader";



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
  console.log(`[Cron] ${now.toISOString()} — 定时抓取触发`);

  try {
    const jobs = await prisma.scheduledCrawlJob.findMany({
      where: { isActive: true },
    });

    if (jobs.length === 0) {
      console.log("[Cron] 无活跃爬取目标");
      return NextResponse.json({ success: true, crawled: 0, msg: "无活跃爬取目标" });
    }

    const allRawItems: any[] = [];
    let totalListings = 0;

    for (const job of jobs) {
      try {
        const crawlResults = await SsrHydrationScraper.crawlJob({
          targetUrl: job.targetUrl,
          label: job.label,
          propertyType: job.propertyType as any,
          city: job.city,
          district: job.district,
        });

        for (const item of crawlResults) {
          allRawItems.push({
            projectName: item.projectName,
            city: item.cityKeystring,
            district: item.district,
            roughAddress: item.address || item.projectName,
            propertyType: item.propertyType,
            rawPriceText: item.rawPriceText || `${item.pricePerDay ?? 0}元/㎡/天`,
            freeRentMonthsText: item.freeRentMonthsText || "0",
            leaseTotalMonths: 36,
            macroSubmarketVacancy: 0.15,
            inputLtv: 0.6,
            noiCagr3Y: 0.02,
            area: item.area > 0 ? item.area : undefined,
          });
        }

        totalListings += crawlResults.length;

        await prisma.scheduledCrawlJob.update({
          where: { id: job.id },
          data: {
            lastRunAt: now,
            lastRunStatus: "SUCCESS",
            lastPipelineCount: crawlResults.length,
          },
        });
      } catch (err: any) {
        await prisma.scheduledCrawlJob.update({
          where: { id: job.id },
          data: {
            lastRunAt: now,
            lastRunStatus: "FAILED",
            lastRunError: err.message?.slice(0, 500),
          },
        });
      }
    }

    if (allRawItems.length > 0) {
      const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(allRawItems);
      await batchUploadAssets(processed);
    }

    console.log(`[Cron] 完成 — ${totalListings} 条房源`);
    return NextResponse.json({
      success: true,
      totalListings,
      jobsRun: jobs.length,
      timestamp: now.toISOString(),
    });
  } catch (err: any) {
    console.error("[Cron Error]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
