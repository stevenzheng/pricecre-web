// agent/job-runner.ts
// ============================================================
// 在线抓取任务执行器 — cron 与 crawl-all 共用的唯一执行路径
// Tavily 搜索（机房 IP 可用）→ 质检 → 精算 → 审核队列
// 不在线上用 SSR 直爬：贝壳/安居客等对机房 IP 反爬，成功率≈0
// ============================================================
import { TavilyScraper } from "./scrapers/tavily-scraper";
import { LocalAgentMasterOrchestrator } from "./master-pipeline";
import { batchUploadAssets } from "./uploader";
import { validateBatch } from "./data-quality";
import { prisma } from "../lib/prisma";
import type { PropertyType, RawScrapedPackage } from "./schemas";

const VALID_TYPES = ["OFFICE", "SHOPS", "INDUSTRIAL"];

export interface JobRunResult {
  label: string;
  status: "SUCCESS" | "FAILED";
  listings: number;
  qualityPassed: number;
  error?: string;
}

export interface BatchRunSummary {
  jobsRun: number;
  totalListings: number;
  qualityPassed: number;
  approved: number;
  written: number;
  results: JobRunResult[];
}

/**
 * 执行一批抓取任务（serverless 安全：调用方控制批量大小）。
 * 每个 job 独立容错并回写 lastRunStatus；批末统一精算+入库。
 */
export async function runCrawlJobs(jobs: Array<{
  id: string; label: string; city: string; district: string; propertyType: string;
}>): Promise<BatchRunSummary> {
  const now = new Date();
  const results: JobRunResult[] = [];
  const allValidPackages: RawScrapedPackage[] = [];
  let totalListings = 0;

  for (const job of jobs) {
    try {
      const type = (VALID_TYPES.includes(job.propertyType) ? job.propertyType : "OFFICE") as PropertyType;
      const rawPackages = await TavilyScraper.crawlAndEnrich({
        city: job.city,
        district: job.district,
        propertyType: type,
        maxResults: 20,
      });

      totalListings += rawPackages.length;
      const quality = rawPackages.length > 0 ? validateBatch(rawPackages) : { validPackages: [] as RawScrapedPackage[] };
      allValidPackages.push(...quality.validPackages);

      await prisma.scheduledCrawlJob.update({
        where: { id: job.id },
        data: {
          lastRunAt: now,
          lastRunStatus: "SUCCESS",
          lastPipelineCount: quality.validPackages.length,
          lastRunError: null,
        },
      }).catch(() => {});

      results.push({ label: job.label, status: "SUCCESS", listings: rawPackages.length, qualityPassed: quality.validPackages.length });
    } catch (err: any) {
      await prisma.scheduledCrawlJob.update({
        where: { id: job.id },
        data: { lastRunAt: now, lastRunStatus: "FAILED", lastRunError: (err.message || "").slice(0, 500) },
      }).catch(() => {});
      results.push({ label: job.label, status: "FAILED", listings: 0, qualityPassed: 0, error: err.message });
    }
  }

  let approved = 0;
  let written = 0;
  if (allValidPackages.length > 0) {
    const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(allValidPackages);
    const upload = await batchUploadAssets(processed);
    written = upload.totalWritten;
    approved = processed.filter((p) => p.status !== "CRITICAL_MISSING").length;
  }

  return {
    jobsRun: jobs.length,
    totalListings,
    qualityPassed: allValidPackages.length,
    approved,
    written,
    results,
  };
}

/** 取「最久未跑」的活跃任务（null 优先），用于轮转批次 */
export async function pickStalestJobs(limit: number) {
  const jobs = await prisma.scheduledCrawlJob.findMany({
    where: { isActive: true },
    orderBy: [{ lastRunAt: { sort: "asc", nulls: "first" } }],
    take: limit,
  });
  return jobs;
}
