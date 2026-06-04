// Seed Supabase with mock property data
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Dynamic import of mock data
  const { mockProperties } = await import("../lib/mock-data");

  console.log(`Seeding ${mockProperties.length} properties...`);

  let inserted = 0;
  let skipped = 0;

  for (const prop of mockProperties) {
    try {
      await prisma.commercialProperty.upsert({
        where: {
          projectName_rawAddress: {
            projectName: prop.projectName,
            rawAddress: prop.rawAddress,
          },
        },
        create: {
          projectName: prop.projectName,
          city: prop.city,
          district: prop.district,
          rawAddress: prop.rawAddress,
          propertyType: prop.propertyType as any,
          faceRent: prop.faceRent,
          dataSource: prop.dataSource,
          dynamicIndicators: prop.dynamicIndicators as any,
          agentUpdatedAt: new Date(),
        },
        update: {
          faceRent: prop.faceRent,
          dataSource: prop.dataSource,
          dynamicIndicators: prop.dynamicIndicators as any,
          agentUpdatedAt: new Date(),
        },
      });
      inserted++;
    } catch (e: any) {
      console.error(`Error on ${prop.projectName}:`, e.message);
      skipped++;
    }
  }

  // Seed FieldMetadata
  const fieldMeta = [
    { fieldKey: "capRate", fieldName: "资本化率", fieldType: "percent", moduleType: "OFFICE" as const, unitLabel: "%", sortOrder: 1 },
    { fieldKey: "priceToRentRatio", fieldName: "售租比", fieldType: "ratio", moduleType: "OFFICE" as const, unitLabel: "倍", sortOrder: 2 },
    { fieldKey: "wale", fieldName: "平均租期", fieldType: "number", moduleType: "OFFICE" as const, unitLabel: "年", sortOrder: 3 },
    { fieldKey: "retentionRate", fieldName: "租户留存率", fieldType: "percent", moduleType: "OFFICE" as const, unitLabel: "%", sortOrder: 4 },
    { fieldKey: "submarketVacancy", fieldName: "商圈空置", fieldType: "percent", moduleType: "OFFICE" as const, unitLabel: "%", sortOrder: 5 },
    { fieldKey: "salesEfficiency", fieldName: "坪效", fieldType: "currency", moduleType: "SHOPS" as const, unitLabel: "元/㎡", sortOrder: 1 },
    { fieldKey: "electricityOutputRatio", fieldName: "电产比", fieldType: "percent", moduleType: "INDUSTRIAL" as const, unitLabel: "%", sortOrder: 1 },
  ];

  for (const fm of fieldMeta) {
    await prisma.fieldMetadata.upsert({
      where: { fieldKey_moduleType: { fieldKey: fm.fieldKey, moduleType: fm.moduleType } },
      create: fm,
      update: fm,
    });
  }

  console.log(`Done: ${inserted} inserted, ${skipped} skipped`);
  await prisma.$disconnect();
}

main();
