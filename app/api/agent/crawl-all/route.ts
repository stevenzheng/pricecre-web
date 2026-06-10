// app/api/agent/crawl-all/route.ts
// ============================================================
// POST /api/agent/crawl-all — 全量抓取所有活跃爬取任务
// 遍历 scheduledCrawlJob → Tavily → 质检 → 精算 → 入库 → 回写状态
// ============================================================
import { NextResponse } from "next/server";
import { TavilyScraper } from "@/agent/scrapers/tavily-scraper";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { batchUploadAssets } from "@/agent/uploader";
import { validateBatch } from "@/agent/data-quality";
import { prisma } from "@/lib/prisma";
import type { PropertyType } from "@/agent/schemas";

const VALID_TYPES = ["OFFICE", "SHOPS", "INDUSTRIAL"];

export async function POST() {
  const now = new Date();
  console.log(`[CrawlAll] ${now.toISOString()} — 全量抓取启动`);

  try {
    const jobs = await prisma.scheduledCrawlJob.findMany({
      where: { isActive: true },
    });

    if (jobs.length === 0) {
      return NextResponse.json({
        success: true,
        msg: "无活跃爬取目标",
        crawled: 0,
      });
    }

    const results: Array<{
      label: string;
      status: string;
      listings: number;
      approved: number;
      error?: string;
    }> = [];

    const allRawItems: any[] = [];
    let totalListings = 0;
    let totalApproved = 0;

    for (const job of jobs) {
      console.log(`[CrawlAll] → ${job.label} (${job.city}/${job.district})`);
      try {
        const type = (VALID_TYPES.includes(job.propertyType)
          ? job.propertyType
          : "OFFICE") as PropertyType;

        // 爬取
        const rawPackages = await TavilyScraper.crawlAndEnrich({
          city: job.city,
          district: job.district,
          propertyType: type,
          maxResults: 20,
        });

        const jobListings = rawPackages.length;

        if (rawPackages.length > 0) {
          // 质检
          const quality = validateBatch(rawPackages);

          if (quality.validPackages.length > 0) {
            allRawItems.push(...quality.validPackages);
          }

          totalListings += jobListings;

          await prisma.scheduledCrawlJob.update({
            where: { id: job.id },
            data: {
              lastRunAt: now,
              lastRunStatus: "SUCCESS",
              lastPipelineCount: quality.validPackages.length,
              lastRunError: null,
            },
          });

          results.push({
            label: job.label,
            status: "SUCCESS",
            listings: jobListings,
            approved: quality.validPackages.length,
          });
        } else {
          await prisma.scheduledCrawlJob.update({
            where: { id: job.id },
            data: {
              lastRunAt: now,
              lastRunStatus: "SUCCESS",
              lastPipelineCount: 0,
            },
          });

          results.push({
            label: job.label,
            status: "SUCCESS",
            listings: 0,
            approved: 0,
          });
        }
      } catch (err: any) {
        console.error(`[CrawlAll] ${job.label} 失败:`, err.message);
        await prisma.scheduledCrawlJob.update({
          where: { id: job.id },
          data: {
            lastRunAt: now,
            lastRunStatus: "FAILED",
            lastRunError: err.message?.slice(0, 500),
          },
        });
        results.push({
          label: job.label,
          status: "FAILED",
          listings: 0,
          approved: 0,
          error: err.message,
        });
      }
    }

    console.log(`[CrawlAll] 共 ${totalListings} 条原始数据`);

    // 批量精算 + 入库
    if (allRawItems.length > 0) {
      const processed =
        await LocalAgentMasterOrchestrator.executeFullPipeline(allRawItems);

      await batchUploadAssets(processed);

      totalApproved = processed.filter(
        (p) => p.status !== "CRITICAL_MISSING"
      ).length;
    }

    return NextResponse.json({
      success: true,
      msg: `全量完成: ${totalListings}条原始 / ${allRawItems.length}条质检通过 / ${totalApproved}条入库`,
      totalListings,
      qualityPassed: allRawItems.length,
      approved: totalApproved,
      jobs: jobs.length,
      results,
    });
  } catch (err: any) {
    console.error("[CrawlAll]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
