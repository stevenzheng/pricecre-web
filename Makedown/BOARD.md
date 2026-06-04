# 项目状态看板 (BOARD.md)
# 版本：v5.0 — 2026年6月4日更新 | 全字段词典对齐版

## 0. 数据字段词典（Agent 开发基准）
> **必读**: [DATA_DICTIONARY.md](./DATA_DICTIONARY.md) — 47项精算指标完整定义、业态映射矩阵、API写入格式、数据质量规则。本地抓取Agent开发以此为唯一数据契约。

## 1. 已完成（前端 v4.x 全量交付）

| 模块 | 状态 | 说明 |
|------|------|------|
| PropertyCard 组件 | ✅ | useReducer状态机 + useMemo算力缓存 |
| 47项指标动态渲染 | ✅ | 按OFFICE/SHOPS/INDUSTRIAL动态过滤跨赛道冗余字段 |
| 261条真实物业数据 | ✅ | 9城，正确行政区映射，正确经纬度坐标 |
| 双主题系统 | ✅ | Light/Dark CSS变量驱动 |
| 四Tab单页应用 | ✅ | 行情/地图/互享/我的 |
| Leaflet地图 | ✅ | 区级坐标标记 + 9城切换 |
| AI精算分析 | ✅ | MiniMax-M2.7真模型（Anthropic协议） |
| 微信卡片分享 | ✅ | QR码 + 朋友圈按钮 |
| 裂变邀请路由 | ✅ | /r/[code] → toast提示 |
| OG元数据 | ✅ | 1200×630 PNG + og/twitter/wechat标签 |
| 地理位置自动筛选 | ✅ | GPS→Nominatim→ipapi→ip-api四级fallback |
| 筛选栏吸顶 | ✅ | sticky top-[56px] + 业态图标+数量 |
| 底部导航 | ✅ | 4Tab + 安全区 + 10px微信间距 |
| Vercel自动部署 | ✅ | GitHub push → Vercel build |
| 法律页面 | ✅ | /terms /privacy /contact |

---

## 2. 下一步工作（按优先级）

### 🔴 P0 — 打通数据库（核心闭环）

| 次序 | 任务 | 说明 |
|------|------|------|
| 1 | **部署 Prisma Schema 到 Supabase** | `npx prisma db push`，建GIN索引和JSONB约束 |
| 2 | **资产解锁 Server Action** | 替换前端mock解锁为真实服务端扣减额度 |
| 3 | **多端额度 Overwrite** | 解锁响应强制返回最新额度，Zustand覆盖本地值 |
| 4 | **Agent 批量并网 API** | `/api/agent/v1/bulk-upsert` 对接真实数据上行 |

### 🟡 P1 — 用户系统

| 次序 | 任务 | 说明 |
|------|------|------|
| 5 | **NextAuth 真实登录** | 替换前端mock，对接Supabase User表 |
| 6 | **微信OAuth登录** | 微信开放平台配置 + API对接 |
| 7 | **裂变邀请闭环** | 注册时读取localStorage邀请码→双方+3额度→写入Referral表 |

### 🟢 P2 — 商业化

| 次序 | 任务 | 说明 |
|------|------|------|
| 8 | **微信/支付宝支付** | 99元/50次购买额度真实支付 |
| 9 | **Admin 后台** | RBAC权限 + 数据管理面板 |
| 10 | **数据每日更新** | 自动化爬虫 + 定时任务 |

---

## 3. 已知问题

- **额度同步脱节**：当前额度存于客户端useState，刷新丢失。对策：次序3完成后，额度由服务端权威托管。
- **跨赛道字段冗余**：已通过 `sortedFields` 按 propertyType 动态过滤解决 ✅
- **微信朋友圈缓存**：OG已配置正确PNG，但微信有24h缓存周期。已添加 `?t=` 参数绕过机制。
- **数据为静态文件**：261条从 `mock-data.ts` 加载，非数据库实时读取。次序1完成后迁移。
