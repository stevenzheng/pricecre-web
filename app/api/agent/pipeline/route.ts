// app/api/agent/pipeline/route.ts
// ============================================================
// Agent 管线手动触发入口
// POST /api/agent/pipeline — 手动下发资产抓取+精算
// GET  /api/agent/pipeline — Vercel Cron 触发定时任务
// ============================================================
import { NextResponse } from "next/server";
import { LocalAgentMasterOrchestrator } from "@/agent/master-pipeline";
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
  console.log("[Pipeline] Vercel Cron 触发 — 开始定时扫描...");

  const monitorSites = [
    { projectName: "前滩太古里", city: "shanghai", district: "qiantan", propertyType: "SHOPS" as const },
    { projectName: "上海中心大厦", city: "shanghai", district: "jing_an", propertyType: "OFFICE" as const },
  ];

  const rawItems: any[] = [];
  for (const site of monitorSites) {
    rawItems.push({
      projectName: site.projectName,
      city: site.city,
      district: site.district,
      roughAddress: site.projectName,
      propertyType: site.propertyType,
      rawPriceText: "0",
      freeRentMonthsText: "0",
      leaseTotalMonths: 60,
      macroSubmarketVacancy: 0.15,
      inputLtv: 0.6,
      noiCagr3Y: 0.02,
    });
  }

  try {
    const processed = await LocalAgentMasterOrchestrator.executeFullPipeline(rawItems);
    await batchUploadAssets(processed);
    return NextResponse.json({
      success: true,
      msg: `Cron 定时任务完成，${processed.length} 条资产已入审核队列`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "CRON_PIPELINE_ERROR", msg: err.message },
      { status: 500 }
    );
  }
}
