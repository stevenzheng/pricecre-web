import { PrismaClient, PropertyType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 开始清空历史元数据与资产...");
  await prisma.fieldMetadata.deleteMany({});
  await prisma.commercialProperty.deleteMany({});

  console.log("🌱 正在注入 18 维 48 项全赛道前台元数据字典...");
  const metadataRows = [
    { fieldKey: "netEffectiveRent", fieldName: "净有效租金", fieldType: "float", unitLabel: "元/㎡/天", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 1 },
    { fieldKey: "netEffectiveRent", fieldName: "净有效租金", fieldType: "float", unitLabel: "元/㎡/天", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 1 },
    { fieldKey: "netEffectiveRent", fieldName: "净有效租金", fieldType: "float", unitLabel: "元/㎡/天", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 1 },
    { fieldKey: "capRate", fieldName: "资本化率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 2 },
    { fieldKey: "capRate", fieldName: "资本化率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 2 },
    { fieldKey: "capRate", fieldName: "资本化率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 2 },
    { fieldKey: "priceToRentRatio", fieldName: "售租比", fieldType: "float", unitLabel: "倍", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 3 },
    { fieldKey: "priceToRentRatio", fieldName: "售租比", fieldType: "float", unitLabel: "倍", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 3 },
    { fieldKey: "priceToRentRatio", fieldName: "售租比", fieldType: "float", unitLabel: "倍", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 3 },
    { fieldKey: "wale", fieldName: "加权平均租期", fieldType: "float", unitLabel: "年", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 4 },
    { fieldKey: "wale", fieldName: "加权平均租期", fieldType: "float", unitLabel: "年", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 4 },
    { fieldKey: "wale", fieldName: "加权平均租期", fieldType: "float", unitLabel: "年", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 4 },
    { fieldKey: "retentionRate", fieldName: "租户留存率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 5 },
    { fieldKey: "retentionRate", fieldName: "租户留存率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 5 },
    { fieldKey: "retentionRate", fieldName: "租户留存率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 5 },
    { fieldKey: "tenantConcentration", fieldName: "租户集中度", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 6 },
    { fieldKey: "tenantConcentration", fieldName: "租户集中度", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 6 },
    { fieldKey: "tenantConcentration", fieldName: "租户集中度", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 6 },
    { fieldKey: "netAbsorption", fieldName: "净吸纳量", fieldType: "float", unitLabel: "㎡", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 7 },
    { fieldKey: "reversionRate", fieldName: "续租租金调升率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 8 },
    { fieldKey: "spaceUtilization", fieldName: "工位利用率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 9 },
    { fieldKey: "salesEfficiency", fieldName: "坪效", fieldType: "float", unitLabel: "元/㎡/年", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 7 },
    { fieldKey: "rentToSalesRatio", fieldName: "租销比", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 8 },
    { fieldKey: "footfallConversionRate", fieldName: "客流转化率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 9 },
    { fieldKey: "avgTicketSize", fieldName: "平均客单价", fieldType: "float", unitLabel: "元", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 10 },
    { fieldKey: "esgCertification", fieldName: "ESG认证覆盖", fieldType: "string", unitLabel: "文本", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 10 },
    { fieldKey: "esgCertification", fieldName: "ESG认证覆盖", fieldType: "string", unitLabel: "文本", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 11 },
    { fieldKey: "esgCertification", fieldName: "ESG认证覆盖", fieldType: "string", unitLabel: "文本", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 10 },
    { fieldKey: "landFloorPrice", fieldName: "土地楼面价", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 11 },
    { fieldKey: "landFloorPrice", fieldName: "土地楼面价", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 12 },
    { fieldKey: "landFloorPrice", fieldName: "土地楼面价", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 11 },
    { fieldKey: "capexIntensity", fieldName: "单位面积CapEx", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 12 },
    { fieldKey: "capexIntensity", fieldName: "单位面积CapEx", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 13 },
    { fieldKey: "capexIntensity", fieldName: "单位面积CapEx", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 12 },
    { fieldKey: "npiMargin", fieldName: "NPI利润率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 13 },
    { fieldKey: "npiMargin", fieldName: "NPI利润率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 14 },
    { fieldKey: "npiMargin", fieldName: "NPI利润率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 13 },
    { fieldKey: "collectionRate", fieldName: "租金收缴率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 14 },
    { fieldKey: "collectionRate", fieldName: "租金收缴率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 15 },
    { fieldKey: "collectionRate", fieldName: "租金收缴率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 14 },
    { fieldKey: "compTxPrice", fieldName: "大宗成交单价", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 15 },
    { fieldKey: "compTxPrice", fieldName: "大宗成交单价", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 16 },
    { fieldKey: "compTxPrice", fieldName: "大宗成交单价", fieldType: "float", unitLabel: "元/㎡", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 15 },
    { fieldKey: "recentTransactionCount", fieldName: "最近成交记录", fieldType: "integer", unitLabel: "宗", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: false, sortOrder: 16 },
    { fieldKey: "recentTransactionCount", fieldName: "最近成交记录", fieldType: "integer", unitLabel: "宗", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: false, sortOrder: 17 },
    { fieldKey: "recentTransactionCount", fieldName: "最近成交记录", fieldType: "integer", unitLabel: "宗", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: false, sortOrder: 16 },
    { fieldKey: "noiCagr3Y", fieldName: "3年NOI复合增长率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 17 },
    { fieldKey: "noiCagr3Y", fieldName: "3年NOI复合增长率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 18 },
    { fieldKey: "noiCagr3Y", fieldName: "3年NOI复合增长率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 17 },
    { fieldKey: "submarketVacancy", fieldName: "子市场空置率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 17 },
    { fieldKey: "submarketVacancy", fieldName: "子市场空置率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 18 },
    { fieldKey: "submarketVacancy", fieldName: "子市场空置率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 17 },
    { fieldKey: "policyIncentiveLevel", fieldName: "政策扶持级数", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 18 },
    { fieldKey: "policyIncentiveLevel", fieldName: "政策扶持级数", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 19 },
    { fieldKey: "policyIncentiveLevel", fieldName: "政策扶持级数", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 18 },
    { fieldKey: "yieldSpread", fieldName: "无风险利差", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 19 },
    { fieldKey: "yieldSpread", fieldName: "无风险利差", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 20 },
    { fieldKey: "yieldSpread", fieldName: "无风险利差", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 19 },
    { fieldKey: "kolBuzzIndex", fieldName: "KOL热度指数", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 20 },
    { fieldKey: "kolBuzzIndex", fieldName: "KOL热度指数", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 21 },
    { fieldKey: "kolBuzzIndex", fieldName: "KOL热度指数", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 20 },
    { fieldKey: "negativeSentimentRate", fieldName: "负面声量率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: false, sortOrder: 21 },
    { fieldKey: "negativeSentimentRate", fieldName: "负面声量率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: false, sortOrder: 22 },
    { fieldKey: "negativeSentimentRate", fieldName: "负面声量率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: false, sortOrder: 21 },
    { fieldKey: "employeeHappinessScore", fieldName: "员工幸福度", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 22 },
    { fieldKey: "employeeHappinessScore", fieldName: "员工幸福度", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 23 },
    { fieldKey: "employeeHappinessScore", fieldName: "员工幸福度", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 22 },
    { fieldKey: "electricityOutputRatio", fieldName: "电产比", fieldType: "float", unitLabel: "kWh/万元", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: false, sortOrder: 23 },
    { fieldKey: "taxCovenantRate", fieldName: "亩均税收达成率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: false, sortOrder: 24 },
    { fieldKey: "loadingDockRatio", fieldName: "装卸口配比", fieldType: "float", unitLabel: "个/万㎡", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: false, sortOrder: 25 },
    { fieldKey: "anchorDependency", fieldName: "主力店依赖度", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 24 },
    { fieldKey: "merchantChurnRate", fieldName: "商户掉铺率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 25 },
    { fieldKey: "netCorporateMigration", fieldName: "知名企业净迁入率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: false, sortOrder: 23 },
    { fieldKey: "hqSupplyChainRatio", fieldName: "总部供应链集聚度", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 24 },
    { fieldKey: "corporateInquiryIndex", fieldName: "选址咨询活跃度", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 25 },
    { fieldKey: "corporateInquiryIndex", fieldName: "选址咨询活跃度", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 26 },
    { fieldKey: "corporateInquiryIndex", fieldName: "选址咨询活跃度", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 26 },
    { fieldKey: "firstStoreRatio", fieldName: "首店旗舰店占比", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 27 },
    { fieldKey: "openToCloseRatio", fieldName: "品牌开闭店比", fieldType: "float", unitLabel: "倍", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: false, sortOrder: 28 },
    { fieldKey: "culturalRadianceLevel", fieldName: "文化辐射级数", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 26 },
    { fieldKey: "culturalRadianceLevel", fieldName: "文化辐射级数", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 29 },
    { fieldKey: "culturalRadianceLevel", fieldName: "文化辐射级数", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 27 },
    { fieldKey: "footfallPulseRate", fieldName: "客流脉冲系数", fieldType: "float", unitLabel: "倍", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: false, sortOrder: 30 },
    { fieldKey: "culturalPremiumScore", fieldName: "文化溢价得分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 27 },
    { fieldKey: "culturalPremiumScore", fieldName: "文化溢价得分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 31 },
    { fieldKey: "culturalPremiumScore", fieldName: "文化溢价得分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 28 },
    { fieldKey: "pmOperatorTier", fieldName: "物管品牌等级", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 28 },
    { fieldKey: "pmOperatorTier", fieldName: "物管品牌等级", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 32 },
    { fieldKey: "pmOperatorTier", fieldName: "物管品牌等级", fieldType: "integer", unitLabel: "级", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 29 },
    { fieldKey: "facilitySlaRating", fieldName: "响应时效评分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 29 },
    { fieldKey: "facilitySlaRating", fieldName: "响应时效评分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 33 },
    { fieldKey: "facilitySlaRating", fieldName: "响应时效评分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 30 },
    { fieldKey: "maintenanceScore", fieldName: "设施运维评分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 30 },
    { fieldKey: "maintenanceScore", fieldName: "设施运维评分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 34 },
    { fieldKey: "maintenanceScore", fieldName: "设施运维评分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 31 },
    { fieldKey: "ltvRatio", fieldName: "LTV杠杆比率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 31 },
    { fieldKey: "ltvRatio", fieldName: "LTV杠杆比率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 35 },
    { fieldKey: "ltvRatio", fieldName: "LTV杠杆比率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 32 },
    { fieldKey: "debtYield", fieldName: "债务收益率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 32 },
    { fieldKey: "debtYield", fieldName: "债务收益率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 36 },
    { fieldKey: "debtYield", fieldName: "债务收益率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 33 },
    { fieldKey: "cashOnCashReturn", fieldName: "现金回报率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 33 },
    { fieldKey: "cashOnCashReturn", fieldName: "现金回报率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 37 },
    { fieldKey: "cashOnCashReturn", fieldName: "现金回报率", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 34 },
    { fieldKey: "projectedIrr5Y", fieldName: "5年预测IRR", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 34 },
    { fieldKey: "projectedIrr5Y", fieldName: "5年预测IRR", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 38 },
    { fieldKey: "projectedIrr5Y", fieldName: "5年预测IRR", fieldType: "percentage", unitLabel: "%", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 35 },
    { fieldKey: "tradeAreaPopulation", fieldName: "核心辐射人口", fieldType: "float", unitLabel: "万人", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 35 },
    { fieldKey: "tradeAreaPopulation", fieldName: "核心辐射人口", fieldType: "float", unitLabel: "万人", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 39 },
    { fieldKey: "tradeAreaPopulation", fieldName: "核心辐射人口", fieldType: "float", unitLabel: "万人", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 36 },
    { fieldKey: "demographicPremiumScore", fieldName: "客群匹配得分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.OFFICE, isDisplayed: true, isLocked: true, sortOrder: 36 },
    { fieldKey: "demographicPremiumScore", fieldName: "客群匹配得分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.SHOPS, isDisplayed: true, isLocked: true, sortOrder: 40 },
    { fieldKey: "demographicPremiumScore", fieldName: "客群匹配得分", fieldType: "integer", unitLabel: "分", moduleType: PropertyType.INDUSTRIAL, isDisplayed: true, isLocked: true, sortOrder: 37 }
  ];

  for (const row of metadataRows) {
    await prisma.fieldMetadata.create({ data: row });
  }

  console.log("💎 正在注入顶级置信度三大赛道测试资产...");
  await prisma.commercialProperty.create({
    data: {
      projectName: "上海中心大厦",
      city: "上海",
      district: "浦东新区",
      rawAddress: "陆家嘴环路479号",
      propertyType: PropertyType.OFFICE,
      faceRent: 15.5,
      dataSource: "LOCAL_AI_AGENT_VERIFIED_V1",
      agentUpdatedAt: new Date(),
      dynamicIndicators: {
        netEffectiveRent: 12.8,
        netCorporateMigration: 0.15,
        submarketVacancy: 0.12,
        wale: 4.2,
        capRate: 0.043,
        retentionRate: 0.88,
        tenantConcentration: 0.31,
        netAbsorption: 18600,
        reversionRate: 0.07,
        spaceUtilization: 0.84,
        hqSupplyChainRatio: 0.58,
        corporateInquiryIndex: 91,
        negativeSentimentRate: 0.09,
        recentTransactionCount: 6,
        ltvRatio: 0.49,
        debtYield: 0.092,
        projectedIrr5Y: 0.126,
        tradeAreaPopulation: 86.2,
        demographicPremiumScore: 9
      }
    }
  });

  await prisma.commercialProperty.create({
    data: {
      projectName: "静安大悦城",
      city: "上海",
      district: "静安区",
      rawAddress: "西藏北路166号",
      propertyType: PropertyType.SHOPS,
      faceRent: 22.0,
      dataSource: "LOCAL_AI_AGENT_VERIFIED_V1",
      agentUpdatedAt: new Date(),
      dynamicIndicators: {
        netEffectiveRent: 18.5,
        openToCloseRatio: 0.82,
        footfallPulseRate: 2.65,
        salesEfficiency: 46800,
        rentToSalesRatio: 0.14,
        footfallConversionRate: 0.12,
        avgTicketSize: 138,
        anchorDependency: 0.35,
        merchantChurnRate: 0.08,
        firstStoreRatio: 0.19,
        negativeSentimentRate: 0.28,
        recentTransactionCount: 9,
        culturalRadianceLevel: 5,
        pmOperatorTier: 8,
        facilitySlaRating: 9,
        maintenanceScore: 8,
        tradeAreaPopulation: 112.4,
        demographicPremiumScore: 10
      }
    }
  });

  await prisma.commercialProperty.create({
    data: {
      projectName: "张江高科芯片园",
      city: "上海",
      district: "浦东新区",
      rawAddress: "科苑路61c号",
      propertyType: PropertyType.INDUSTRIAL,
      faceRent: 5.5,
      dataSource: "LOCAL_AI_AGENT_VERIFIED_V1",
      agentUpdatedAt: new Date(),
      dynamicIndicators: {
        netEffectiveRent: 4.8,
        taxCovenantRate: 0.95,
        electricityOutputRatio: 45,
        loadingDockRatio: 8,
        capRate: 0.051,
        wale: 5.6,
        submarketVacancy: 0.09,
        capexIntensity: 2800,
        policyIncentiveLevel: 5,
        negativeSentimentRate: 0.11,
        recentTransactionCount: 4,
        ltvRatio: 0.42,
        debtYield: 0.106,
        projectedIrr5Y: 0.133,
        tradeAreaPopulation: 63.5,
        demographicPremiumScore: 8
      }
    }
  });

  console.log("🏁 数据种子冷启动冷启动全部成功并网！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
