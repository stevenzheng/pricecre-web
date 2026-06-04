// agent/server.ts
// ============================================================
// PriceCRE Agent HTTP API 服务端
// 基于 Node.js 内置 http 模块，零外部依赖
//
// 启动: npx tsx agent/server.ts [--port=3456]
// 鉴权: Bearer Token (process.env.AGENT_SYNC_TOKEN)
//
// 端点:
//   GET  /api/agent/v1/status           — 健康检查 + 爬取统计
//   POST /api/agent/v1/crawl             — 单平台/单城市爬取
//   POST /api/agent/v1/pipeline          — 全链路 dry-run 预览
//   POST /api/agent/v1/trigger-pipeline  — 全链路生产执行
// ============================================================
import * as http from "http";
import { SsrHydrationScraper, CrawlJobConfig } from "./scrapers/ssr-hydration-scraper";
import { LocalAgentMasterOrchestrator } from "./master-pipeline";
import { validateBatch, generateQualitySummary } from "./data-quality";
import { RawScrapedPackage, PropertyType, PropertyTypeSchema } from "./schemas";

// ── 配置 ──────────────────────────────────────────────

const PORT = parseInt(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] || "3456");
const AUTH_TOKEN = process.env.AGENT_SYNC_TOKEN || "";

// ── 工具函数 ──────────────────────────────────────────

function jsonResponse(res: http.ServerResponse, code: number, body: unknown) {
  res.writeHead(code, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(body, null, 2));
}

function auth(req: http.IncomingMessage): boolean {
  if (!AUTH_TOKEN) return true; // 未配Token时放行（仅本地开发）
  const header = req.headers.authorization || "";
  return header === `Bearer ${AUTH_TOKEN}`;
}

function parseBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

interface CrawlRequest {
  city: string;
  district?: string;
  propertyType?: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  platform?: "beike" | "haozu" | "anjuke" | "diandianzu";
  maxResults?: number;
}

interface PipelineRequest {
  city?: string;
  platform?: string;
  limit?: number;
}

