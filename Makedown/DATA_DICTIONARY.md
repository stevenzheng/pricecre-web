# 资产数据字段词典 (DATA DICTIONARY)
# 版本：v5.0 — 2026年6月4日 | 本地抓取Agent开发基准

---

## 1. 核心资产表 (CommercialProperty)

数据抓取 Agent 必须填充的顶层字段：

| # | 字段名 | 类型 | 必填 | 说明 | 抓取来源 |
|---|--------|------|------|------|----------|
| 1 | `projectName` | String | ✅ | 项目/大厦/园区名称 | 贝壳商办/好租/安��客/点点租列表页 |
| 2 | `city` | String | ✅ | 城市（上海/北京/深圳/苏州/成都/广州/杭州/长沙/西安） | 平台城市筛选 |
| 3 | `district` | String | ✅ | 行政区（如浦东新区/朝阳区/南山区） | 平台页面或地址解析 |
| 4 | `rawAddress` | String | ✅ | 完整地址 | 详情页 |
| 5 | `propertyType` | PropertyType | ✅ | OFFICE / SHOPS / INDUSTRIAL | 平台分类 |
| 6 | `faceRent` | Decimal | ✅ | 挂牌租金面价(元/㎡/天) | 列表页/详情页价格 |
| 7 | `dataSource` | String | ✅ | 数据来源平台名 | 爬虫平台标识 |
| 8 | `area` | Int | ✅ | 面积(㎡) | 详情页 |
| 9 | `updatedAt` | String | ✅ | 数据更新日期 ISO | 爬取时间戳 |
| 10 | `dynamicIndicators` | JSONB | ✅ | 47项精算指标（见下表） | 多源复合计算 |

---

## 2. 47项精算指标 (DynamicIndicators)

### 2.1 租金流（2项）— 所有业态必填

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `faceRent` | — | 挂牌面价 | number | ❌ | 小数1位 | 元/㎡/天，爬虫直接获取 |
| `netEffectiveRent` | — | 净有效租金 | number|null | ✅ | 小数1位 | 扣除免租期/装修补贴后的净价，需解锁 |

### 2.2 投融资（12项）— 全业态

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `capRate` | CAP | 资本化率 | number | ✅ | % | NOI/资产价值 |
| `priceToRentRatio` | PTR | 售租比 | number | ✅ | 倍 | 售价/年租金 |
| `wale` | WALE | 平均租期 | number | ✅ | 年 | 加权平均租赁期限 |
| `retentionRate` | RET | 租户留存率 | number | ✅ | % | 续租占比 |
| `tenantConcentration` | TC | 租户集中度 | number | ✅ | % | 最大租户面积占比 |
| `esgCertification` | ESG | 绿色认证 | string | ✅ | 文本 | LEED/BREEAM/WELL等级 |
| `landFloorPrice` | LFP | 土地楼面价 | number | ✅ | 元/㎡ | 土地成本 |
| `capexIntensity` | CAPEX | 单位投入 | number | ✅ | 元/㎡ | 年资本支出 |
| `npiMargin` | NPI | 利润率 | number | ✅ | % | 净物业收入率 |
| `collectionRate` | COL | 收缴率 | number | ✅ | % | 实收/应收 |
| `compTxPrice` | CTX | 大宗单价 | number | ✅ | 元/㎡ | 可比交易价格 |
| `noiCagr3Y` | NOI增速 | 净收入增速 | number | ✅ | % | 三年复合增长率 |

### 2.3 办公运营（3项）— OFFICE 专属

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `netAbsorption` | ABS | 净吸纳量 | number | ✅ | ㎡ | 新租面积-退租面积 |
| `reversionRate` | REV | 续租调升率 | number | ✅ | % | 续租时租金调整幅度 |
| `spaceUtilization` | SU | 空间利用 | number | ✅ | % | 实际使用/总可租面积 |

