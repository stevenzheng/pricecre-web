// app/api/agent/crawl-all/route.ts
// POST /api/agent/crawl-all — 全量抓取所有爬取目标
import { NextResponse } from "next/server";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { SsrHydrationScraper } from "@/agent/scrapers/ssr-hydration-scraper";
import { batchUploadAssets } from "@/agent/uploader";
import { prisma } from "@/lib/prisma";



export async function POST() {
  const now = new Date();
  console.log(`[CrawlAll] ${now.toISOString()} — 全量抓取启动`);

  try {
    const jobs = await prisma.scheduledCrawlJob.findMany({
      where: { isActive: true },
    });

    if (jobs.length === 0) {
      return NextResponse.json({ success: true, msg: "无活跃爬取目标", crawled: 0 });
    }

    const results: any[] = [];
    const allRawItems: any[] = [];
    let totalListings = 0;

    for (const job of jobs) {
      console.log(`[CrawlAll] → ${job.label}`);
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

        results.push({
          label: job.label,
          status: "SUCCESS",
          listings: crawlResults.length,
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
        results.push({ label: job.label, status: "FAILED", error: err.message });
      }
    }

    console.log(`[CrawlAll] 共抓取 ${totalListings} 条房源`);

    if (allRawItems.length > 0) {
      const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(allRawItems);
      await batchUploadAssets(processed);
      console.log(`[CrawlAll] 管线处理完成，${processed.length} 条入审核队列`);
    }

    return NextResponse.json({
      success: true,
      msg: `全量抓取完成：${totalListings} 条房源，${results.length} 个平台`,
      totalListings,
      results,
    });
  } catch (err: any) {
    console.error("[CrawlAll]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
