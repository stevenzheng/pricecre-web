// app/api/agent/crawl/route.ts
// POST /api/agent/crawl — 手动提交 URL 自动爬取 → 精算 → 入审核队列
import { NextResponse } from "next/server";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { SsrHydrationScraper } from "@/agent/scrapers/ssr-hydration-scraper";
import { batchUploadAssets } from "@/agent/uploader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetUrl, propertyType, city, district, projectName } = body;

    if (!targetUrl) {
      return NextResponse.json({ error: "targetUrl 必填" }, { status: 400 });
    }

    console.log(`[Crawl] ${targetUrl}`);
    const results = await SsrHydrationScraper.crawlJob({
      targetUrl,
      label: projectName || targetUrl,
      propertyType: propertyType || "OFFICE",
      city: city || "shanghai",
      district: district || "pudong",
      maxResults: 5,
    });

    if (results.length === 0) {
      return NextResponse.json({ error: "CRAWL_EMPTY", msg: "未提取到任何房源" });
    }

    const taskBatch = results.map((item) => ({
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
    }));

    const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(taskBatch);
    if (processed.length > 0) {
      await batchUploadAssets(processed);
      return NextResponse.json({
        success: true,
        count: results.length,
        items: processed.map((p) => ({ projectName: p.projectName, assetId: p.id, status: p.status, faceRent: p.faceRent })),
      });
    }
    return NextResponse.json({ error: "PIPELINE_EXECUTION_FAILED" }, { status: 500 });
  } catch (err: any) {
    console.error("[Crawl]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
