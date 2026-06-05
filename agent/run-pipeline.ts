// agent/run-pipeline.ts
// ============================================================
// PriceCRE 本地抓取 Agent 全链路启动脚本
// 用法: npx tsx agent/run-pipeline.ts [--dry-run] [--city=shanghai] [--limit=20]
//
// 流程: 爬虫抓取 → GIS赋能 → 数据质量校验 → 金融精算 → Supabase上行
// ============================================================
import { SsrHydrationScraper, CrawlJobConfig } from "./scrapers/ssr-hydration-scraper";
import { TavilyScraper } from "./scrapers/tavily-scraper";
import { LocalAgentMasterOrchestrator } from "./master-pipeline";
import { batchUploadAssets } from "./uploader";
import { validateBatch, generateQualitySummary } from "./data-quality";
import { RawScrapedPackage } from "./schemas";
import type { PropertyType } from "./schemas";

// ── Tavily 爬取任务定义 ──────────────────────────────

interface TavilyCrawlTask {
  label: string;
  city: string;
  district: string;
  propertyType: PropertyType;
  maxResults: number;
}

/** 从预置任务中提取去重后的城市/区/业态组合 */
function deriveTavilyTasks(jobs: CrawlJobConfig[]): TavilyCrawlTask[] {
  const seen = new Set<string>();
  const tasks: TavilyCrawlTask[] = [];

  for (const j of jobs) {
    const key = `${j.city}|${j.district}|${j.propertyType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    tasks.push({
      label: `Tavily·${j.label}`,
      city: j.city,
      district: j.district,
      propertyType: j.propertyType,
      maxResults: j.maxResults ?? 20,
    });
  }

  return tasks;
}

// ── 预置爬取任务 ─────────────────────────────────────

const PREBUILT_JOBS: CrawlJobConfig[] = [
  // 贝壳商办 — 上海核心商圈
  { label: "贝壳·上海陆家嘴", targetUrl: "https://office.ke.com/sh/lujiazui/", propertyType: "OFFICE", city: "shanghai", district: "lujiazui", maxResults: 30 },
  { label: "贝壳·上海静安", targetUrl: "https://office.ke.com/sh/jingan/", propertyType: "OFFICE", city: "shanghai", district: "jing_an", maxResults: 30 },
  { label: "贝壳·上海张江", targetUrl: "https://office.ke.com/sh/zhangjiang/", propertyType: "OFFICE", city: "shanghai", district: "zhangjiang", maxResults: 20 },
  { label: "贝壳·上海前滩", targetUrl: "https://office.ke.com/sh/qiantan/", propertyType: "OFFICE", city: "shanghai", district: "qiantan", maxResults: 20 },

  // 贝壳商办 — 北京
  { label: "贝壳·北京朝阳", targetUrl: "https://office.ke.com/bj/chaoyang/", propertyType: "OFFICE", city: "beijing", district: "chaoyang", maxResults: 30 },
  { label: "贝壳·北京海淀", targetUrl: "https://office.ke.com/bj/haidian/", propertyType: "OFFICE", city: "beijing", district: "haidian", maxResults: 20 },

  // 贝壳商办 — 深圳
  { label: "贝壳·深圳南山", targetUrl: "https://office.ke.com/sz/nanshan/", propertyType: "OFFICE", city: "shenzhen", district: "nanshan", maxResults: 20 },
  { label: "贝壳·深圳福田", targetUrl: "https://office.ke.com/sz/futian/", propertyType: "OFFICE", city: "shenzhen", district: "futian", maxResults: 20 },

  // 好租
  { label: "好租·上海办公", targetUrl: "https://shanghai.haozu.com/office/", propertyType: "OFFICE", city: "shanghai", district: "pudong", maxResults: 30 },
  { label: "好租·上海商铺", targetUrl: "https://shanghai.haozu.com/shop/", propertyType: "SHOPS", city: "shanghai", district: "pudong", maxResults: 20 },
  { label: "好租·北京办公", targetUrl: "https://beijing.haozu.com/office/", propertyType: "OFFICE", city: "beijing", district: "chaoyang", maxResults: 20 },

  // 安居客
  { label: "安居客·上海写字楼", targetUrl: "https://shanghai.anjuke.com/office/", propertyType: "OFFICE", city: "shanghai", district: "pudong", maxResults: 30 },
  { label: "安居客·北京写字楼", targetUrl: "https://beijing.anjuke.com/office/", propertyType: "OFFICE", city: "beijing", district: "chaoyang", maxResults: 20 },

  // 点点租
  { label: "点点租·上海", targetUrl: "https://shanghai.diandianzu.com/", propertyType: "OFFICE", city: "shanghai", district: "pudong", maxResults: 30 },
  { label: "点点租·北京", targetUrl: "https://beijing.diandianzu.com/", propertyType: "OFFICE", city: "beijing", district: "chaoyang", maxResults: 20 },
];

// ── CLI 参数解析 ─────────────────────────────────────

function parseArgs(): {
  dryRun: boolean;
  city?: string;
  limit?: number;
  platforms?: string[];
  tavily: boolean;
} {
  const args = process.argv.slice(2);
  const opts: ReturnType<typeof parseArgs> = { dryRun: false, tavily: false };

  for (const arg of args) {
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--tavily") opts.tavily = true;
    else if (arg.startsWith("--city=")) opts.city = arg.split("=")[1];
    else if (arg.startsWith("--limit=")) opts.limit = parseInt(arg.split("=")[1]);
    else if (arg.startsWith("--platforms=")) {
      opts.platforms = arg.split("=")[1].split(",").map((s) => s.trim());
    }
  }

  return opts;
}

// ── 主入口 ───────────────────────────────────────────

async function main() {
  console.log("═══════════════════════════════════════════════");
  console.log("  PriceCRE 本地抓取Agent 全链路管线 v5.0");
  console.log("  DATA_DICTIONARY 47字段对齐");
  console.log("═══════════════════════════════════════════════\n");

  const opts = parseArgs();
  let jobs = [...PREBUILT_JOBS];

  // 过滤城市
  if (opts.city) {
    jobs = jobs.filter((j) => j.city === opts.city);
    console.log(`[过滤] 仅城市: ${opts.city} → ${jobs.length} 个任务\n`);
  }

  // 过滤平台
  if (opts.platforms) {
    jobs = jobs.filter((j) =>
      opts.platforms!.some((p) =>
        j.targetUrl.includes(p) || j.label.includes(p)
      )
    );
    console.log(`[过滤] 仅平台: ${opts.platforms.join(", ")} → ${jobs.length} 个任务\n`);
  }

  if (jobs.length === 0) {
    console.log("无匹配任务，退出");
    return;
  }

  // ── 阶段1: 爬取 ──────────────────────────────────
  const allRawPackages: RawScrapedPackage[] = [];
  const crawlResults = new Map<string, RawScrapedPackage[]>();

  if (opts.tavily) {
    console.log(`\n▶ 阶段1: Tavily 搜索模式 — ${jobs.length} 个区域\n`);
    const tavilyTasks = deriveTavilyTasks(jobs);

    for (const task of tavilyTasks) {
      console.log(`  ⏳ ${task.label}`);
      const rawPackages = await TavilyScraper.crawlAndEnrich({
        city: task.city,
        district: task.district,
        propertyType: task.propertyType,
        maxResults: task.maxResults,
      });
      crawlResults.set(task.label, rawPackages);
      allRawPackages.push(...rawPackages);
    }
  } else {
    console.log(`\n▶ 阶段1: SSR 爬虫模式 — ${jobs.length} 个爬取任务\n`);

    for (const job of jobs) {
      console.log(`  ⏳ ${job.label}`);
      const rawPackages = await SsrHydrationScraper.crawlAndEnrich(job);
      crawlResults.set(job.label, rawPackages);
      allRawPackages.push(...rawPackages);
    }
  }

  console.log(`\n  ✅ 爬取汇总: ${allRawPackages.length} 条原始数据\n`);

  if (allRawPackages.length === 0) {
    console.log("无数据产出，退出");
    return;
  }

  // ── 阶段2: 数据质量校验 ────────────────────────────
  console.log(`▶ 阶段2: 数据质量校验\n`);

  const qualityResult = validateBatch(allRawPackages);
  console.log(generateQualitySummary(qualityResult.reports));

  if (qualityResult.validPackages.length === 0) {
    console.error("\n  ❌ 无法产出有效数据包，停止管线");
    // 输出诊断
    for (const report of qualityResult.reports) {
      if (report.severity === "CRITICAL") {
        console.log(`  [严重] ${report.summary}`);
      }
    }
    return;
  }

  console.log(`\n  有效包: ${qualityResult.validPackages.length} 条 → 流入管线\n`);

  // ── 阶段3: 金融精算管线 ────────────────────────────
  console.log("▶ 阶段3: 金融精算 + Exa舆情 + MiniMax情感分析\n");

  const processedAssets = await LocalAgentMasterOrchestrator.executeFullPipeline(
    qualityResult.validPackages
  );

  console.log(
    `  ✅ 精算输出: ${processedAssets.length} 条 ProcessedAsset`
  );

  const approvedCount = processedAssets.filter(
    (a) => a.status !== "CRITICAL_MISSING"
  ).length;
  const criticalCount = processedAssets.filter(
    (a) => a.status === "CRITICAL_MISSING"
  ).length;
  console.log(
    `     通过: ${approvedCount} | 严重缺损: ${criticalCount}\n`
  );

  // ── 阶段4: 上行 ────────────────────────────────────
  if (opts.dryRun) {
    console.log("▶ 阶段4: DRY RUN — 跳过上行");
    console.log(`  将写入 ${processedAssets.length} 条到 Supabase\n`);

    // 打印前5条预览
    console.log("  预览 (前5条):");
    for (const asset of processedAssets.slice(0, 5)) {
      console.log(
        `    ${asset.projectName} | ${asset.city}·${asset.district} | ` +
        `¥${asset.faceRent}/㎡/天 | 状态: ${asset.status} | 置信度: ${asset.confidenceScore.toFixed(2)}`
      );
    }
  } else {
    console.log("▶ 阶段4: 数据上行 → Supabase + API 冗余\n");

    const uploadResult = await batchUploadAssets(processedAssets);
    console.log(
      `  ✅ Supabase写入: ${uploadResult.totalWritten} 条 | 失败: ${uploadResult.totalFailed} 条\n`
    );
  }

  // ── 输出最终统计 ──────────────────────────────────
  console.log("═══════════════════════════════════════════════");
  console.log("  管线执行报告");
  console.log("═══════════════════════════════════════════════");
  console.log(`  爬取任务: ${jobs.length} 个`);
  console.log(`  原始数据: ${allRawPackages.length} 条`);
  console.log(`  质量通过: ${qualityResult.validPackages.length} 条 (${((qualityResult.validPackages.length / allRawPackages.length) * 100).toFixed(1)}%)`);
  console.log(`  精算产出: ${processedAssets.length} 条`);
  console.log(`  可发布: ${approvedCount} 条`);
  console.log(`  模式: ${opts.dryRun ? "DRY RUN" : "生产"}`);
  console.log("═══════════════════════════════════════════════\n");

  // ── 平台级拆分输出 ──────────────────────────────────
  console.log("  按平台分布:");
  for (const [label, pkgs] of Array.from(crawlResults.entries())) {
    const pkgCount = pkgs.length;
    const validPkgs = qualityResult.validPackages.filter((vp) =>
      pkgs.some((p) => p.projectName === vp.projectName)
    ).length;
    console.log(`    ${label}: ${pkgCount} 条 → 质检通过 ${validPkgs} 条`);
  }
}

main().catch((err) => {
  console.error("\n═══════════════════════════════════════════════");
  console.error("  管线致命异常");
  console.error("═══════════════════════════════════════════════");
  console.error(err);
  process.exit(1);
});
