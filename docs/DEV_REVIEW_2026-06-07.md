# PriceCRE 开发改动回顾报告
## 时间范围：2026-06-03 ~ 2026-06-07（5天）

---

## 一、鉴权与权限系统重构 🔴 P0

### 1.1 解锁 API（`/api/assets/unlock`）
| 改动 | 说明 |
|------|------|
| 移除 DB 资产验证 | 原 `prisma.commercialProperty.findUnique` 对 mock ID（prop-001）返回 null → "资产不存在" |
| 鉴权模式 | NextAuth session 优先；未登录返回 `{ error: "请先登录", requireLogin: true }` + HTTP 401 |
| 额度不足 | 返回 `{ error: "额度不足", requirePurchase: true }` + HTTP 402 |
| 去假成功 | 删除未登录返回 `{ unlocked: true, remainingCredits: 99 }` 的伪造响应 |
| 字段修正 | `referralViewCount`/`purchasedViewCount` → `referralCredits`/`purchasedCredits`（Pg schema 真实字段） |
| 重复解锁检测 | 查 `UserViewLog`（userId+propertyId 唯一约束），已解锁不扣费 |

### 1.2 AI Chat API（`/api/ai/chat`）
| 改动 | 说明 |
|------|------|
| 鉴权回退 | session 失败 → body email 回退（兼容测试登录） |
| API 格式 | 自动检测 Anthropic vs OpenAI，非 OpenAI 直走 `/v1/messages` |
| 默认端点 | `https://mydamoxing.cn`（与 analyze API 一致） |
| 默认模型 | `MiniMax-M2.7-highspeed`（与 analyze API 一致） |
| 响应解析 | content 数组 find type===text（跳过 thinking 块） |
| 额度扣减容错 | try/catch 包裹 Prisma 操作，DB 不可用不阻塞对话 |

### 1.3 Chat-Quota API（`/api/ai/chat-quota`）
- GET 接受 `?email=` 参数回退鉴权

### 1.4 ProfilePanel 登录（`components/ProfilePanel.tsx`）
- 引入 `signIn("credentials")` + `signOut()`（NextAuth）
- 移除纯 localStorage 假登录
- 登出时调用 `signOut({ redirect: false })`
- 保留 localStorage fallback 兼容测试模式

### 1.5 SessionProvider
- `components/Providers.tsx` 新增 → `components/ClientLayout.tsx` 包裹

---

## 二、资产卡片权限与 UI 🟡 P1

### 2.1 登录/解锁三态逻辑（`components/PropertyCard.tsx`）
| 状态 | 按钮 | 点击行为 |
|------|------|------|
| 未登录 | 👤 需登录 | 跳转"我的"页面 |
| 已登录 + 有额度 | 🔓 解锁 | 消费额度 → 解锁资产 |
| 已登录 + 无额度 | ⚠ 额度不足 | showModal + 跳转购买页 |

### 2.2 Unlock 回调重构
- 删除 400ms 乐观假成功 → 改为 unlock-success/fail 事件驱动
- `openChat()` 加 `isLoggedIn` 守卫

### 2.3 页面级 401/402 处理（`app/page.tsx`）
- handleUnlock：移除 body.email → 纯 session cookie
- 处理后端 401/402 状态码 + requireLogin/requirePurchase flag
- 额度同步从本地计算改为服务端权威值（`/api/admin/user-credits`）
- 解锁失败 dispatch `unlock-fail` 事件，卡片停止 spinner

### 2.4 "已解锁资产" 计数
- 从 `creditStats.unlockCount ?? stats.unlocked` → 直接用 `stats.unlocked`（Set.size 实时）

---

## 三、AI 分析/对话系统

### 3.1 命名统一
| 旧 | 新 |
|------|------|
| AI 助理 | AI 分析师 |
| AI 分析 | AI 报告 |

### 3.2 头像
- 蓝紫渐变圆形 + 星光轨道 SVG（Gemini 风格）

