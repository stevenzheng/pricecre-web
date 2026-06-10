# 项目当前状态看板

## 1. 当前阶段
- **阶段一：V1 资产确权与技术栈换代** (已完成 )
    - 纯 HTML V1 版本已在 `https://sz4ai.com/rent/` 成功发布并稳定运行，业务逻辑、视觉风格、界面组件布局及文案内容已固化为重构的唯一真理之源。
    - 技术栈全量转向 Next.js 14 App Router + TS + Server Actions + Prisma + Supabase (PostgreSQL) 的闭环架构。

## 2. 正在进行 (In Progress)
- **阶段二：基于 V1 原型的组件化重构与商业化功能编码 (全量使用 DeepSeek V4 Pro)**
    - 正在将 V1 首页的 Header 状态栏、实时闪烁 LIVE 徽章、通告横幅移植并重构为可复用的 React / TypeScript 组件。
    - 正在开发包含手机、邮件、微信统一接入的极简全渠道登录前端弹窗（完全融合 V1 视觉风格）。
    - 正在利用 DeepSeek 编写集成微信与支付宝标准三方回调路由（`app/api/pay/notify/route.ts`），处理回调验签与订单确权。
    - 正在编写基于 `unlockPropertyData` 的卡片级解锁状态控制流。

## 3. 已知问题与对策 (Known Issues)
- **数据安全保障（防抓取爆库）**：如果恶意用户注册账号后，编写脚本疯狂调用 Server Action 解锁楼宇，会快速消耗数据价值。
  - *对策*：指示 DeepSeek 在 `unlockPropertyData` 前端按钮处以及后端 Action 层面加入速率限制（Rate Limiting），单个账号单分钟内最多允许解锁 5 栋楼宇，保护核心资产。
- **微信环境静默登录流**：手机浏览器扫码与微信内置浏览器内快捷登录的逻辑不同。
  - *对策*：NextAuth 凭证配置中，优先打通手机/邮箱验证码登录，微信作为增量 Provider，PC 端使用二维码扫码，微信内采用 JSAPI 网页授权。

## 4. 下一步计划 (Next Steps)
1. 让 DeepSeek V4 Pro 针对 V1 的 HTML 源码，完整输出 Next.js 14 版本的 `/components/PropertyCard.tsx`（内含面价与净有效租金高级锁 UI）。
2. 在本地开发环境跑通多渠道凭证登录流，确保未登录用户点击高级数据时，能自动触发融入 V1 苹果美学风格的登录弹窗。
3. 调通本地与微信/支付宝沙箱环境的统一支付路由，确保回调成功后，Supabase 中的用户资产实时更新。
4. 全量上线 Vercel 并绑定 `sz4ai.com/rent` 路由，进行首屏 1.2 秒加载性能极限压测。

## 5. 给 AI 的特别提示 (DeepSeek 专属指令)
- 在将 V1 原型代码转化为 Next.js 组件时，**必须严格保留所有原始 Tailwind 类名及文案内容**。
- 涉及高级卡片的数据拦截，必须在 Server Action 层面通过 Session 进行鉴权，如果 `vipLevel === 0` 及 `bonusViewCount === 0`，则强制将 `netEffectiveRent` 和 `vacancyRate` 字段在服务端清空，并在前端卡片中渲染出“升级会员或邀请好友获取额度”的交互引导组件。