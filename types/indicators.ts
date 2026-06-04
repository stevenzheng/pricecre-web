export enum PropertyType {
  OFFICE = "OFFICE",
  SHOPS = "SHOPS",
  INDUSTRIAL = "INDUSTRIAL",
}

export interface DynamicIndicators {
  // 核心租金
  faceRent: number;
  netEffectiveRent: number | null; // 锁定字段

  // 核心资产回报与估值
  capRate?: number;
  priceToRentRatio?: number;

  // 租约质量与风控
  wale?: number;
  retentionRate?: number;
  tenantConcentration?: number;

  // 办公运营
  netAbsorption?: number;
  reversionRate?: number;
  spaceUtilization?: number;

  // 商业零售
  salesEfficiency?: number;
  rentToSalesRatio?: number;
  footfallTicketSize?: string;

  // ESG
  esgCertification?: string;

  // 投前开发
  landFloorPrice?: number;
  capexIntensity?: number;

  // 投中运营
  npiMargin?: number;
  collectionRate?: number;

  // 投后退出
  compTxPrice?: number;
  noiCagr3Y?: number;

  // 宏观政策
  submarketVacancy?: number;
  policyIncentiveLevel?: number;
  yieldSpread?: number;

  // 社交舆情
  kolBuzzIndex?: number;
  negativeSentimentRate?: number;
  employeeHappinessScore?: number;

  // 产业园
  electricityOutputRatio?: number;
  taxCovenantRate?: number;
  loadingDockRatio?: number;

  // 商业零售生态
  anchorDependency?: number;
  merchantChurnRate?: number;

  // 企业迁徙
  netCorporateMigration?: number;
  hqSupplyChainRatio?: number;
  corporateInquiryIndex?: number;

  // 首店撤铺
  firstStoreRatio?: number;
  openToCloseRatio?: number;

  // 文化溢价
  culturalRadianceLevel?: number;
  footfallPulseRate?: number;
  culturalPremiumScore?: number;

  // 物业服务
  pmOperatorTier?: number;
  facilitySlaRating?: number;
  maintenanceScore?: number;

  // 资本杠杆
  ltvRatio?: number;
  debtYield?: number;
  cashOnCashReturn?: number;
  projectedIrr5Y?: number;

  // 人口红利
  tradeAreaPopulation?: number;
  demographicPremiumScore?: number;
}

export interface CommercialProperty {
  id: string;
  projectName: string;
  city: string;
  district: string;
  rawAddress: string;
  propertyType: PropertyType;
  faceRent: number;
  area?: number;
  dataSource: string;
  dynamicIndicators: DynamicIndicators;
  confidenceScore?: number;
  isUnlocked: boolean;
  updatedAt: string;
}

export interface FieldMetadata {
  id: string;
  fieldKey: string;
  fieldName: string;
  fieldType: string;
  moduleType: PropertyType;
  isDisplayed: boolean;
  isLocked: boolean;
  sortOrder: number;
}

export interface UserProfile {
  id: string;
  role: string;
  vipLevel: number;
  purchasedViewCount: number;
  referralViewCount: number;
  myReferralCode: string;
}
