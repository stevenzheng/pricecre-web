# 最高刚性红线与安全约束规约 (CONSTRAINTS.md)
# 版本：v3.9.5-CORE

## 1. 鉴权与账户隔离红线
- 当且仅当 password === null AND wechatOpenId === null AND phone === null AND email === null 时，系统判定为非法爆破账户并拦截熔断。
- 只要 password !== null，即使 wechatOpenId === null，也属于独立的正常独立凭证账户，严禁将其作为无密快捷账户误杀。

## 2. 社交裂变增长与防刷防爆红线
- 非 VIP 用户解锁资产时，优先扣除裂变赠额池（referralViewCount），当且仅当赠额池归 0 枯竭时，才允许扣除付费池（purchasedViewCount）。
- User 表中引入 lifetimeReferralEarned 记录历史累计获得赠额总量。当此字段 >= 100 时，裂变防刷锁永久激活，后续拒绝发放新额度。

## 3. 持久化底座与时序幂等红线
- UserViewLog 采用 @@unique([userId, propertyId]) 约束。当用户非活跃期内再次点击解锁同一个 propertyId 时，禁止调用 create 逻辑（防唯一性冲突崩溃），必须执行原生 upsert，增量更新 viewedAt 为 NOW()。
- CommercialProperty 的 agentUpdatedAt 字段去除 @default(now())。线上系统显式地将本地 Agent 传来的 agentTimestamp 写入此字段。如果 agentTimestamp <= agentUpdatedAt，判定为陈旧乱序流，接口直接跳过。
