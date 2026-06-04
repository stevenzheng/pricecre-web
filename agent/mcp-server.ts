// agent/mcp-server.ts
// ============================================================
// PriceCRE MCP Server — Model Context Protocol 接口
//
// stdout Mode (供 AI 客户端调用):
//   npx tsx agent/mcp-server.ts
//
// HTTP Mode (供远程/Web 调用):
//   npx tsx agent/mcp-server.ts --mode=http --port=3457
//
// MCP 客户端配置（Claude Desktop / Cursor / OpenClaw）:
// {
//   "mcpServers": {
//     "pricecre": {
//       "command": "npx",
//       "args": ["tsx", "agent/mcp-server.ts"],
//       "cwd": "/Users/stevenair/Desktop/Pricecre.WB"
//     }
//   }
// }
// ============================================================

const SERVER_NAME = "pricecre-agent";
const SERVER_VERSION = "5.0.0";

// ── 类型 ──────────────────────────────────────────────

interface McpMessage {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

type Sender = (msg: McpMessage) => void;

// ── API 调用 ──────────────────────────────────────────

const API_BASE = `http://localhost:${process.env.AGENT_API_PORT || "3456"}`;

async function callAgent(endpoint: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.AGENT_SYNC_TOKEN) {
    headers.Authorization = `Bearer ${process.env.AGENT_SYNC_TOKEN}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: body ? "POST" : "GET",
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

// ── Tool Registry ─────────────────────────────────────

const TOOL_LIST = {
  tools: [
    {
      name: "pricecre_crawl_properties",
      description: "从贝壳商办/好租/安居客/点点租爬取商业地产租金数据。覆盖上海/北京/深圳等9城。",
      inputSchema: {
        type: "object" as const,
        properties: {
          city: { type: "string", description: "shanghai/beijing/shenzhen/guangzhou/hangzhou/chengdu/suzhou/changsha/xian" },
          platform: { type: "string", description: "beike/haozu/anjuke/diandianzu" },
          propertyType: { type: "string", description: "OFFICE/SHOPS/INDUSTRIAL" },
          district: { type: "string", description: "行政区（可选）" },
          maxResults: { type: "integer", description: "最大结果数，默认30" },
        },
        required: ["city"],
      },
    },
    {
      name: "pricecre_run_pipeline",
      description: "运行完整管线（爬取→质检→精算），dry-run不写入数据库。",
      inputSchema: {
        type: "object" as const,
        properties: {
          city: { type: "string", description: "限定城市（可选）" },
          platform: { type: "string", description: "限定平台（可选）" },
          limit: { type: "integer", description: "最大结果数" },
        },
      },
    },
    {
      name: "pricecre_get_status",
      description: "获取Agent服务运行状态",
      inputSchema: { type: "object" as const, properties: {} },
    },
  ],
};

const TOOL_HANDLERS: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  pricecre_crawl_properties: (args) => callAgent("/api/agent/v1/crawl", args),
  pricecre_run_pipeline: (args) => callAgent("/api/agent/v1/pipeline", args),
  pricecre_get_status: () => callAgent("/api/agent/v1/status"),
};

// ── MCP 消息处理（无副作用版，可被 stdio 和 HTTP 复用）─

async function dispatchMcpMessage(msg: McpMessage, send: Sender): Promise<void> {
  const { id, method, params } = msg;

  switch (method) {
    case "initialize":
      send({ jsonrpc: "2.0", id, result: {
        protocolVersion: "2024-11-05",
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
        capabilities: { tools: {} },
      }});
      break;

    case "tools/list":
      send({ jsonrpc: "2.0", id, result: TOOL_LIST });
      break;

    case "tools/call": {
      const toolName = params?.name as string;
      const toolArgs = (params?.arguments || {}) as Record<string, unknown>;
      const handler = TOOL_HANDLERS[toolName];

      if (!handler) {
        send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Tool not found: ${toolName}` } });
        return;
      }

      try {
        const result = await handler(toolArgs);
        send({ jsonrpc: "2.0", id, result: {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        }});
      } catch (err: any) {
        send({ jsonrpc: "2.0", id, error: { code: -32603, message: err.message } });
      }
      break;
    }

    case "notifications/initialized":
      break; // no response needed

    default:
      send({ jsonrpc: "2.0", id, error: { code: -32601, message: `Unknown method: ${method}` } });
  }
}

// ── Stdio MCP 模式 ────────────────────────────────────

function runStdio() {
  const send: Sender = (msg) => process.stdout.write(JSON.stringify(msg) + "\n");
  let buffer = "";

  process.stdin.setEncoding("utf-8");
  process.stdin.on("data", async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg: McpMessage = JSON.parse(line);
        await dispatchMcpMessage(msg, send);
      } catch {
        console.error(`[MCP] 无效 JSON: ${line.substring(0, 80)}`);
      }
    }
  });

  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
}

// ── HTTP MCP 模式 ────────────────────────────────────

async function runHttp(port: number) {
  const http = await import("http");

  const server = http.createServer(async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok", tools: TOOL_LIST.tools.map((t) => t.name) }));
      return;
    }

    if (req.method === "POST" && req.url === "/mcp") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", async () => {
        try {
          const msg: McpMessage = JSON.parse(body);
          const responses: McpMessage[] = [];
          const send: Sender = (m) => responses.push(m);

          await dispatchMcpMessage(msg, send);

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(responses));
        } catch {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("MCP HTTP server — POST /mcp | GET /health");
  });

  server.listen(port, () => {
    console.log(`[MCP HTTP] http://localhost:${port}/mcp`);
    console.log(`[MCP HTTP] http://localhost:${port}/health`);
  });
}

// ── 入口 ──────────────────────────────────────────────

async function main() {
  const mode = process.argv.find((a) => a.startsWith("--mode="))?.split("=")[1] || "stdio";

  if (mode === "http") {
    const port = parseInt(process.argv.find((a) => a.startsWith("--port="))?.split("=")[1] || "3457");
    await runHttp(port);
  } else {
    runStdio();
  }
}

main().catch(console.error);
