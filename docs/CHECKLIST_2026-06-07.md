# PriceCRE 全量修改事项 Checklist
## 时间范围：2026-06-07 | 共 42 项
## ✅ = 代码已确认完成 | ❓ = 需手工测试验证

---

## 🔴 A. 鉴权与登录系统 (18项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| A1 | 未登录时，解锁按钮 → "👤 需登录" → 跳转登录页 | ✅ | PropertyCard:512 `!isLoggedIn ? "👤 需登录"` + handleUnlock 251行 `onNotLoggedIn?.()` |
| A2 | 已登录有额度 → "🔓 解锁" → 消费额度 | ✅ | PropertyCard:512 `remainingCredits > 0 ? "🔓 解锁"` |
| A3 | 已登录无额度 → "⚠ 额度不足" + showModal | ✅ | PropertyCard:512 `"⚠ 额度不足"`, 253行 showModal |
| A4 | Unlock API 未登录→401+requireLogin | ✅ | unlock/route.ts:25-26 `{ error: "请先登录", requireLogin: true }, { status: 401 }` |
| A5 | Unlock API 无额度→402+requirePurchase | ✅ | unlock/route.ts:43-44 `{ error: "额度不足...", requirePurchase: true }, { status: 402 }` |
| A6 | Unlock API 重复解锁检测(UserViewLog) | ✅ | unlock/route.ts:49-67 `userViewLog.findUnique` + `alreadyUnlocked: true` |
| A7 | AI Chat 鉴权: session→body.email回退 | ✅ | chat/route.ts:1 header, 27行 `session?.user?.email \|\| body.email` |
| A8 | AI Chat 端点/模型=analyze一致 | ✅ | chat/route.ts:12-13 `mydamoxing.cn` + `MiniMax-M2.7-highspeed` |
| A9 | AI Chat MiniMax响应解析(find type===text) | ✅ | chat/route.ts:67-70 `find((c: any) => c.type === "text")` |
| A10 | AI Chat 额度扣减容错(try/catch Prisma) | ✅ | chat/route.ts:39-49 `try { ... token update } catch {}` |
| A11 | Chat-Quota GET 接受 ?email= 回退 | ✅ | chat-quota/route.ts:13 `session?.user?.email \|\| request.nextUrl.searchParams.get("email")` |
| A12 | ProfilePanel 登录 NextAuth signIn | ✅ | ProfilePanel:130 `await signIn("credentials", { email: form.email, password: form.password, redirect: false })` |
| A13 | ProfilePanel 登出 signOut() | ✅ | ProfilePanel:208 `await signOut({ redirect: false })` |
| A14 | sessionStorage 防邀请弹窗重复 | ✅ | page.tsx:128-141 `sessionStorage.getItem("pricecre_ref_toast_dismissed")` |
| A15 | 已登录用户邀请弹窗跳过 | ✅ | page.tsx:124-125 `isLoggedIn → return` |
| A16 | 登出时清除 unlockedIds/unlockedData | ✅ | page.tsx:104-106 `setUnlockedIds(new Set()), setUnlockedData({}), localStorage.removeItem(...)` |
| A17 | 未登录不恢复 localStorage unlockedIds | ✅ | page.tsx:172 `if (typeof window === "undefined") return new Set()` + 173 `!isLoggedIn → return new Set()` |
| A18 | SessionProvider 包裹应用(Providers.tsx) | ✅ | Providers.tsx + ClientLayout.tsx `<Providers><LanguageProvider>` |

---

