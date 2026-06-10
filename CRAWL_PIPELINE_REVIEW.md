# 数据抓取与清洗链路 — 评估与重构说明（2026-06-10）

## 一、总体结论

**架构方向可行，不需要推倒重来。** 「抓取 → 质检 → 精算 → 审核队列 → 人工审核 → 主表」这条链路设计是对的，特别是人工审核兜底这一层，对"业务数据准确"的要求来说是必要的。本次重构修掉的是 6 个会让它在生产上跑不起来或产出脏数据的工程缺陷。

另外纠正此前梳理文档的两个误判：`/api/agent/crawl` 不是空壳（已串联 Tavily→质检→精算→入库）；定时抓取也已存在（vercel.json cron 每天 8:00 → /api/cron）。真正的问题在下面。

## 二、本次重构修复的问题

| # | 问题 | 修复 |
|---|------|------|
| 1 | **Cron 必超时**：单次调用循环跑全部任务，且用 SSR 直爬贝壳/安居客（机房 IP 被反爬，成功率≈0），每条资产串行 Exa+MiniMax | cron 改为「轮转批次」：每次只跑最久未跑的 3 个任务，多天滚动覆盖全部；执行路径换成 Tavily（机房可用）；`maxDuration=300` |
| 2 | **管线串行慢**：逐条顺序跑 Exa+MiniMax（单条最多 15s） | `p-limit(3)` 并发；无 API key 时整批快速跳过（不再逐条尝试-失败） |
| 3 | **uploader 服务器内自调 HTTPS**：在 Vercel 函数里再 POST pricecre.com/bulk-upsert，同批数据写两遍 | 检测 `process.env.VERCEL`，服务器环境只直写数据库；API 冗余通道仅本地 Agent 保留 |
| 4 | **review-queue 自建 PrismaClient**：serverless 冷启动连接堆积，打爆 Supabase 连接池 | 改用 `lib/prisma` 全局单例（本地 tsx 运行同样兼容） |
| 5 | **「均价」伪资产**：Tavily 提取不到楼名时造出"上海陆家嘴写字楼均价"假资产进审核队列 | 删除该回退逻辑——提取不到楼盘名就是没有楼盘级数据，宁缺毋滥 |
| 6 | **去重弱 + 假精度**：md5(楼名_地址) 地址不稳导致同楼重复；舆情失败时伪造 0.02/0.05 | 去重指纹改为 标准化楼名+城市（批内也去重）；舆情无数据→0、失败→null，不再伪造数值 |

新增 `agent/job-runner.ts`：cron 与 crawl-all 共用的唯一执行器，逻辑不再两处漂移。`/api/agent/crawl-all` 改为分批接口（body `{limit}`，返回 `remaining`，循环调用到 0 即全量完成）。

顺带修复：CSP `connect-src` 此前拦截了 ipapi.co / nominatim，导致前台"定位中"永远转圈，已放行。

## 三、各执行入口现状

| 入口 | 路径 | 适用场景 |
|------|------|---------|
| 后台单格抓取 | 爬取计划页格子 → POST /api/agent/crawl | 即时补某城市×业态，本来就是单任务粒度，serverless 安全 |
| 后台全量抓取 | 页面循环逐格调用（已有 800ms 间隔） | 人工触发全量 |
| 定时 | Vercel Cron 8:00 → /api/cron（轮转 3 个/天） | 无人值守滚动更新 |
| 分批全量 API | POST /api/agent/crawl-all {limit} | 脚本/外部调度循环调用 |
| 本地 Agent | `npx tsx agent/run-pipeline.ts [--tavily]` | 大批量、SSR 直爬（住宅 IP 成功率高于机房） |

## 四、数据准确性的诚实评估

要清楚 Tavily 链路的本质：**从搜索摘要里用正则抽楼名和价格**。它适合快速铺市场层面的覆盖，但楼盘级"挂牌面价"的精度天花板有限——价格可能来自摘要里不相干的上下文，楼名是按后缀词向前截 15 字猜的。这就是为什么人工审核队列不能省。

另外注意：精算指标（capRate/IRR/债务收益率等）大量依赖硬编码假设（LTV 0.6、租期 36 月、NOI 增速 2%、商圈基准价）。这些是「估算值」而非「抓取值」，confidenceScore 已体现（用默认基准时 0.75），前台展示时建议保持可信度标注。

## 五、后续升级路线（按性价比排序，本次未实施）

1. **LLM 结构化抽取替代正则**（性价比最高）：把 Tavily 返回的 content 交给大模型按 JSON Schema 抽取 `{楼名, 单价, 单位, 面积, 地址}`，比正则准确得多，改动只在 tavily-scraper 的 parse 层。已有 MiniMax 代理 key 可直接用。
2. **专业抓取服务**：Firecrawl / Crawl4AI 等可处理 JS 渲染和反爬，替代脆弱的 SSR 直爬；或在一台国内 VPS 上跑 Playwright worker 定时执行本地管线（住宅/商宅 IP + 真浏览器，成功率最高），结果走现有 bulk-upsert 上行。
3. **权威数据源**：戴德梁行/仲量联行/世邦魏理仕的季度市场报告 PDF（公开发布）做商圈级基准数据，比搜索摘要可靠一个量级；现有 pdf 解析能力可复用。
4. **运行日志表**：如需完整可观测性，加一张 PipelineRunLog（每次运行的输入/产出/耗时），需要 prisma migrate，建议与下次 schema 变更合并做。

## 六、部署注意

- 无 schema 变更，无需 migrate。
- 环境变量：`TAVILY_API_KEY`（抓取必需）、`CRON_SECRET`（定时必需）、`EXASEARCH_API_KEY` + `ANTHROPIC_API_KEY`（舆情，可缺省，缺省时该指标为 null）。
- `maxDuration=300` 需要 Vercel 账号支持（Hobby 配合 Fluid Compute 也可达 300s；若被平台封顶会自动取上限）。
