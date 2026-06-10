# 技术架构规范 (DeepSeek 自动化开发版)

## 1. 技术栈选型
- **前端核心**：Next.js 14 (App Router) + React + TypeScript
- **UI 框架**：Tailwind CSS + Shadcn/UI (仅用于处理弹窗、下拉等交互底层，视觉样式必须通过 Tailwind 强制缝合 V1 既有的 Apple 极简美学)
- **状态管理**：Zustand (用于客户端全局缓存当前选择城市、用户额度状态、Dark Mode 状态)
- **后端架构**：Next.js Server Actions (全面处理数据请求、扣额逻辑、裂变业务，免除 API 路由样板代码)
- **路由 Handler**：`app/api/pay/notify/route.ts` 专门用来接收支付网关的异步 POST Webhook 信号。
- **数据库**：PostgreSQL (通过 Supabase 托管，支持高并发商业订单及用户资产事务)
- **ORM 映射**：Prisma (提供全链路强类型安全，开发效率极高)
- **认证中心**：NextAuth.js (Auth.js)

## 2. 目录结构规范
- `/app`：路由与页面。使用 `(auth)` 处理登录路由，`rent/[city]` 处理商业地产多城市空间路由。
- `/components`：纯组件库。从 V1 原型中提取并重构的 `LiveHeader.tsx`, `NoticeBanner.tsx`, `PropertyCard.tsx`, `AuthDialog.tsx`。
- `/lib`：公共库。`prisma.ts`（数据库实例）、`pay.ts`（支付网关加签/解签核心逻辑）。
- `/types`：全局 TypeScript 强类型定义。
- `/prisma`：`schema.prisma`（定义数据模型与迁移规则）。

## 3. 数据库设计 (Prisma Schema)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 用户与资产表
model User {
  id              String        @id @default(uuid())
  email           String?       @unique
  phone           String?       @unique
  wechatOpenId    String?       @unique
  password        String
  vipLevel        Int           @default(0) // 0:普通用户, 1:VIP会员
  vipExpireTime   DateTime?
  bonusViewCount  Int           @default(3) // 剩余高价值租金数据查看次数
  myReferralCode  String        @unique // 系统自动生成的唯一邀请码
  createdAt       DateTime      @default(now())
  orders          Order[]
  viewLogs        UserViewLog[]
}

// 社交裂变关系表
model Referral {
  id            String   @id @default(uuid())
  referrerId    String   // 推荐人ID
  refereeId     String   @unique // 被推荐的新用户ID (一个新用户只能被推荐一次)
  rewardGranted Boolean  @default(false) // 防重发标记
  createdAt     DateTime @default(now())
}

// 商业订单表
model Order {
  id            String    @id @default(uuid())
  orderNo       String    @unique // 内部唯一订单号
  userId        String
  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  productType   Int       // 1:月卡, 2:季卡, 3:年卡
  amount        Decimal   @db.Decimal(10, 2)
  paymentMethod String    // wechat / alipay
  status        Int       @default(0) // 0:待支付, 1:已支付, 2:已失效
  tradeNo       String?   // 第三方流水号
  paidAt        DateTime?
  createdAt     DateTime  @default(now())
}

// 查看扣额日志表 (解决24小时内重复扣额痛点)
model UserViewLog {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  propertyId  String   // 关联的写字楼或商铺ID
  viewedAt    DateTime @default(now())

  @@index([userId, propertyId, viewedAt])
}

// 地产实况核心数据表
model CommercialProperty {
  id                 String   @id @default(uuid())
  projectName        String   // 项目案名
  city               String
  district           String
  rawAddress         String
  faceRent           Float    // 挂牌面价
  netEffectiveRent   Float    // 经算法修正后的真实市价 (高级数据)
  vacancyRate        Float    // 真实空置率 (高级数据)
  areaRange          String   // 面积区间
  dataSource         String   // 来源渠道
  updatedAt          DateTime @updatedAt

  @@unique([projectName, rawAddress])
}