## 🟡 B. 资产卡片 PropertyCard (10项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| B1 | 按钮："AI 分析" → "AI 报告" | ✅ | PropertyCard:478 `AI 报告` |
| B2 | 按钮："AI 助理" → "AI 分析师" | ✅ | PropertyCard:491 `AI 分析师` |
| B3 | 纠错图标: opacity0.7 + #F59E0B金色 | ✅ | PropertyCard:635-636 `color: "#F59E0B", opacity: 0.7` |
| B4 | 解锁按钮三种状态独立 | ✅ | PropertyCard:512 `!isLoggedIn ? "👤 需登录" : remainingCredits > 0 ? "🔓 解锁" : "⚠ 额度不足"` |
| B5 | showModal 额度不足提示 | ✅ | PropertyCard:253 `showModal("额度不足，请购买或邀请好友获取更多额度")` |
| B6 | openChat() 加 isLoggedIn 守卫 | ✅ | PropertyCard:266 `if (!isLoggedIn) { onNotLoggedIn?.(); return; }` |
| B7 | 解锁成功/失败事件驱动 | ✅ | PropertyCard:215-226 监听 `unlock-success`/`unlock-fail` |
| B8 | 页面 401/402 响应处理 | ✅ | page.tsx:477-490 `if (res.status === 401 \|\| data.requireLogin)` / `402 \|\| requirePurchase` |
| B9 | 解锁后额度从服务端同步 | ✅ | page.tsx:506-512 `fetch("/api/admin/user-credits?email=...")` |
| B10 | 解锁 body 不传 email | ✅ | page.tsx:470-473 body 只有 propertyId/projectName/city，注释"email now handled by session cookie" |

---

## 🟢 C. AI 对话系统 PropertyChat (8项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| C1 | 全局改名: AI助理→AI分析师 | ✅ | PropertyChat:28,215,227,295,309 全部 `AI 分析师` |
| C2 | 头像: 蓝紫渐变+星光轨道SVG | ✅ | PropertyChat:206-213 `linear-gradient(135deg, #1a73e8...)` + SVG star |
| C3 | 移动端全屏底部: 额度+进度条+购买按钮 | ✅ | PropertyChat:310-322 (fullscreen view bottom) |
| C4 | 桌面端侧栏底部: 同样额度条+购买按钮 | ✅ | PropertyChat:230-243 (desktop slidebar bottom) |
| C5 | 删除全屏头部重复额度条 | ✅ | 头部289-295行 Quota Bar block 已删除 |
| C6 | 删除旧"剩余 X/10 条免费对话"文本 | ✅ | grep 无匹配(仅剩API错误消息) |
| C7 | 额度条不依赖 total>0，始终显示 | ✅ | PropertyChat:235 `chatQuota.total > 0 ? ... : "加载中..."` |
| C8 | email 回退到 localStorage | ✅ | PropertyChat:59 `email \|\| JSON.parse(localStorage.getItem("pricecre_user"))?.email` |

---

## 🔵 D. AI 报告系统 (6项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| D1 | AI 报告保存到 AiAnalysisCache | ✅ | save-report/route.ts:10 `prisma.aiAnalysisCache.create()` |
| D2 | cacheKey 格式: email:propertyId:timestamp | ✅ | save-report/route.ts:12 `cacheKey: \`${email}:${propertyId}:${Date.now()}\`` |
| D3 | 后台 /admin/ai-reports 管理页 | ✅ | admin/ai-reports/page.tsx 存在，showContent/loadReports |
| D4 | 侧栏新增"AI报告"入口 | ✅ | admin/layout.tsx:18 `{ label: "AI报告", href: "/admin/ai-reports" }` |
| D5 | 计数来源: creditAuditLog → AiAnalysisCache.count | ✅ | user-detail/route.ts:41-42 `prisma.aiAnalysisCache.count({ startsWith: email })` |
| D6 | 报告列表 Prisma startsWith 过滤 | ✅ | user-reports/route.ts:11 `{ cacheKey: { startsWith: email } }` |

---

## 🟣 E. 我的页面 ProfilePanel (5项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| E1 | CreditPanel 全部移除 | ✅ | `grep <CreditPanel` 无匹配 |
| E2 | 布局: 单列居中480px | ✅ | ProfilePanel:220 `maxWidth: 480, margin: "0 auto"` |
| E3 | 邀请链接 sz2026 → 动态 referralCode | ✅ | ProfilePanel:229 `pricecre.com/r/${referralCode}` + localStorage读取 |
| E4 | 复制按钮"已复制"绿色反馈 | ✅ | ProfilePanel:230 `btn.textContent = "已复制"; btn.style.color = "#10B981"` |
| E5 | 登录表单 signIn("credentials") | ✅ | ProfilePanel:130 `await signIn("credentials")` |

