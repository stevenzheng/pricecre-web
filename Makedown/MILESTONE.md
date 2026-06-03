# 第一期核心业务闭环全栈路线图 (MILESTONE.md)
# 版本：v1.0.0-MVP (一期租金确权闭轮版)

## 1. 一期战略核心目标
- **核心拦截点**：全站前台以“高置信度租金流”作为第一期唯一的价值和扣额拦截点。
- **业务闭环线**：微信无密注册/邮箱多渠道鉴权 -> 迎新自动到账 3 次额度 -> 点击卡片 -> 触发 Server Action 开启原子事务扣额 -> 解锁净有效租金 -> 客户端 Zustand/useReducer 强覆盖同步。
- **数据流解耦**：线上库仅暴露标准 API 接口供本地清洗 Agent 灌入干净数据。线上系统对指标包（`dynamicIndicators`）采取动态元数据外挂机制，为二期 45 个指标的平滑接入预留纯前端零代码扩容空间。

## 2. 里峰碑双周执行矩阵 (2-Week Sprint Matrix)
- **Sprint 1 (D1-D4) [数据底座与字典冷启动]**：部署修复版 Prisma Schema，向 Supabase 执行物理迁移；初始化元数据表（`FieldMetadata`），仅上架租金流字段。
- **Sprint 1 (D5-D7) [前台核心卡片与样式落地]**：编写 `/components/PropertyCard.tsx`。像素级还原 BitMart 新金融交易终端美学。中英混排不跳动，能根据字典动态遍历。
- **Sprint 2 (D8-D11) [零信任解耦 Action 编码]**：编写包含双池额度控制（裂变池受 100 次历史上限保护）、24小时高频去重锁、服务端打码过滤的 `unlockPropertyData` Server Action。
- **Sprint 2 (D12-D14) [鉴权凭证中心与多tab同步]**：调通 NextAuth.js 微信/邮箱混合登录；调通 Zustand 乐观更新与后端权威额度强行覆盖（Overwrite）机制，全功能闭环上线 Vercel。