### 3.3 AI 报告存储
| 改动 | 说明 |
|------|------|
| 存储模型 | `AiAnalysisCache`（Prisma 已有表） |
| cacheKey 格式 | `email:propertyId:timestamp` |
| 后台管理 | `/admin/ai-reports` 查看/展开报告 |
| 计数来源 | `AiAnalysisCache.count({ startsWith: email })` |
| 报告列表 | Prisma `startsWith` 过滤替代全量拉取+JS 过滤 |

### 3.4 AI 对话额度显示
| 位置 | 说明 |
|------|------|
| 移动端全屏底部 | `AI对话额度 已用/总额 + 进度条 + 剩余N + 购买按钮` |
| 桌面端侧栏底部 | 同上 |
| 头部重复 | 已删除（原先全屏头部也有） |

---

## 四、我的页面（ProfilePanel）

### 4.1 布局
- 删除 CreditPanel 组件（左侧）
- 单列居中 480px
- 保留：邀请好友 / 兑换码 / 商业付费直通车 / AI 对话

### 4.2 邀请链接
- 全部 `sz2026` 硬编码 → 动态 `myReferralCode`（localStorage 读取）
- 复制按钮加"已复制"绿色反馈

### 4.3 登录
- 改用 NextAuth `signIn("credentials")` 真实鉴权
- 登出调用 `signOut()`

---

## 五、Bug 修复

| Bug | 根因 | 修复 |
|------|------|------|
| 邀请弹窗重复出现 | 无条件弹 + 已登录也弹 | sessionStorage 记录 + 已登录跳过 |
| 未登录显示解锁数据 | unlockedIds 从 localStorage 无条件恢复 | 初始化读 pricecre_user，未登录返回空 Set |
| 登出数据残留 | logout 不清 unlockedIds/unlockedData | 登出清空 Set + Object + localStorage |
| 纠错图标不明显 | opacity:0.3 + #D4D4D4 | opacity:0.7 + #F59E0B 金色 |
| SSR 构建失败 | localStorage 在 Node.js 预渲染中不存在 | loadPersisted + unlockedIds init 加 typeof window 守卫 |
| 后台重复邀请码 | 菜单数组重复项 | 删除一行 |

---

## 六、核心文件改动清单

| 文件 | 改动级别 |
|------|------|
| `app/api/assets/unlock/route.ts` | 🔴 重写 |
| `app/api/ai/chat/route.ts` | 🔴 重写 |
| `app/api/ai/chat-quota/route.ts` | 🟡 修改 |
| `app/api/ai/save-report/route.ts` | 🟡 修改 |
| `app/api/ai/user-reports/route.ts` | 🟡 重写 |
| `app/api/ai/get-report/route.ts` | 🟡 重写 |
| `app/api/admin/ai-reports/route.ts` | 🟢 新增 |
| `app/api/admin/user-detail/route.ts` | 🟡 修改 |
| `components/PropertyCard.tsx` | 🔴 大量修改 |
| `components/PropertyChat.tsx` | 🔴 大量修改 |
| `components/ProfilePanel.tsx` | 🔴 重写登录 |
| `components/Providers.tsx` | 🟢 新增 |
| `components/ClientLayout.tsx` | 🟡 修改 |
| `app/page.tsx` | 🔴 大量修改 |
| `app/layout.tsx` | 🟡 修改 |
| `app/admin/layout.tsx` | 🟡 修改 |
| `app/admin/ai-reports/page.tsx` | 🟢 新增 |

---

## 七、遗留事项

1. **NextAuth 正式配置**：当前测试模式用 localStorage fallback，生产需完整 NextAuth + DB 配置
2. **地图页面**：MapView 组件存在但需验证 Leaflet CDN 加载和 marker 显示
3. **付费流程**：购买按钮跳转"我的"页面，实际支付 API 待完善
4. **AI 报告管理**：后台 `/admin/ai-reports` 页面已就位

---

**报告生成时间**：2026-06-07 22:25
**待用户确认后写回 PRD / ARCH / Board 文档**
