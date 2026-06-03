import axios from "axios";
import crypto from "crypto";

interface PropertyInput {
  name: string;
  city: string;
  district: string;
  address: string;
  type: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  facePrice: number;
  indicatorsBag: Record<string, any>;
}

interface CloudPayloadItem {
  projectName: string;
  city: string;
  district: string;
  rawAddress: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number;
  dataSource: string;
  dynamicIndicators: Record<string, any>;
  agentTimestamp: string;
  idempotencyKey: string;
}

interface BulkUpsertPayload {
  items: CloudPayloadItem[];
}

export async function pushCleanedDataToCloud(propertiesList: PropertyInput[]) {
  const CHUNK_SIZE = 100;
  const AGENT_TOKEN = process.env.AGENT_SYNC_TOKEN || "ag_prod_xK9mZ2026_cre_max";
  const API_URL = process.env.AGENT_SYNC_ENDPOINT || "https://pricecre.com/api/agent/v1/bulk-upsert";

  console.log(`📦 检测到 Agent 待同步资产总量: ${propertiesList.length} 条，开始执行切片分片并发上行...`);

  for (let i = 0; i < propertiesList.length; i += CHUNK_SIZE) {
    const chunk = propertiesList.slice(i, i + CHUNK_SIZE);
    const timestamp = new Date().toISOString();

    const payload: BulkUpsertPayload = {
      items: chunk.map((prop) => {
        const rawString = `${prop.name}_${prop.address}_${timestamp}`;
        const idempotencyKey = crypto.createHash("md5").update(rawString).digest("hex");

        return {
          projectName: prop.name,
          city: prop.city,
          district: prop.district,
          rawAddress: prop.address,
          propertyType: prop.type,
          faceRent: Number(prop.facePrice),
          dataSource: "LOCAL_AI_AGENT_VERIFIED_V1",
          dynamicIndicators: prop.indicatorsBag,
          agentTimestamp: timestamp,
          idempotencyKey: idempotencyKey
        };
      })
    };

    try {
      const response = await axios.post(API_URL, payload, {
        headers: {
          Authorization: `Bearer ${AGENT_TOKEN}`,
          "Content-Type": "application/json"
        },
        timeout: 120000
      });

      console.log(`✅ [Batch ${Math.floor(i / CHUNK_SIZE) + 1}] 同步成功，状态码: ${response.status}，本批次资产数: ${chunk.length}`);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(`❌ [Batch ${Math.floor(i / CHUNK_SIZE) + 1}] 同步失败，状态码: ${error.response?.status ?? "UNKNOWN"}`);
        console.error(error.response?.data ?? error.message);
      } else {
        console.error(`❌ [Batch ${Math.floor(i / CHUNK_SIZE) + 1}] 同步失败`);
        console.error(error);
      }

      throw error;
    }
  }

  console.log("🏁 Agent 全部分片资产已成功上云并网！");
}
