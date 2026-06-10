// app/api/agent/pipeline/route.ts
// ============================================================
// Agent 管线入口
// POST /api/agent/pipeline — 手动触发（支持 Tavily + dry-run）
// GET  /api/agent/pipeline — Vercel Cron 定时任务（读取计划）
// ============================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TavilyScraper } from "@/agent/scrapers/tavily-scraper";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { batchUploadAssets } from "@/agent/uploader";
import { validateBatch } from "@/agent/data-quality";

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { city, district, propertyType, maxResults, dryRun } = body;

    if (city) {
      // Tavily 模式: 城市+区+业态
      const rawPackages = await TavilyScraper.crawlAndEnrich({
        city,
        district: district || "all",
        propertyType: propertyType || "OFFICE",
        maxResults: maxResults || 20,
      });

      if (rawPackages.length === 0) {
        return NextResponse.json({
          success: true, count: 0, msg: "无搜索结果",
        });
      }

      const quality = validateBatch(rawPackages);
      const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(
        quality.validPackages
      );

      if (!dryRun && processed.length > 0) {
        await batchUploadAssets(processed);
      }

      return NextResponse.json({
        success: true,
        mode: dryRun ? "dry_run" : "production",
        raw: rawPackages.length,
        processed: processed.length,
        duration: `${((Date.now() - startTime) / 1000).toFixed(1)}s`,
        preview: processed.slice(0, 5).map((p) => ({
          projectName: p.projectName,
          faceRent: p.faceRent,
          status: p.status,
          confidence: p.confidenceScore,
        })),
      });
    }

    // 传统模式: 单资产手动入库
    const { projectName, targetUrl, lng, lat, compTxPrice, opexRatio, area } =
      body;

    if (!projectName || !propertyType) {
      return NextResponse.json(
        { error: "projectName, propertyType 必填" },
        { status: 400 }
      );
    }

    const rawItems = [
      {
        projectName,
        city: city ?? "shanghai",
        district: district ?? "pudong",
        roughAddress: projectName,
        propertyType: propertyType || "OFFICE",
        rawPriceText: body.rawPriceText ?? "0",
        freeRentMonthsText: body.freeRentMonthsText ?? "0",
        leaseTotalMonths: 36,
        macroSubmarketVacancy: 0.15,
        inputLtv: 0.6,
        noiCagr3Y: 0.02,
        area, compTxPrice, opexRatio,
      },
    ];

    const processed =
      await LocalAgentMasterOrchestrator.executeFullPipeline(rawItems);

    if (processed.length > 0) {
      await batchUploadAssets(processed);
      return NextResponse.json({
        success: true,
        assetId: processed[0].id,
        status: processed[0].status,
      });
    }

    return NextResponse.json(
      { error: "管线未产出有效结果" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[Pipeline]", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const windowMinutes = 30;

  console.log(
    `[Cron] ${now.toISOString()} — 窗口 ${currentHour}:${currentMinute}`
  );

  try {
    const jobs = await prisma.scheduledCrawlJob.findMany({
      where: { isActive: true },
    });

    const dueJobs = jobs.filter((job) => {
      const total = job.scheduleHour * 60 + job.scheduleMinute;
      const current = currentHour * 60 + currentMinute;
      const diff = Math.min(Math.abs(current - total), 1440 - Math.abs(current - total));
      return diff <= windowMinutes;
    });

    if (dueJobs.length === 0) {
      return NextResponse.json({
        success: true,
        activeJobs: jobs.length,
        dueJobs: 0,
      });
    }

    const results: any[] = [];
    for (const job of dueJobs) {
      try {
        const rawPackages = await TavilyScraper.crawlAndEnrich({
          city: job.city,
          district: job.district,
          propertyType: job.propertyType as any,
          maxResults: 20,
        });

        let processed: any[] = [];
        if (rawPackages.length > 0) {
          const quality = validateBatch(rawPackages);
          processed =
            await LocalAgentMasterOrchestrator.executeFullPipeline(
              quality.validPackages
            );
          await batchUploadAssets(processed);
        }

        await prisma.scheduledCrawlJob.update({
          where: { id: job.id },
          data: {
            lastRunAt: now,
            lastRunStatus: "SUCCESS",
            lastPipelineCount: processed.length,
            lastRunError: null,
          },
        });

        results.push({
          label: job.label,
          status: "SUCCESS",
          count: processed.length,
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
        results.push({
          label: job.label,
          status: "FAILED",
          error: err.message,
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
