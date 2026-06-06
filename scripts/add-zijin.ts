// scripts/add-zijin.ts — Add 紫金广场 property
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.commercialProperty.upsert({
    where: { projectName_rawAddress: { projectName: "紫金广场", rawAddress: "浦东新区世纪大道1号" } },
    create: {
      projectName: "紫金广场",
      city: "上海",
      district: "浦东新区",
      rawAddress: "浦东新区世纪大道1号",
      propertyType: "OFFICE",
      faceRent: 10.5,
      area: 68000,
      dataSource: "LOCAL_AI_AGENT_VERIFIED_V1",
      agentUpdatedAt: new Date(),
      dynamicIndicators: {
        netEffectiveRent: 8.2,
        capRate: 0.045,
        priceToRentRatio: 22,
        wale: 5.1,
        retentionRate: 0.85,
        tenantConcentration: 0.22,
        netAbsorption: 12500,
        reversionRate: 0.06,
        spaceUtilization: 0.88,
        esgCertification: "LEED Gold",
        landFloorPrice: 18500,
        capexIntensity: 3200,
        npiMargin: 0.72,
        collectionRate: 0.96,
        compTxPrice: 62000,
        noiCagr3Y: 0.08,
        submarketVacancy: 0.10,
        policyIncentiveLevel: 3,
        yieldSpread: 0.025,
        kolBuzzIndex: 72,
        negativeSentimentRate: 0.05,
        netCorporateMigration: 0.12,
        hqSupplyChainRatio: 0.45,
        culturalRadianceLevel: 4,
        ltvRatio: 0.48,
        debtYield: 0.088,
        cashOnCashReturn: 0.10,
        projectedIrr5Y: 0.12,
        tradeAreaPopulation: 72.3,
        demographicPremiumScore: 8,
        pmOperatorTier: 9,
        facilitySlaRating: 9,
        anchorDependency: 0.18,
        merchantChurnRate: 0.03,
      },
    },
    update: {},
  });

  console.log("✅ 紫金广场已添加");
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
