// app/api/agent/crawl/route.ts
// ============================================================
// 手动爬取触发入口
// POST /api/agent/crawl — 提交 URL 自动爬取 → 精算 → 入审核队列
// ============================================================
import { NextResponse } from "next/server";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { SsrHydrationScraper } from "@/agent/scrapers/ssr-hydration-scraper";
import { GeoGisScraper } from "@/agent/scrapers/geo-gis-scraper";
import { batchUploadAssets } from "@/agent/uploader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      targetUrl,
      propertyType,
      city,
      district,
      lng,
      lat,
      projectName,
    } = body;

    if (!targetUrl) {
      return NextResponse.json(
        { error: "MISSING_PARAM: targetUrl 必填" },
        { status: 400 }
      );
    }
    if (!propertyType || !["OFFICE", "SHOPS", "INDUSTRIAL"].includes(propertyType)) {
      return NextResponse.json(
        { error: "MISSING_PARAM: propertyType 必填 (OFFICE/SHOPS/INDUSTRIAL)" },
        { status: 400 }
      );
    }

    console.log(`[Crawl] 开始爬取: ${targetUrl}`);

    const ssrRaw = await SsrHydrationScraper.dehydratePropertyPage(targetUrl);
    if (!ssrRaw) {
      return NextResponse.json(
        {
          error: "SSR_DEHYDRATION_FAILED",
          msg: `无法从 ${targetUrl} 提取结构化数据。该平台爬虫模块尚未适配，或目标页面结构异常。`,
        },
        { status: 500 }
      );
    }

    const geoStats =
      lng && lat
        ? await GeoGisScraper.calculateSubmarketDemographics(lng, lat)
        : {};

    const taskBatch = [
      {
        projectName: projectName || ssrRaw.projectName,
        city: city ?? "shanghai",
        district: district ?? "pudong",
        roughAddress: ssrRaw.projectName,
        propertyType: propertyType,
        rawPriceText: `${ssrRaw.faceRent}`,
        freeRentMonthsText: ssrRaw.indicatorsBag.freeRentMonthsText ?? "0",
        leaseTotalMonths: 36,
        macroSubmarketVacancy:
          ssrRaw.indicatorsBag.submarketVacancy ?? 0.15,
        inputLtv: 0.6,
        noiCagr3Y: 0.02,
        ...geoStats,
      },
    ];

    console.log(`[Crawl] SSR 脱水完成，启动精算管线...`);
    const processed =
      await LocalAgentMasterOrchestrator.executeFullPipeline(taskBatch);

    if (processed.length > 0) {
      await batchUploadAssets(processed);
      console.log(
        `[Crawl] 完成 — 资产 ${processed[0].projectName} → review queue`
      );
      return NextResponse.json({
        success: true,
        projectName: processed[0].projectName,
        assetId: processed[0].id,
        status: processed[0].status,
        confidenceScore: processed[0].confidenceScore,
        faceRent: processed[0].faceRent,
      });
    }

    return NextResponse.json(
      { error: "PIPELINE_EXECUTION_FAILED", msg: "管线未产生有效输出" },
      { status: 500 }
    );
  } catch (err: any) {
    console.error("[Crawl] 执行失败:", err);
    return NextResponse.json(
      { error: "CRAWL_ERROR", msg: err.message },
      { status: 500 }
    );
  }
}
