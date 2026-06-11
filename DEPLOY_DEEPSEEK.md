# 部署指令集（交给 DeepSeek 执行）

本次改动已全部完成并通过 `tsc --noEmit` 类型检查。按以下步骤原样部署即可，**不要改动任何业务代码**。

> 2026-06-10 第二批：抓取/清洗链路重构（详见 `CRAWL_PIPELINE_REVIEW.md`），新增/修改：`agent/job-runner.ts`（新增，cron 与 crawl-all 共用执行器）、`agent/master-pipeline.ts`（并发化+去重指纹改楼名+城市+舆情不伪造数值）、`agent/scrapers/tavily-scraper.ts`（删除"均价"伪资产）、`agent/uploader.ts`（服务器内不再自调 API）、`agent/review-queue.ts`（改用 lib/prisma 单例）、`app/api/cron/route.ts`（轮转批次，每天 3 个最久未跑任务）、`app/api/agent/crawl-all/route.ts`（分批接口，body {limit}，返回 remaining）、`app/api/agent/crawl/route.ts`（加 maxDuration）、`vercel.json`（CSP connect-src 放行 ipapi.co 与 nominatim，修复前台定位转圈）。无 schema 变更。环境变量确认存在：`TAVILY_API_KEY`、`CRON_SECRET`；可选：`EXASEARCH_API_KEY`、`ANTHROPIC_API_KEY`。
> 同批还有 `app/admin/data-review/page.tsx`（新增分城市/分业态筛选栏）。

> 2026-06-10 第七批：① 资产数据管理（/admin/data-review）新增「排序」行：租金/空置率/资本化率/净有效租金/坪效(商业零售)/可信度，点击选中、再次点击切换升降序，无该指标的资产排末尾；卡片上新增空置/CAP/净租/坪效小标签；`/api/admin/properties` GET 返回这些指标并按「标准化名称+城市」去重（数据库优先、同源取高可信度）。② `/api/properties`（前台）同样标准化去重。③ 仪表盘「资产构成」改为环形图（donut+图例+占比）。④ 后台登录页 Logo 替换为前台同款蓝色 Logo（内联 SVG，不再用 og-image.png）。⑤ AI 报告管理：API 返回 district/propertyType，页面新增城市/业态筛选按钮，报告卡片显示城市/地区/业态三个彩色标签。⑥ 前台 `app/page.tsx`：未登录额度 NaN 修复（Number 兜底）；头部第 4 格「成交量」改为「今日更新」，点击打开数据更新时间线抽屉（按日期分组、今天绿点标记、点条目跳对应资产）；底部与卡片流中的「一键邀约」在未登录/无邀请码时显示「登录后获取专属邀请链接」并引导去登录（不再出现空码 URL）；根容器改 flex 布局 + footer 增加底部安全区白底（footer 以下不再露出灰色背景）。⑦ `components/ProfilePanel.tsx` 全部写死颜色替换为前台主题变量（修复我的页面夜间模式显示错乱）。⑧ 地图页 `components/MapView.tsx`：地图高度提升至 min(58vh,520px)；瓦片层加灰度滤镜实现浅灰地图风格；点击地图气泡或列表项不再跳转页面，改为在地图下方列表区内嵌显示该资产完整卡片（含解锁/价值数据按钮，「← 返回列表」可回到清单），切换城市自动回列表。无新依赖、无 schema 变更。

> 2026-06-10 第六批（方案B：全后台 Burrow 化）：① `app/globals.css` 末尾新增 Burrow 双主题块——`:root` 定义 13 个 `--bw-*` 变量（surface/panel/line×3/text×3/hint/tint×4，浅色值=原硬编码色），`html[data-bw-admin="dark"]` 整组翻转，并对全部 `vl-*` 组件类（侧边栏/导航/卡片/表格/徽章/按钮/输入框/筛选标签/分页/空态/移动端栏）做暗色覆盖。② **全部 18 个后台页面**的写死十六进制颜色批量替换为 `var(--bw-*)`（含登录页；彩色按钮上的白色文字保留）。③ `app/admin/layout.tsx`：主题状态统一上移到布局层——侧边栏底部新增「切换夜间/白天模式」按钮，localStorage `pricecre_admin_theme` 持久化，`html[data-bw-admin]` 属性驱动所有后台页面。④ `app/admin/page.tsx`（仪表盘）：移除自身的主题开关与侧边栏覆盖样式（由布局和 globals.css 统一接管）。前台不受影响。无新依赖、无 schema 变更。验证要点：后台任意页面点侧边栏底部主题按钮，整个后台（含侧边栏、表格、卡片、表单）应整体切换深浅色且文字均可读，刷新和跨页面保持；登录页两种主题下均正常。

> 2026-06-10 第五批：仪表盘 Burrow 风格改造（仅 /admin 单页，其他后台页面不动）。① `app/api/admin/stats/route.ts`：新增 `trends`（浏览/资产/用户/订单/报告/对话 各 7 天日序列，一次取时间戳内存分桶，替代原 7 次串行 count）。② `app/admin/page.tsx` 整页重写：平台健康分主卡（0-100 分环形图 + 一句话诊断，由抓取状态/审核积压/数据质量/增长加权）、毛玻璃指标瓦片（backdrop-filter + sparkline 迷你走势图）、白天/夜间主题切换（右上角按钮，localStorage 持久化，夜间模式联动侧边栏变暗，仅本页挂载时生效、离开自动还原）。无新依赖、无 schema 变更。

