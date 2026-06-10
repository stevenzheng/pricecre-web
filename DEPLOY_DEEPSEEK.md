# 部署指令集（交给 DeepSeek 执行）

本次改动已全部完成并通过 `tsc --noEmit` 类型检查。按以下步骤原样部署即可，**不要改动任何业务代码**。

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