### 2.4 商业零售（9项）— SHOPS 专属

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `salesEfficiency` | PXF | 坪效 | number | ✅ | 元/㎡ | 每㎡销售额 |
| `rentToSalesRatio` | RSR | 租售比 | number | ✅ | % | 租金/销售额 |
| `footfallTicketSize` | FTS | 客单价 | string | ✅ | 元 | 人均消费额 |
| `anchorDependency` | ANC | 主力店占比 | number | ✅ | % | 锚定租户面积占比 |
| `merchantChurnRate` | MCR | 掉铺率 | number | ✅ | % | 商户退租率（越低越好） |
| `firstStoreRatio` | FSR | 首店占比 | number | ✅ | % | 区域首次开业品牌占比 |
| `openToCloseRatio` | OCR | 开闭店比 | number | ✅ | 倍 | 新开/关闭比值 |
| `tradeAreaPopulation` | TAP | 商圈人口 | number | ✅ | 万 | 核心商圈常住人口 |
| `demographicPremiumScore` | DPS | 人口红利 | number | ✅ | 分 | 消费力综合评分 |

### 2.5 产业园（3项）— INDUSTRIAL 专属

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `electricityOutputRatio` | EOR | 电产比 | number | ✅ | % | 电力消耗/产出价值 |
| `taxCovenantRate` | TCR | 亩均税收 | number | ✅ | 万/亩 | 每亩工业用地税收 |
| `loadingDockRatio` | LDR | 车位配比 | number | ✅ | 个/千㎡ | 每千㎡停车位 |

### 2.6 市场环境（8项）— 全业态

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `submarketVacancy` | VAC | 商圈空置 | number | ✅ | % | 周边商圈空置率（越低越好） |
| `policyIncentiveLevel` | POL | 政策级数 | number | ✅ | 1-5 | 政府支持力度 |
| `yieldSpread` | YLD | 收益利差 | number | ✅ | bps | 资产收益-无风险利率 |
| `kolBuzzIndex` | KOL | 热度指数 | number | ✅ | 0-100 | 社交讨论热度 |
| `negativeSentimentRate` | NSR | 负面声量 | number | ✅ | % | 负面舆情占比（越低越好） |
| `employeeHappinessScore` | EHS | 幸福评分 | number | ✅ | 0-100 | 员工满意度 |
| `netCorporateMigration` | NCM | 企业迁入 | number | ✅ | % | 净迁入企业比例 |
| `hqSupplyChainRatio` | HQSC | 总部集聚 | number | ✅ | % | 总部+供应链企业占比 |

### 2.7 资本杠杆（4项）— 全业态

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `ltvRatio` | LTV | 贷款价值比 | number | ✅ | % | 贷款/估值（越低越安全） |
| `debtYield` | DEBT | 债务收益率 | number | ✅ | % | NOI/贷款额 |
| `cashOnCashReturn` | COC | 现金回报率 | number | ✅ | % | 年净现金/初始现金 |
| `projectedIrr5Y` | IRR 5Y | 5年预测IRR | number | ✅ | % | 内部收益率预测 |

### 2.8 其他（6项）— 全业态

| key | 缩写 | 中文 | 类型 | 锁定 | 格式 | 说明 |
|-----|------|------|------|------|------|------|
| `corporateInquiryIndex` | CII | 选址活跃 | number | ✅ | 0-100 | 企业选址咨询热度 |
| `culturalRadianceLevel` | CRL | 文化辐射 | number | ✅ | 1-5 | 文化设施/活动评级 |
| `footfallPulseRate` | FPR | 客流脉冲 | number | ✅ | 次/时 | 高峰期客流频率（预留） |
| `culturalPremiumScore` | CPS | 文化溢价 | number | ✅ | 分 | 创意产业溢价评分（预留） |
| `pmOperatorTier` | PM | 物管等级 | number | ✅ | 1-5 | 物业运营商评级（预留） |
| `facilitySlaRating` | SLA | 设施SLA | number | ✅ | 1-5 | 设备维护SLA评级（预留） |
| `maintenanceScore` | MNT | 维保评分 | number | ✅ | 0-100 | 维护质量评分（预留） |

> **注**: 标记"预留"的字段在当前前端UI中未展示，但在 TypeScript 类型定义和数据库 Schema 中已完整定义。Agent 开发可以先跳过这些字段，后续按需激活。

---

## 3. 业态-字段映射矩阵