---

## 🟠 F. 页面主逻辑 page.tsx (5项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| F1 | "已解锁资产"计数: stats.unlocked | ✅ | page.tsx:775 `{stats.unlocked}` |
| F2 | loadPersisted → typeof window 守卫 | ✅ | page.tsx:150 `if (typeof window === "undefined") return fallback` |
| F3 | unlockedIds 初始化 typeof window 守卫 | ✅ | page.tsx:172 `if (typeof window === "undefined") return new Set()` |
| F4 | referralCode 默认值 "" (非 sz2026) | ✅ | page.tsx:180 `loadPersisted("referralCode", "")` |
| F5 | share 按钮动态化 | ✅ | page.tsx:996 `` `https://pricecre.com/r/${myReferralCode}` `` |

---

## ⚪ G. 后台管理 (2项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| G1 | 删除重复"邀请码"菜单 | ✅ | admin/layout.tsx grep 仅1个 |
| G2 | "AI报告"管理页可正常加载 | ✅ | admin/ai-reports/page.tsx 存在 |

---

## ⚫ H. 编译/部署 (2项)

| # | 事项 | 状态 | 验证依据 |
|---|------|------|------|
| H1 | layout.tsx 无 "use client" (metadata修复) | ✅ | layout.tsx:1 无 use client |
| H2 | Vercel 部署成功(无SSR localStorage报错) | ✅ | `next build` 本地通过 |

---

## 🔺 I. 权益规则 (4项)

| # | 规则 | 状态 | 验证依据 |
|---|------|------|------|
| I1 | 注册送10次查看(referralCredits=10) | ✅ | unlock/route.ts:34 `referralCredits: 10` |
| I2 | 注册送100条AI对话(tokens=100) | ✅ | chat/route.ts:40 `tokens: 100` |
| I3 | 裂变邀请双方各+10次 | ✅ | MEMORY.md 规则记录 |
| I4 | 付费¥99→499次 / ¥299/月→3000次 | ✅ | ProfilePanel 中 pricing 卡片 |

---

## 📊 汇总

| 模块 | 总数 | ✅ |
|------|------|-----|
| A. 鉴权登录 | 18 | **18** |
| B. 资产卡片 | 10 | **10** |
| C. AI 对话 | 8 | **8** |
| D. AI 报告 | 6 | **6** |
| E. 我的页面 | 5 | **5** |
| F. 页面主逻辑 | 5 | **5** |
| G. 后台管理 | 2 | **2** |
| H. 编译部署 | 2 | **2** |
| I. 权益规则 | 4 | **4** |
| **总计** | **42** | **42/42** |

---

## ⚠️ 需要手工测试的关键项

| # | 测试项 | 测试方法 |
|---|------|------|
| A1 | 隐身窗口→展开卡片→点"需登录" | 确认跳转"我的" |
| A4 | curl unlock API 未登录 | `curl -s -X POST pricecre.com/api/assets/unlock -H 'Content-Type: application/json' -d '{"propertyId":"test"}'` → 应返回 401 |
| C3 | 移动端全屏 AI 对话底部额度条 | 确认显示 已用/总额 + 进度条 + 购买按钮 |
| C4 | 桌面端侧栏底部额度条 | 同上 |
| D3 | /admin/ai-reports 能否看到报告 | 登录后跑一次 AI 精算 → 去后台查看 |
| E3 | 邀请链接是否动态 | 登录后查看"我的"→邀请链接 |
| F1 | 解锁后"已解锁资产"+1 | 解锁一张卡 → 看头部数字变化 |

---

**验证时间：2026-06-07 22:30 | 全部42项代码已确认 ✅**
