// app/api/agent/crawl/route.ts
// ============================================================
// POST /api/agent/crawl — 单次抓取（Tavily + 精算 + 入库）
// body: { city, district?, propertyType?, maxResults? }
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import { TavilyScraper } from "@/agent/scrapers/tavily-scraper";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
import { batchUploadAssets } from "@/agent/uploader";
import { validateBatch } from "@/agent/data-quality";
import type { PropertyType } from "@/agent/schemas";

const VALID_CITIES = [
  "shanghai","beijing","shenzhen","guangzhou","hangzhou",
  "chengdu","suzhou","changsha","xian",
];

const VALID_TYPES = ["OFFICE","SHOPS","INDUSTRIAL"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, district, propertyType, maxResults, dryRun } = body;

    if (!city || !VALID_CITIES.includes(city)) {
      return NextResponse.json(
        { error: `city 必填，合法值: ${VALID_CITIES.join(",")}` },
        { status: 400 }
      );
    }

    const type = (VALID_TYPES.includes(propertyType) ? propertyType : "OFFICE") as PropertyType;
    const districtVal = district || "all";
    const limit = Math.min(maxResults || 20, 30);

    console.log(`[API·Crawl] ${city}/${districtVal} ${type}`);

    // 阶段1: Tavily 搜索
    const rawPackages = await TavilyScraper.crawlAndEnrich({
      city,
      district: districtVal,
      propertyType: type,
      maxResults: limit,
    });

    if (rawPackages.length === 0) {
      return NextResponse.json({
        success: true,
        mode: dryRun ? "dry_run" : "production",
        count: 0,
        msg: "未搜索到符合条件的数据",
      });
    }

    // 阶段2: 数据质检
    const quality = validateBatch(rawPackages);
    if (quality.validPackages.length === 0) {
      return NextResponse.json({
        success: false,
        error: "QUALITY_BLOCK",
        msg: `${rawPackages.length} 条均未通过质检`,
        qualityReport: {
          total: quality.total,
          critical: quality.critical,
        },
      });
    }

    // 阶段3: 精算管线
    const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(
      quality.validPackages
    );

    const approved = processed.filter((p) => p.status !== "CRITICAL_MISSING");

    // 阶段4: 入库
    if (!dryRun && processed.length > 0) {
      await batchUploadAssets(processed);
    }

    return NextResponse.json({
      success: true,
      mode: dryRun ? "dry_run" : "production",
      city,
      district: districtVal,
      propertyType: type,
      raw: rawPackages.length,
      qualityPassed: quality.validPackages.length,
      processed: processed.length,
      approved: approved.length,
      preview: processed.slice(0, 10).map((p) => ({
        projectName: p.projectName,
        city: p.city,
        district: p.district,
        faceRent: p.faceRent,
        status: p.status,
        confidence: p.confidenceScore,
        assetId: p.id,
      })),
    });
  } catch (err: any) {
    console.error("[API·Crawl]", err);
    return NextResponse.json(
      { error: "CRAWL_ERROR", msg: err.message },
      { status: 500 }
    );
  }
}
