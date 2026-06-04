// agent/review-queue.ts
// ============================================================
// Supabase agent_review_queue 读写层（替代原 SQLite local-db.ts）
// 管线输出 → PENDING_REVIEW → 管理员 approve → 移到 CommercialProperty
// ============================================================
import { PrismaClient } from "@prisma/client";
import { ProcessedAsset } from "./schemas";

const prisma = new PrismaClient();

export { prisma };

export async function writeToReviewQueue(asset: ProcessedAsset): Promise<void> {
  await prisma.agentReviewQueue.upsert({
    where: { id: asset.id },
    create: {
      id: asset.id,
      projectName: asset.projectName,
      city: asset.city,
      district: asset.district,
      rawAddress: asset.rawAddress,
      propertyType: asset.propertyType as any,
      faceRent: asset.faceRent,
      area: asset.area ?? null,
      dataSource: asset.dataSource,
      dynamicIndicators: asset.dynamicIndicators as any,
      status: asset.status,
      confidenceScore: asset.confidenceScore,
      agentTimestamp: new Date(asset.agentTimestamp),
      auditLog: JSON.stringify(asset.auditLog),
    },
    update: {
      projectName: asset.projectName,
      faceRent: asset.faceRent,
      area: asset.area ?? null,
      dataSource: asset.dataSource,
      dynamicIndicators: asset.dynamicIndicators as any,
      status: asset.status,
      confidenceScore: asset.confidenceScore,
      agentTimestamp: new Date(asset.agentTimestamp),
      auditLog: JSON.stringify(asset.auditLog),
    },
  });
}

export async function writeBatchToReviewQueue(assets: ProcessedAsset[]): Promise<{
  written: number;
  failed: number;
}> {
  let written = 0;
  let failed = 0;

  for (const asset of assets) {
    try {
      await writeToReviewQueue(asset);
      written++;
    } catch (err) {
      console.error(`[ReviewQueue] 资产 ${asset.id} 写入失败:`, err);
      failed++;
    }
  }

  return { written, failed };
}

export async function getPendingReviewAssets(limit = 200): Promise<ProcessedAsset[]> {
  const rows = await prisma.agentReviewQueue.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    projectName: row.projectName,
    city: row.city,
    district: row.district,
    rawAddress: row.rawAddress,
    propertyType: row.propertyType as any,
    faceRent: Number(row.faceRent),
    area: row.area ?? undefined,
    dataSource: row.dataSource,
    updatedAt: row.createdAt.toISOString().split("T")[0],
    dynamicIndicators: row.dynamicIndicators as any,
    status: row.status as any,
    confidenceScore: row.confidenceScore,
    agentTimestamp: row.agentTimestamp.toISOString(),
    auditLog: typeof row.auditLog === "string" ? JSON.parse(row.auditLog) : [],
  }));
}