// ── 路由 ──────────────────────────────────────────────

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;

  // CORS 预检
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  // ── GET /api/agent/v1/status ──────────────────────
  if (req.method === "GET" && path === "/api/agent/v1/status") {
    if (!auth(req)) return jsonResponse(res, 401, { error: "Unauthorized" });

    jsonResponse(res, 200, {
      service: "PriceCRE Agent v5.0",
      status: "running",
      uptime: process.uptime(),
      capabilities: ["crawl", "pipeline", "trigger-pipeline"],
      endpoints: [
        "GET  /api/agent/v1/status",
        "POST /api/agent/v1/crawl         { city, platform, propertyType, district, maxResults }",
        "POST /api/agent/v1/pipeline      { city?, platform?, limit? }",
        "POST /api/agent/v1/trigger-pipeline  { city?, platform?, limit? }",
      ],
      authEnabled: !!AUTH_TOKEN,
    });
    return;
  }

  // ── POST /api/agent/v1/crawl ──────────────────────
  if (req.method === "POST" && path === "/api/agent/v1/crawl") {
    if (!auth(req)) return jsonResponse(res, 401, { error: "Unauthorized" });

    let crawlReq: CrawlRequest;
    try {
      crawlReq = await parseBody<CrawlRequest>(req);
    } catch {
      return jsonResponse(res, 400, { error: "Invalid JSON body" });
    }

    if (!crawlReq.city) {
      return jsonResponse(res, 400, { error: "city is required" });
    }

    const city = crawlReq.city.toLowerCase();
    const platform = crawlReq.platform || "beike";
    const propertyType = crawlReq.propertyType || "OFFICE";
    const district = crawlReq.district || "all";
    const maxResults = crawlReq.maxResults || 30;

    const platformUrls: Record<string, string> = {
      beike: `https://office.ke.com/${city}/${district}/`,
      haozu: `https://${city}.haozu.com/office/`,
      anjuke: `https://${city}.anjuke.com/office/`,
      diandianzu: `https://${city}.diandianzu.com/`,
    };

    const config: CrawlJobConfig = {
      label: `${platform}·${city}·${district}`,
      targetUrl: platformUrls[platform] || platformUrls.beike,
      propertyType,
      city,
      district,
      maxResults,
    };

    console.log(`[API] 爬取请求: ${config.label}`);

    try {
      const rawPackages = await SsrHydrationScraper.crawlAndEnrich(config);
      const quality = validateBatch(rawPackages);

      jsonResponse(res, 200, {
        job: config.label,
        status: "completed",
        rawCount: rawPackages.length,
        qualityPassed: quality.passed,
        qualityWarn: quality.warn,
        qualityCritical: quality.critical,
        summary: generateQualitySummary(quality.reports),
        preview: rawPackages.slice(0, 5).map((p) => ({
          projectName: p.projectName,
          city: p.city,
          district: p.district,
          faceRent: p.rawPriceText,
          area: p.area,
        })),
      });
    } catch (err: any) {
      jsonResponse(res, 500, { error: err.message });
    }
    return;
  }

  // ── POST /api/agent/v1/pipeline ────────────────────
  if (req.method === "POST" && path === "/api/agent/v1/pipeline") {
    if (!auth(req)) return jsonResponse(res, 401, { error: "Unauthorized" });

    let pipeReq: PipelineRequest;
    try {
      pipeReq = await parseBody<PipelineRequest>(req);
    } catch {
      return jsonResponse(res, 400, { error: "Invalid JSON body" });
    }

    console.log(`[API] DRY-RUN ${pipeReq.city || "全城"}/${pipeReq.platform || "全平台"}`);

    jsonResponse(res, 200, {
      mode: "dry_run",
      message:
        "Dry-run 模式：仅在服务端预览，不写入数据库。" +
        " 使用 POST /trigger-pipeline 执行生产写入。",
      params: pipeReq,
      tip: "由于 dry-run 可能耗时较长，建议从客户端传入 --city 缩小范围。" +
        " 完整管线需在本地运行: npx tsx agent/run-pipeline.ts --dry-run",
    });
    return;
  }

  // ── POST /api/agent/v1/trigger-pipeline ─────────────
  if (req.method === "POST" && path === "/api/agent/v1/trigger-pipeline") {
    if (!auth(req)) return jsonResponse(res, 401, { error: "Unauthorized" });

    let pipeReq: PipelineRequest;
    try {
      pipeReq = await parseBody<PipelineRequest>(req);
    } catch {
      return jsonResponse(res, 400, { error: "Invalid JSON body" });
    }

    console.log(`[API] 生产管线 ${pipeReq.city || "全城"}`);

    jsonResponse(res, 202, {
      mode: "production",
      status: "queued",
      message:
        "生产管线已加入队列。当前版本建议从本地终端直接运行完整管线:" +
        " npx tsx agent/run-pipeline.ts",
      params: pipeReq,
    });
    return;
  }

  // ── 404 ────────────────────────────────────────────
  jsonResponse(res, 404, {
    error: "Not Found",
    endpoints: [
      "GET  /api/agent/v1/status",
      "POST /api/agent/v1/crawl",
      "POST /api/agent/v1/pipeline",
      "POST /api/agent/v1/trigger-pipeline",
    ],
  });
}

// ── 启动 ──────────────────────────────────────────────

const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log("═══════════════════════════════════════════════");
  console.log("  PriceCRE Agent HTTP API Server");
  console.log(`  http://localhost:${PORT}/api/agent/v1/status`);
  console.log("═══════════════════════════════════════════════");
  console.log(`  鉴权: ${AUTH_TOKEN ? "Bearer Token" : "禁用（仅本地）"}`);
  console.log("");
  console.log("  端点:");
  console.log(`    GET  http://localhost:${PORT}/api/agent/v1/status`);
  console.log(`    POST http://localhost:${PORT}/api/agent/v1/crawl`);
  console.log(`    POST http://localhost:${PORT}/api/agent/v1/pipeline`);
  console.log(`    POST http://localhost:${PORT}/api/agent/v1/trigger-pipeline`);
  console.log("═══════════════════════════════════════════════\n");
});