| 字段 | OFFICE | SHOPS | INDUSTRIAL |
|------|:---:|:---:|:---:|
| capRate, priceToRentRatio, wale | ✅ | ✅ | ✅ |
| retentionRate, tenantConcentration | ✅ | ✅ | ✅ |
| esgCertification, npiMargin, collectionRate | ✅ | ✅ | ✅ |
| compTxPrice, noiCagr3Y | ✅ | ✅ | ✅ |
| submarketVacancy, policyIncentiveLevel | ✅ | ✅ | ✅ |
| yieldSpread, kolBuzzIndex | ✅ | ✅ | ✅ |
| negativeSentimentRate, employeeHappinessScore | ✅ | ✅ | ✅ |
| netCorporateMigration, hqSupplyChainRatio | ✅ | ✅ | ✅ |
| corporateInquiryIndex, culturalRadianceLevel | ✅ | ✅ | ✅ |
| ltvRatio, debtYield, cashOnCashReturn | ✅ | ✅ | ✅ |
| projectedIrr5Y, landFloorPrice, capexIntensity | ✅ | ✅ | ✅ |
| netAbsorption, reversionRate, spaceUtilization | ✅ | | |
| salesEfficiency, rentToSalesRatio, footfallTicketSize | | ✅ | |
| anchorDependency, merchantChurnRate | | ✅ | |
| firstStoreRatio, openToCloseRatio | | ✅ | |
| tradeAreaPopulation, demographicPremiumScore | | ✅ | |
| electricityOutputRatio, taxCovenantRate, loadingDockRatio | | | ✅ |

---

## 4. Agent 数据写入格式

### 4.1 API 端点
```
POST /api/agent/v1/bulk-upsert
Content-Type: application/json
Authorization: Bearer {AGENT_SYNC_TOKEN}
```

### 4.2 请求体
```json
{
  "properties": [
    {
      "projectName": "上海中心大厦",
      "city": "上海",
      "district": "浦东新区",
      "rawAddress": "上海市浦东新区陆家嘴银城中路501号",
      "propertyType": "OFFICE",
      "faceRent": 18.5,
      "dataSource": "贝壳商办",
      "area": 574000,
      "updatedAt": "2026-06-04",
      "dynamicIndicators": {
        "faceRent": 18.5,
        "netEffectiveRent": null,
        "capRate": 4.8,
        "priceToRentRatio": 25.3,
        "wale": 5.2,
        "retentionRate": 88.5,
        "tenantConcentration": 22.1,
        "esgCertification": "LEED Platinum",
        "npiMargin": 65.2,
        "collectionRate": 98.5,
        "compTxPrice": 85000,
        "noiCagr3Y": 8.5,
        "submarketVacancy": 5.2,
        "policyIncentiveLevel": 4,
        "yieldSpread": 180,
        "kolBuzzIndex": 92,
        "negativeSentimentRate": 2.1,
        "employeeHappinessScore": 78,
        "netCorporateMigration": 15.5,
        "hqSupplyChainRatio": 42.3,
        "corporateInquiryIndex": 85,
        "culturalRadianceLevel": 5,
        "ltvRatio": 35.2,
        "debtYield": 10.5,
        "cashOnCashReturn": 7.8,
        "projectedIrr5Y": 9.2,
        "landFloorPrice": 32000,
        "capexIntensity": 185,
        "netAbsorption": 12500,
        "reversionRate": 12.3,
        "spaceUtilization": 88.5,
        "electricityOutputRatio": 125.6
      }
    }
  ]
}
```

### 4.3 响应格式
```json
{
  "inserted": 1,
  "updated": 0,
  "skipped": 0,
  "errors": []
}
```

---

## 5. 城市代码映射

| 爬虫平台 | 上海 | 北京 | 深圳 | 苏州 | 成都 | 广州 | 杭州 | 长沙 | 西安 |
|----------|------|------|------|------|------|------|------|------|------|
| 贝壳商办 | sh | bj | sz | su | cd | gz | hz | cs | xa |
| 好租 | sh | bj | sz | suzhou | chengdu | guangzhou | hangzhou | changsha | xian |

---

## 6. 数据质量规则

| 规则 | 说明 |
|------|------|
| 面价范围 | OFFICE 1.5-50, SHOPS 3-60, INDUSTRIAL 0.5-10 元/㎡/天 |
| 面积范围 | 100-1,000,000 ㎡ |
| 项目名去重 | 同城市+同项目名视为重复，跳过或更新 |
| 行政��验证 | 必须在对应城市的合法行政区列表中 |
| 更新时间 | 超过30天未更新的记录标记为过期 |
