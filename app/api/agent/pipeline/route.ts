// app/api/agent/pipeline/route.ts
// ============================================================
// Agent 管线手动触发入口
// POST /api/agent/pipeline — 手动下发资产抓取+精算
// GET  /api/agent/pipeline — Vercel Cron 定时任务（从 DB 读取计划）
// ============================================================
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { SsrHydrationScraper } from "@/agent/scrapers/ssr-hydration-scraper";
import { batchUploadAssets } from "@/agent/uploader";



export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectName, targetUrl, propertyType, lng, lat, city, district } = body;

    if (!projectName || !propertyType) {
      return NextResponse.json(
        { error: "MISSING_MANDATORY_PARAMETERS: projectName, propertyType 必填" },
        { status: 400 }
      );
    }

    console.log(`[Pipeline] 手动触发 — ${projectName}`);

    const rawItems = [
      {
        projectName,
        city: city ?? "shanghai",
        district: district ?? "pudong",
        roughAddress: projectName,
        propertyType,
        rawPriceText: body.rawPriceText ?? "0",
        freeRentMonthsText: body.freeRentMonthsText ?? "0",
        leaseTotalMonths: 36,
        macroSubmarketVacancy: 0.15,
        inputLtv: 0.6,
        noiCagr3Y: 0.02,
        area: body.area,
        compTxPrice: body.compTxPrice,
        opexRatio: body.opexRatio,
      },
    ];

    const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(rawItems);

    if (processed.length > 0) {
      await batchUploadAssets(processed);
      return NextResponse.json({
        success: true,
        msg: `资产 [${projectName}] 已完成精算并写入审核队列`,
        assetId: processed[0].id,
        status: processed[0].status,
      });
    }

    return NextResponse.json(
      { error: "PIPELINE_EXECUTION_FAILED", msg: "管线未产生有效输出" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[Pipeline] 执行失败:", err);
    return NextResponse.json(
      { error: "PIPELINE_ERROR", msg: err.message },
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
    `[Cron] ${now.toISOString()} — 检查计划任务 (窗口: ${currentHour}:${currentMinute} ± ${windowMinutes}min)`
  );

  try {
    const jobs = await prisma.scheduledCrawlJob.findMany({
      where: { isActive: true },
    });

    const dueJobs = jobs.filter((job) => {
      const jobTotalMinutes = job.scheduleHour * 60 + job.scheduleMinute;
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const diff = Math.abs(currentTotalMinutes - jobTotalMinutes);
      const diffWrapped = Math.min(diff, 1440 - diff);
      return diffWrapped <= windowMinutes;
    });

    if (dueJobs.length === 0) {
      console.log(`[Cron] 无到期任务，当前 ${jobs.length} 个活跃计划`);
      return NextResponse.json({
        success: true,
        msg: `无到期任务。活跃计划: ${jobs.length}`,
        activeJobs: jobs.length,
        dueJobs: 0,
      });
    }

    console.log(`[Cron] ${dueJobs.length} 个到期任务，开始执行...`);
    const results: any[] = [];

    for (const job of dueJobs) {
      console.log(`[Cron] → ${job.label} (${job.targetUrl})`);
      try {
        const crawlResults = await SsrHydrationScraper.crawlJob({
          targetUrl: job.targetUrl,
          label: job.label,
          propertyType: job.propertyType as any,
          city: job.city,
          district: job.district,
          maxResults: 3,
        });
        const rawItems = crawlResults.map((item) => ({
          projectName: item.projectName,
          city: item.cityKeystring,
          district: item.district,
          roughAddress: item.address || item.projectName,
          propertyType: item.propertyType,
          rawPriceText: item.rawPriceText || `${item.pricePerDay ?? 0}元/㎡/天`,
          freeRentMonthsText: item.freeRentMonthsText || "0",
          leaseTotalMonths: 60,
          macroSubmarketVacancy: 0.15,
          inputLtv: 0.6,
          noiCagr3Y: 0.02,
          area: item.area > 0 ? item.area : undefined,
        }));

        const processed =
          await LocalAgentMasterOrchestrator.executeFullPipeline(rawItems);
        await batchUploadAssets(processed);

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
          jobId: job.id,
          label: job.label,
          status: "SUCCESS",
          pipelineCount: processed.length,
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
          jobId: job.id,
          label: job.label,
          status: "FAILED",
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      msg: `定时任务完成。${results.length} 个计划已执行`,
      results,
    });
  } catch (err: any) {
    console.error("[Cron] 执行失败:", err);
    return NextResponse.json(
      { error: "CRON_PIPELINE_ERROR", msg: err.message },
      { status: 500 }
    );
  }
}
