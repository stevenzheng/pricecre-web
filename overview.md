# PriceCRE 本地抓取Agent 全量开发完成

**日期**: 2026-06-04 | **版本**: v5.0

---

## 第一部分：Agent 核心模块（9/9 完成）

### geo-gis-scraper.ts（415行）— GIS地理数据爬虫
- 高德地图API：地理编码 + 逆地理编码
- 9城32商圈知识库（空置率/密度/交通/商圈等级）
- 地址标准化 + 坐标验证 + 向后兼容

### ssr-hydration-scraper.ts（997行）— 4平台SSR爬虫
- 贝壳/好租/安居客/点点租 完整爬虫引擎
- JSON-LD + meta标签 + 通用HTML正则提取
- axios重试 + UA伪装 + 间隔冷却 + GIS整合

### data-quality.ts（323行）— 数据质量校验
- 8项校验规则 + 三级严重度（OK/WARN/CRITICAL）
- 面价范围/面积/免租期/9城白名单
- ProcessedAsset交叉验证 + Top缺陷排名

### run-pipeline.ts（212行）— 全链路启动脚本
- 15预置任务 + 4阶段管线 + dry-run模式
- CLI参数：`--city/--platforms/--limit/--dry-run`

---

## 第二部分：跨平台调用层 🆕

### server.ts — HTTP API 服务端
```
启动: npx tsx agent/server.ts [--port=3456]
端点:
  GET  /api/agent/v1/status            — 健康检查
  POST /api/agent/v1/crawl              — 单城市/单平台爬取
  POST /api/agent/v1/pipeline           — 全链路 dry-run
  POST /api/agent/v1/trigger-pipeline   — 生产执行
鉴权: Bearer Token (AGENT_SYNC_TOKEN)
```

### mcp-server.ts — MCP 协议服务
```
Stdio: npx tsx agent/mcp-server.ts           (供AI客户端)
HTTP:  npx tsx agent/mcp-server.ts --mode=http --port=3457
提供3个工具: crawl / pipeline / status
```

### tools.ts — 4种标准工具定义
- OpenAI Function Calling 格式
- Claude Tool Use 格式
- LangChain Tool 格式
- OpenAPI 3.0 Swagger 规范

### platforms.md — 7平台对接指南
| 平台 | 对接方式 |
|------|---------|
| **OpenClaw** | HTTP Action / Stdio MCP |
| **Hermes** | MCP / 自定义Plugin YAML |
| **Dify** | OpenAPI / 自定义工具 |
| **Coze** | OpenAPI 插件 + ngrok |
| **Claude Desktop** | Stdio MCP 配置 |
| **Cursor/Windsurf** | Stdio MCP 配置 |
| **LangChain/CrewAI** | langchainTools() / requests |

---

## Agent 模块全景

```
agent/
├── schemas.ts              ✅ Zod契约（6份Schema,47字段）
├── financial-engine.ts     ✅ 投行级精算（IRR/NOI/CAP）
├── master-pipeline.ts      ✅ Exa→MiniMax→精算管线
├── submarket-benchmarks.ts ✅ 子市场基准
├── uploader.ts             ✅ Supabase+API双通道
├── review-queue.ts         ✅ Prisma读写层
├── data-quality.ts         🆕 数据质检
├── run-pipeline.ts         🆕 全链路脚本
├── server.ts               🆕 HTTP API
├── mcp-server.ts           🆕 MCP协议
├── tools.ts                🆕 工具定义
├── platforms.md            🆕 对接指南
└── scrapers/
    ├── geo-gis-scraper.ts  🆕 高德GIS
    └── ssr-hydration-scraper.ts 🆕 4平台爬虫
```

---

## 快速启动

```bash
# 1. 本地管线
npx tsx agent/run-pipeline.ts --dry-run --limit=10

# 2. API 服务（供其他平台调用）
npx tsx agent/server.ts &
curl http://localhost:3456/api/agent/v1/status

# 3. MCP 服务（供AI客户端）
npx tsx agent/mcp-server.ts

# 4. 公网暴露（供云平台调用）
ngrok http 3456
```
