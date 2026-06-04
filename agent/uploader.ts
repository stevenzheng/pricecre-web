// agent/uploader.ts
// ============================================================
// 数据上行传输器 — 将 ProcessedAsset 写入 Supabase agent_review_queue
// 同时保留原 bulk-upsert API 作为冗余通道
// ============================================================
import axios from "axios";
import pLimit from "p-limit";
import { ProcessedAsset } from "./schemas";
import { writeBatchToReviewQueue } from "./review-queue";

const BATCH_CHUNK_SIZE = 100;
const UPLOAD_CONCURRENCY = 3;
const UPLOAD_TIMEOUT_MS = 25000;
const ONLINE_BULK_API = "https://pricecre.com/api/agent/v1/bulk-upsert";

function getAgentToken(): string {
  const token = process.env.AGENT_SYNC_TOKEN;
  if (!token || token.trim() === "") {
    console.warn("[上传器] AGENT_SYNC_TOKEN 未配置，跳过直推API通道，仅写入Supabase");
    return "";
  }
  return token;
}

async function uploadChunkToApi(
  chunk: ProcessedAsset[],
  token: string,
  chunkIndex: number,
  retryCount = 0
): Promise<{ uploaded: number; failed: number }> {
  try {
    const response = await axios.post(
      ONLINE_BULK_API,
      { properties: chunk },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Agent-Version": "LOCAL_AI_AGENT_VERIFIED_V3",
        },
        timeout: UPLOAD_TIMEOUT_MS,
      }
    );

    if (response.status !== 200 && response.status !== 201) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log(`[API上行] 批次 #${chunkIndex + 1}（${chunk.length} 条）上传成功`);
    return { uploaded: chunk.length, failed: 0 };
  } catch (err: any) {
    if (retryCount === 0) {
      console.warn(`[API上行] 批次 #${chunkIndex + 1} 重试中...`);
      await new Promise((r) => setTimeout(r, 3000));
      return uploadChunkToApi(chunk, token, chunkIndex, 1);
    }
    console.error(`[API上行] 批次 #${chunkIndex + 1} 最终失败: ${err.message}`);
    return { uploaded: 0, failed: chunk.length };
  }
}

export async function batchUploadAssets(assets: ProcessedAsset[]): Promise<{
  totalWritten: number;
  totalFailed: number;
}> {
  if (assets.length === 0) return { totalWritten: 0, totalFailed: 0 };

  console.log(`[管道上行] 将 ${assets.length} 条资产写入 Supabase agent_review_queue...`);
  const result = await writeBatchToReviewQueue(assets);
  console.log(`[Supabase] 成功 ${result.written} 条，失败 ${result.failed} 条`);

  const token = getAgentToken();
  if (token) {
    const chunks: ProcessedAsset[][] = [];
    for (let i = 0; i < assets.length; i += BATCH_CHUNK_SIZE) {
      chunks.push(assets.slice(i, i + BATCH_CHUNK_SIZE));
    }
    const limit = pLimit(UPLOAD_CONCURRENCY);
    const apiResults = await Promise.all(
      chunks.map((chunk, i) => limit(() => uploadChunkToApi(chunk, token, i)))
    );
    const apiUploaded = apiResults.reduce((s, r) => s + r.uploaded, 0);
    console.log(`[API冗余] 直推 ${apiUploaded} 条完成`);
  }

  return { totalWritten: result.written, totalFailed: result.failed };
}
