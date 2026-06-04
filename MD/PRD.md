# PriceCRE 产品需求文档 (PRD)
## 版本：v4.0.0 — 2026年6月4日更新

---

## 1. 项目概述

**PriceCRE** 是商业地产量化精算资产终端。覆盖写字楼、商业零售、产业园三大赛道，提供18维47项资产精算指标。支持双主题(明/暗)、中英双语、地图定位、社交裂变增长飞轮。

**域名**: https://pricecre.com
**版本**: v3.0.0_MODULAR

---

## 2. 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Next.js (App Router) | 14.2.35 |
| UI | React + Tailwind CSS | 18.x / 3.4 |
| 字体 | MiSans (CDN) | 4.0.0 |
| 数据库 | Prisma + Supabase PostgreSQL | 6.19.3 |
| 认证 | NextAuth v4 | 4.24 |
| 状态管理 | Zustand | 5.0 |
| 部署 | Vercel + GitHub | - |
| 地图 | Leaflet + CartoDB | 1.9.4 |
| 支付 | 微信 JSAPI / 支付宝 | 待对接 |

---

## 3. 页面结构

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | 行情看板 | 四Tab单页应用：行情/地图/互享/我的 |
| `/terms` | 服务条款 | 法律页面 |
| `/privacy` | 隐私政策 | 法律页面 |
| `/contact` | 联系我们 | 法律页面 |

### 3.1 Tab 页面

| Tab | 功能 |
|-----|------|
| 行情 | 资产卡片列表、城市/业态筛选、汉堡菜单、额度弹窗 |
| 地图 | Leaflet 灰度地图、城市切换、资产标记气泡 |
| 互享 | 数据提报、兑换码、裂变分享、商业付费 |
| 我的 | 登录/注册、微信登录、账户统计、公众号 |

---

## 4. 数据模型

### 4.1 资产模型 (CommercialProperty)

| 字段 | 类型 | 说明 |
|------|------|------|
| projectName | String | 项目名称 |
| city | String | 城市 |
| district | String | 区 |
| rawAddress | String | 地址 |
| propertyType | PropertyType | OFFICE/SHOPS/INDUSTRIAL |
| faceRent | Decimal | 挂牌租金面价(元/㎡/天) |
| dataSource | String | 数据来源 |
| dynamicIndicators | JSONB | 47项精算指标 |

### 4.2 47项动态指标 (DynamicIndicators)

| 分类 | 指标 |
|------|------|
| 租金流 | 面价、净有效租金 |
| 运营 | 净吸纳量、续租调升率、空间利用、收缴率 |
| 商业 | 坪效、租售比、客单价、掉铺率、首店占比、开闭店比 |
| 产业园 | 电产比、亩均税收、车位配比 |
| 投融资 | CapRate、售租比、WALE、租户留存、LTV、债务收益、现金回报、IRR、大宗单价 |
| 市场 | 商圈空置、企业迁入、总部集聚、政策级数、收益利差、热度指数、负面声量 |
| ESG | LEED/BREEAM/WELL 认证 |

### 4.3 用户模型 (User)

| 字段 | 说明 |
|------|------|
| email | 邮箱(唯一) |
| wechatOpenId | 微信ID(唯一) |
| referralViewCount | 裂变赠额池 |
| purchasedViewCount | 付费额池 |
| myReferralCode | 个人裂变码 |

---

## 5. 交互规范

- 移动端禁止缩放：`maximumScale=1, userScalable=false`
- 手机字号基准：`font-size: 120%`（19.2px）
- 弹窗：居中 Modal 方框，必须手动关闭
- 提示：Toast 底部滑入，2.5s 消失
- 额度不足时点击锁定的指标格子弹出 Modal 提示