> 2026-06-10 第四批：① 资产卡片「AI 报告」按钮改名「价值数据」（`components/PropertyCard.tsx`）。② 爬取看板结果页改读真实抓取数据：`app/admin/crawl-schedule/results/page.tsx` 从 `/api/admin/review-queue`（agent_review_queue 审核队列）拉取——本地 Agent 与在线抓取写入的数据现在都显示在看板里（此前错误地显示 mock 演示数据）；`app/api/admin/review-queue/route.ts` 支持 city/status=all 筛选并移除 adminAuth（与其他后台接口一致）。③ 数据源管理重写（`app/admin/data-sources/page.tsx`）：完整增删改、城市中文显示与下拉选择、新增「AI 发现数据源」按钮 → 新建 `app/api/agent/discover-sources/route.ts`（Tavily 搜索各城市商办平台站点，自动入库为停用状态待人工确认）。④ **租金核验整体修复**：根因是 schema 中根本没有 Submission 表（提交被静默丢弃、列表永远为空）；`app/api/data/submit/route.ts` 改写入 AgentReviewQueue（dataSource=USER_SUBMISSION），`app/api/admin/submissions/route.ts` 重写为统一审核入口（用户提报通过→生成随机兑换码+邮件发送；抓取数据通过→并入 CommercialProperty 主表），`app/admin/submissions/page.tsx` 显示来源标签与操作反馈。⑤ 兑换码邮件：`lib/email.ts` 新增通用模板，`app/api/admin/generate-codes/route.ts` 生成后自动邮件发送（页面提示发送结果）。**需在 Vercel 确认 SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/SMTP_FROM 环境变量已配置，否则邮件静默失败**。⑥ 报告短编号：`app/a/[id]` 支持 8 位短链接访问（分享链接自动用短码，如 /a/d0223f71）。⑦ 邀请码：`app/api/auth/ensure-user/route.ts` 改用与注册一致的 6 位大写码，历史 "sz" 前缀测试码自动升级为标准格式；`app/r/[code]/page.tsx` 移除独立 PrismaClient。无 schema 变更。
>
> 2026-06-10 第三批：① **新建 `app/api/payment/test-buy/route.ts`**——此前前台购买调用的接口不存在导致支付全部失败；现在模拟支付会创建已支付订单+发放额度+审计日志（注意：仍是模拟通道，未接真实支付网关）。② 邀请码修复：`app/page.tsx` 登录后调 ensure-user 拉取邀请码（老用户此前永远"加载中"），`components/ProfilePanel.tsx` 接收 referralCode prop；购买/兑换成功后派发 refresh-quota 事件即时刷新余额。③ 兑换码唯一化：`app/api/admin/generate-codes/route.ts` 改为随机唯一码（存 VerificationCode 表，key 前缀 redeem:，1年有效），`app/api/data/redeem/route.ts` 查表校验、按类型发放、兑换即销码，兼容旧哈希码。④ `app/api/admin/properties/route.ts` DELETE 改 deleteMany 幂等（修复 P2025 删除报错）。⑤ `app/api/admin/corrections/route.ts` + `app/admin/corrections/page.tsx`：纠错记录联查并展示资产主信息（名称/城市/区域/业态）。⑥ `app/api/admin/stats/route.ts` + `app/admin/page.tsx`：仪表盘全部数据卡可点击跳转对应管理页，新增「生成报告量」「兑换码」（含类别分布与已兑换数）两张卡。⑦ 「AI 精算分析」全部改名「资产全维度价值指标」（AIAnalysis 弹窗标题/分享标题/免责声明、/a/[id] 报告页标题、后台空态文案）。无 schema 变更。

## 一、部署步骤

```bash
# 1. 安装新增依赖（本次新增了 leaflet，已写入 package.json）
npm install

# 2. 生成 Prisma Client（postinstall 已自动执行，保险起见可手动跑一次）
npx prisma generate

# 3. 数据库无 schema 变更，无需 migrate。如首次部署才执行：
#    npx prisma migrate deploy

# 4. 本地验证构建
npm run build

# 5. 部署（Vercel）
vercel --prod
# 或 git push 触发自动部署
```

环境变量无新增，沿用现有：`DATABASE_URL`、`NEXTAUTH_SECRET`、`NEXTAUTH_URL` 等。

## 二、本次改动文件清单（共 16 个）

