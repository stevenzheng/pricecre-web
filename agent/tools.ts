// agent/tools.ts
// ============================================================
// OpenAI / Claude 兼容的 Tool 定义
// 任何支持 function-calling 的 AI Agent 平台均可直接使用
//
// 适用平台: OpenClaw, Hermes, Dify, Coze, LangChain, CrewAI, etc.
// ============================================================

// ── OpenAI Function Calling 格式 ─────────────────────

export const PRICECRE_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "pricecre_crawl_properties",
      description:
        "爬取商业地产租金数据。从贝壳商办、好租、安居客、点点租四个平台抓取写字楼/商铺/产业园的真实挂牌租金，返回结构化数据。" +
        "9城覆盖：上海、北京、深圳、广州、杭州、成都、苏州、长沙、西安。",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description:
              "城市英文名: shanghai, beijing, shenzhen, guangzhou, hangzhou, chengdu, suzhou, changsha, xian",
            enum: [
              "shanghai", "beijing", "shenzhen", "guangzhou",
              "hangzhou", "chengdu", "suzhou", "changsha", "xian",
            ],
          },
          platform: {
            type: "string",
            description: "数据来源平台",
            enum: ["beike", "haozu", "anjuke", "diandianzu"],
            default: "beike",
          },
          propertyType: {
            type: "string",
            description: "物业类型",
            enum: ["OFFICE", "SHOPS", "INDUSTRIAL"],
            default: "OFFICE",
          },
          district: {
            type: "string",
            description:
              "行政区，如 lujiazui/jing_an/chaoyang/nanshan。留空则爬取全城。",
          },
          maxResults: {
            type: "number",
            description: "最大返回数量，默认30，最大100",
            minimum: 5,
            maximum: 100,
            default: 30,
          },
        },
        required: ["city"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pricecre_run_pipeline",
      description:
        "运行完整数据管线（dry-run模式）：爬取 → GIS赋能 → 数据质检 → 金融精算 → 预览输出。" +
        "不写入数据库。用于预览和验证数据质量。",
      parameters: {
        type: "object",
        properties: {
          city: {
            type: "string",
            description: "限定城市，留空则全9城。",
            enum: [
              "shanghai", "beijing", "shenzhen", "guangzhou",
              "hangzhou", "chengdu", "suzhou", "changsha", "xian",
            ],
          },
          platform: {
            type: "string",
            description: "限定平台",
            enum: ["beike", "haozu", "anjuke", "diandianzu"],
          },
          limit: {
            type: "number",
            description: "每条任务最大结果数",
            minimum: 5,
            maximum: 50,
            default: 20,
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "pricecre_get_status",
      description: "获取 Agent 服务状态，包括运行时间、爬取统计、可用城市列表。",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
];

// ── Claude Tool Use 格式 ─────────────────────────────

export const CLAUDE_TOOLS = PRICECRE_TOOLS.map((t) => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: {
    type: "object",
    properties: t.function.parameters.properties,
    required: t.function.parameters.required,
  },
}));

// ── LangChain Tool 格式 ──────────────────────────────

export function langchainTools(serverBaseUrl: string) {
  return PRICECRE_TOOLS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    func: async (args: Record<string, unknown>) => {
      const endpoint = t.function.name.replace("pricecre_", "");
      const url = `${serverBaseUrl}/api/agent/v1/${endpoint}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(args),
      });
      return res.json();
    },
  }));
}

// ── OpenAPI 3 规范（Swagger 兼容） ───────────────────

export function openApiSpec(serverBaseUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "PriceCRE Agent API",
      version: "5.0.0",
      description:
        "商业地产租金数据抓取与精算 Agent API。" +
        "9城4平台覆盖，47项精算指标。",
    },
    servers: [{ url: serverBaseUrl, description: "本地 Agent 服务器" }],
    paths: {
      "/api/agent/v1/status": {
        get: {
          summary: "服务状态",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "运行中" } },
        },
      },
      "/api/agent/v1/crawl": {
        post: {
          summary: "爬取租金数据",
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    city: { type: "string", enum: ["shanghai", "beijing", "shenzhen", "guangzhou", "hangzhou", "chengdu", "suzhou", "changsha", "xian"] },
                    platform: { type: "string", enum: ["beike", "haozu", "anjuke", "diandianzu"] },
                    propertyType: { type: "string", enum: ["OFFICE", "SHOPS", "INDUSTRIAL"] },
                    district: { type: "string" },
                    maxResults: { type: "number", default: 30 },
                  },
                  required: ["city"],
                },
              },
            },
          },
          responses: { "200": { description: "爬取结果" } },
        },
      },
      "/api/agent/v1/pipeline": {
        post: {
          summary: "Dry-run 管线预览",
          security: [{ bearerAuth: [] }],
          responses: { "200": { description: "预览结果" } },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
  };
}

// ── MCP Server 定义 ──────────────────────────────────

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: "pricecre_crawl_properties",
    description:
      "从贝壳商办/好租/安居客/点点租爬取商业地产租金数据。覆盖上海/北京/深圳等9城。",
    inputSchema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "城市: shanghai/beijing/shenzhen/guangzhou/hangzhou/chengdu/suzhou/changsha/xian",
        },
        platform: {
          type: "string",
          description: "平台: beike/haozu/anjuke/diandianzu",
        },
        propertyType: {
          type: "string",
          description: "业态: OFFICE/SHOPS/INDUSTRIAL",
        },
        district: { type: "string", description: "行政区" },
        maxResults: { type: "integer", description: "最大结果数，默认30" },
      },
      required: ["city"],
    },
  },
  {
    name: "pricecre_run_pipeline",
    description: "运行完整管线（爬取→质检→精算），dry-run不写入数据库。",
    inputSchema: {
      type: "object",
      properties: {
        city: { type: "string", description: "城市" },
        platform: { type: "string", description: "平台" },
        limit: { type: "integer", description: "最大结果数", default: 20 },
      },
      required: [],
    },
  },
  {
    name: "pricecre_get_status",
    description: "获取Agent服务运行状态",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];
