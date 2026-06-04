// app/api/agent/crawl-all/route.ts
// POST /api/agent/crawl-all — 全量抓取所有爬取目标
import { NextResponse } from "next/server";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { SsrHydrationScraper } from "@/agent/scrapers/ssr-hydration-scraper";
import { batchUploadAssets } from "@/agent/uploader";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    for (const job of jobs) {
      console.log(`[CrawlAll] → ${job.label}`);
      try {
        const ssrRaw = await SsrHydrationScraper.dehydratePropertyPage(job.targetUrl);
        allRawItems.push({
          projectName: ssrRaw?.projectName ?? job.label,
          city: job.city,
          district: job.district,
          roughAddress: ssrRaw?.projectName ?? job.label,
          propertyType: job.propertyType,
          rawPriceText: ssrRaw ? `${ssrRaw.faceRent}` : "0",
          freeRentMonthsText: ssrRaw?.indicatorsBag.freeRentMonthsText ?? "0",
          leaseTotalMonths: 60,
          macroSubmarketVacancy: ssrRaw?.indicatorsBag.submarketVacancy ?? 0.15,
          inputLtv: 0.6,
          noiCagr3Y: 0.02,
        });

        await prisma.scheduledCrawlJob.update({
          where: { id: job.id },
          data: { lastRunAt: now, lastRunStatus: "SUCCESS" },
        });

        results.push({ label: job.label, status: "SUCCESS" });
      } catch (err: any) {
        await prisma.scheduledCrawlJob.update({
          where: { id: job.id },
          data: { lastRunAt: now, lastRunStatus: "FAILED", lastRunError: err.message?.slice(0, 500) },
        });
        results.push({ label: job.label, status: "FAILED", error: err.message });
      }
    }

    if (allRawItems.length > 0) {
      const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(allRawItems);
      await batchUploadAssets(processed);
    }

    return NextResponse.json({
      success: true,
      msg: `全量抓取完成：${results.length} 个目标`,
      results,
    });
  } catch (err: any) {
    console.error("[CrawlAll]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
