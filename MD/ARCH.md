# PriceCRE 技术架构文档 (ARCH)
## 版本：v4.0.0 — 2026年6月4日

---

## 1. 运行时

| 组件 | 版本/配置 |
|------|----------|
| Node.js | 22 LTS |
| Next.js | 14.2.35 (App Router) |
| React | 18.x |
| TypeScript | 5.x (strict) |
| Prisma | 6.19.3 |
| PostgreSQL | Supabase (`nxyetjiandxmfvhprxbm`) |
| Tailwind CSS | 3.4 |
| MiSans | 4.0.0 (jsDelivr CDN) |
| Leaflet | 1.9.4 (unpkg CDN) |

## 2. 目录结构

```
app/
├── layout.tsx          # 根布局 + viewport 配置
├── page.tsx            # 主行情页(四Tab)
├── globals.css         # 全局样式 + 双主题
├── terms/page.tsx      # 服务条款
├── privacy/page.tsx    # 隐私政策
├── contact/page.tsx    # 联系我们
├── api/
│   ├── auth/register/  # 邮箱注册 API
│   ├── auth/verify/    # 邮箱验证 API
│   ├── agent/v1/       # Agent 批量上行 API
│   └── payment/test-buy/ # 测试购买 API
components/
├── PropertyCard.tsx    # 资产卡片(收起/展开)
├── HamburgerMenu.tsx   # 汉堡侧边栏
├── MobileNav.tsx       # 底部导航
├── CreditPanel.tsx     # 额度弹窗
├── MapView.tsx         # Leaflet 地图
├── ShareCenter.tsx     # 互享页面
├── ProfilePanel.tsx    # 我的页面
├── ThemeToggle.tsx     # 明暗切换
├── LanguageToggle.tsx  # 中英切换
├── Toast.tsx           # Modal/Toast 弹窗
└── WechatCard.tsx      # 微信卡片生成
lib/
├── i18n.ts             # 语言包(100+条)
├── LanguageContext.tsx # 语言上下文
├── email.ts            # SMTP 邮件发送
├── mock-data.ts        # 模拟数据(15条)
├── auth.ts             # NextAuth 配置
└── store.ts            # Zustand 状态
prisma/
└── schema.prisma       # 数据库模型
types/
└── indicators.ts       # 47项 DynamicIndicators
```

## 3. 数据库 Schema (Prisma)

```prisma
datasource db { provider = "postgresql" }
model User { ... }
model CommercialProperty { propertyType PropertyType; dynamicIndicators Json; ... }
model FieldMetadata { ... }
model Referral { ... }
model Order { paymentMethod String; ... }
model UserViewLog { @@unique([userId, propertyId]) }
```

## 4. 双主题 CSS 变量

| 变量 | 用途 |
|------|------|
| `--bg` / `--bg-surface` / `--bg-nav` | 背景层级 |
| `--text` / `--text-strong` / `--text-muted` / `--text-hint` | 文字层级 |
| `--accent` / `--accent-soft` / `--accent-border` | 主色调 |
| `--positive` / `--negative` / `--warning` | 状态色 |
| `--line` / `--panel` | 边框/面板 |

## 5. 部署

- **GitHub**: `stevenzheng/pricecre-web` (main 分支)
- **Vercel**: CLI 部署 `npx vercel --prod --yes`
- **环境变量**: DATABASE_URL, DIRECT_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, AGENT_SYNC_TOKEN
