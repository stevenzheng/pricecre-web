// agent/schemas.ts
// ============================================================
// 统一 Zod Schema 契约大底座
// 与 DATA_DICTIONARY.md / ARCH.md 完全对齐
// ============================================================
import { z } from "zod";

export const PropertyTypeSchema = z.enum(["OFFICE", "SHOPS", "INDUSTRIAL"]);
export type PropertyType = z.infer<typeof PropertyTypeSchema>;

export const ReviewStatusSchema = z.enum([
  "PENDING_REVIEW",
  "APPROVED",
  "REJECTED",
  "CRITICAL_MISSING",
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const RawScrapedPackageSchema = z.object({
  projectName:           z.string().min(1),
  city:                  z.string().min(1),
  district:              z.string().min(1),
  roughAddress:          z.string().min(1),
  propertyType:          PropertyTypeSchema,
  rawPriceText:          z.string(),
  freeRentMonthsText:    z.string(),
  area:                  z.number().int().positive().optional(),
  leaseTotalMonths:      z.number().int().positive().default(36),
  macroSubmarketVacancy: z.number().min(0).max(1).default(0.15),
  inputLtv:              z.number().min(0).max(0.9).default(0.60),
  compTxPrice:           z.number().positive().optional(),
  noiCagr3Y:             z.number().default(0.02),
  opexRatio:             z.number().min(0).max(1).optional(),
});
export type RawScrapedPackage = z.infer<typeof RawScrapedPackageSchema>;

export const DynamicIndicatorsSchema = z.object({
  // 2.1 租金流
  faceRent:                z.number().nullable().optional(),
  netEffectiveRent:        z.number().nullable().optional(),

  // 2.2 投融资（全业态）
  capRate:                 z.number().nullable().optional(),
  priceToRentRatio:        z.number().nullable().optional(),
  wale:                    z.number().nullable().optional(),
  retentionRate:           z.number().nullable().optional(),
  tenantConcentration:     z.number().nullable().optional(),
  esgCertification:        z.string().nullable().optional(),
  landFloorPrice:          z.number().nullable().optional(),
  capexIntensity:          z.number().nullable().optional(),
  npiMargin:               z.number().nullable().optional(),
  collectionRate:          z.number().nullable().optional(),
  compTxPrice:             z.number().nullable().optional(),
  noiCagr3Y:               z.number().nullable().optional(),

  // 2.3 办公运营（OFFICE专属）
  netAbsorption:           z.number().nullable().optional(),
  reversionRate:           z.number().nullable().optional(),
  spaceUtilization:        z.number().nullable().optional(),

  // 2.4 商业零售（SHOPS专属）
  salesEfficiency:         z.number().nullable().optional(),
  rentToSalesRatio:        z.number().nullable().optional(),
  footfallTicketSize:      z.string().nullable().optional(),
  anchorDependency:        z.number().nullable().optional(),
  merchantChurnRate:       z.number().nullable().optional(),
  firstStoreRatio:         z.number().nullable().optional(),
  openToCloseRatio:        z.number().nullable().optional(),
  tradeAreaPopulation:     z.number().nullable().optional(),
  demographicPremiumScore: z.number().nullable().optional(),

  // 2.5 产业园（INDUSTRIAL专属）
  electricityOutputRatio:  z.number().nullable().optional(),
  taxCovenantRate:         z.number().nullable().optional(),
  loadingDockRatio:        z.number().nullable().optional(),

  // 2.6 市场环境（全业态）
  submarketVacancy:        z.number().nullable().optional(),
  policyIncentiveLevel:    z.number().nullable().optional(),
  yieldSpread:             z.number().nullable().optional(),
  kolBuzzIndex:            z.number().nullable().optional(),
  negativeSentimentRate:   z.number().min(0).max(1).nullable().optional(),
  employeeHappinessScore:  z.number().nullable().optional(),
  netCorporateMigration:   z.number().nullable().optional(),
  hqSupplyChainRatio:      z.number().nullable().optional(),

  // 2.7 资本杠杆（全业态）
  ltvRatio:                z.number().nullable().optional(),
  debtYield:               z.number().nullable().optional(),
  cashOnCashReturn:        z.number().nullable().optional(),
  projectedIrr5Y:          z.number().nullable().optional(),

  // 2.8 其他（预留字段，全业态）
  corporateInquiryIndex:   z.number().nullable().optional(),
  culturalRadianceLevel:   z.number().nullable().optional(),
  footfallPulseRate:       z.number().nullable().optional(),
  culturalPremiumScore:    z.number().nullable().optional(),
  pmOperatorTier:          z.number().nullable().optional(),
  facilitySlaRating:       z.number().nullable().optional(),
  maintenanceScore:        z.number().nullable().optional(),
});
export type DynamicIndicators = z.infer<typeof DynamicIndicatorsSchema>;

export const ProcessedAssetSchema = z.object({
  id:                z.string(),
  projectName:       z.string(),
  city:              z.string(),
  district:          z.string(),
  rawAddress:        z.string(),
  propertyType:      PropertyTypeSchema,
  faceRent:          z.number(),
  area:              z.number().int().positive().optional(),
  dataSource:        z.string(),
  updatedAt:         z.string(),
  dynamicIndicators: DynamicIndicatorsSchema,
  status:            ReviewStatusSchema,
  confidenceScore:   z.number().min(0).max(1),
  agentTimestamp:    z.string().datetime(),
  auditLog:          z.array(z.object({
    action:    z.string(),
    operator:  z.string(),
    timestamp: z.string().datetime(),
    fieldName: z.string().optional(),
    oldValue:  z.unknown().optional(),
    newValue:  z.unknown().optional(),
  })).default([]),
});
export type ProcessedAsset = z.infer<typeof ProcessedAssetSchema>;

export const SubmarketBenchmarkSchema = z.object({
  city:                z.string(),
  district:            z.string(),
  propertyType:        PropertyTypeSchema,
  benchmarkAssetPrice: z.number().positive(),
  benchmarkCapRate:    z.number().positive(),
  opexRatio:           z.number().min(0).max(1),
  lastUpdated:         z.string(),
});
export type SubmarketBenchmark = z.infer<typeof SubmarketBenchmarkSchema>;