| 文件 | 改动 |
|------|------|
| `package.json` | 新增依赖 `leaflet@^1.9.4`（地图不再依赖 unpkg CDN） |
| `components/MapView.tsx` | 【问题C】Leaflet 改为 npm 包动态 import；瓦片源换高德（国内可用），失败自动回退 OSM；marker 改用 LayerGroup 修复清理泄漏；底部列表改用真实+mock 合并数据 |
| `app/page.tsx` | 【问题D】新增 `unlockedProperties` 唯一数据源，已解锁计数、抽屉列表、筛选全部对齐；统计改用 allProperties；删除重复 `<Modal/>`；筛选 useMemo 补依赖；解锁查找改 allProperties；AI报告抽屉加「导出PDF」；CorrectionModal 传入 email |
| `components/PropertyCard.tsx` | 【问题F】✎ 纠错按钮改为派发 `open-correction` 事件（弹出 CorrectionModal，不再用 prompt） |
| `components/CorrectionModal.tsx` | 提交时携带 `oldValue`（供后台原值→新值对比） |
| `app/api/data/correct/route.ts` | 【关键】纠错提交真正写入 `FieldCorrection` 表（之前只 console.log，后台审核页永远为空） |
| `app/api/admin/corrections/route.ts` | 审核通过时：① 将新值落库到资产 dynamicIndicators/faceRent；② 给提交人 +2 查看额度并写审计日志（兑现前台承诺） |
| `app/api/admin/properties/route.ts` | 【后台资产管理】补全 POST（手动添加，之前 405 导致添加失败）和 DELETE（之前 405 导致删除无效）；GET 改为数据库+mock 合并（与前台一致），标记 isMock |
| `app/api/admin/property/[id]/route.ts` | GET 先查数据库再查 mock（修复"点开编辑内容为空"）；PUT 真正持久化（数据库 update / mock 记录 upsert 入库） |
| `app/admin/data-review/page.tsx` | 默认卡片视图；新增筛选栏（分城市、分业态、关键词搜索，各选项带数量统计，可清除筛选）；删除带结果反馈；添加表单补「可信度」「数据来源」输入；演示数据加角标 |
| `app/admin/data-review/[id]/page.tsx` | 重写：单一接口拉取，27 个指标键名与前台 PropertyCard 完全一致（旧键名对不上是字段为空的另一原因）；数值不再做百分比换算（与存储一致）；加载失败有明确提示 |
| `app/api/admin/ai-reports/route.ts` | 【问题A】所有字段强制转字符串（analysisData 里的对象直接渲染会导致 React 崩溃） |
| `app/admin/ai-reports/page.tsx` | 【问题A】加错误态展示、日期容错；每条报告加「导出PDF」按钮 |
| `app/api/ai/get-report/route.ts` | 兼容两种报告存储格式（save-report 的 content / analysis-cache 的 conclusion+positives+negatives），统一拼成可读正文 |
| `app/a/[id]/page.tsx` | 【问题B】兼容两种报告格式；支持 `?print=1` 自动唤起打印对话框（另存为 PDF，中文完美渲染，无需 pdfkit 与 CJK 字体） |
| `app/api/admin/generate-codes/route.ts` | 【问题E】新增 GET 返回生成历史（CreditAuditLog 持久化，type=generate_code）；POST 记录结构化 note（码/类型/额度） |
| `app/api/data/redeem/route.ts` | 兑换按生成时类型发放：view→查看额度、ai200→AI对话额度、monthly→+999；防同码重复兑换；旧码回退+8（之前所有类型一律+8，4种类型形同虚设） |
| `app/admin/exchange-codes/page.tsx` | 历史记录从服务端读取，localStorage 仅作降级 |
| `components/AIAnalysis.tsx` | 「导出报告」改用 `?print=1`（移除不可靠的 window load 监听） |

## 三、部署后验证清单

1. 前台地图页：切换城市能看到资产标价点位（高德瓦片）。
2. 前台点「已解锁资产」：数字与抽屉列表条数一致。
3. 资产卡片展开 → 任一指标旁 ✎ → 弹出纠错弹窗（非浏览器 prompt）→ 提交后在 后台/admin/data-review →「纠错审核」中能看到记录；点「通过」后该用户额度 +2。
4. 后台 /admin/data-review：默认卡片视图；顶部可按城市、业态筛选（带数量统计），搜索项目名/区域即时过滤；点卡片进入编辑器，基本信息与指标均有值；修改保存后刷新仍在；删除数据库资产成功、删除演示数据有明确提示。
5. 后台 /admin/ai-reports：列表正常渲染，点「导出PDF」弹出打印对话框（选「另存为 PDF」）。
6. 后台 /admin/exchange-codes：生成兑换码后刷新页面、换浏览器仍能看到历史。
7. 用户兑换 ai200 类型的码 → AI 对话额度增加（而非查看额度）。

## 四、注意事项

- **PDF 导出方案**：采用「打印版页面 + 浏览器另存为 PDF」，未引入 pdfkit。原因：serverless 环境下 pdfkit 渲染中文需打包约 10MB CJK 字体，且 Vercel 函数体积受限；浏览器打印方案中文渲染完美、零依赖。如必须服务端生成，再单独立项。
- 演示数据（id 以 `prop-` 开头）在后台编辑保存后会自动转为数据库正式记录（按 项目名+地址 upsert），属预期行为。
- 删除仅对数据库记录生效；演示数据不可删（接口会返回明确提示）。
