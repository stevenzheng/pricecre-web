// agent/master-pipeline.ts
// ============================================================
// 总控管线 — Exa舆情 → MiniMax情感 → 精算 → Supabase
// MiniMax M2.7 via mydamoxing.cn 代理
// ============================================================
import crypto from "crypto";
import axios from "axios";
import { RawScrapedPackage, ProcessedAsset } from "./schemas";
import { runFullFinancialCalc } from "./financial-engine";
import { getBenchmark } from "./submarket-benchmarks";
import { batchUploadAssets } from "./uploader";

const MINIMAX_API_URL = "https://mydamoxing.cn/v1/chat/completions";
const MINIMAX_MODEL = "MiniMax-M2.7-highspeed";

function getMiniMaxKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.trim() === "") throw new Error("[FATAL] ANTHROPIC_API_KEY 未配置");
  return key;
}

export class LocalAgentMasterOrchestrator {

  private static async runMiniMaxSentimentAnalysis(
    projectName: string,
    corpus: string
  ): Promise<number> {
    if (!corpus || corpus.trim() === "") return 0.02;
    try {
      const key = getMiniMaxKey();
      const prompt = `以下是关于"${projectName}"写字楼/商业地产的网络评论摘录。请深度分析其中负面评价（投诉、维权、避雷、物业差、停电、漏水等）占全部评论的真实比例。只输出一个0.0000到1.0000之间的纯数字。\n\n评论文本：\n${corpus}`;
      const response = await axios.post(
        MINIMAX_API_URL,
        {
          model: MINIMAX_MODEL,
          messages: [
            { role: "system", content: "你是商业地产舆情分析师，只输出纯数字。" },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          max_tokens: 10,
        },
        {
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          timeout: 15000,
        }
      );
      const rate = parseFloat(response.data?.choices?.[0]?.message?.content?.trim() ?? "");
      return isNaN(rate) || rate < 0 || rate > 1 ? 0.05 : rate;
    } catch {
      return 0.05;
    }
  }

  private static async searchExaSentiment(projectName: string): Promise<{ corpus: string; results: any }> {
    const EXA_API_KEY = process.env.EXA_API_KEY;
    const Exa = await import("exa-js").then((m) => m.Exa);
    const exa = new Exa(EXA_API_KEY || "");

    if (!EXA_API_KEY) {
      console.warn("[Exa] EXA_API_KEY 未配置，跳过舆情扫描");
      return { corpus: "", results: { results: [] } };
    }

    try {
      const exaSearchResult = await exa.searchAndContents(
        `Complaints and 维权 statements about ${projectName} building`,
        { numResults: 10, useAutoprompt: true, highlights: true }
      );
      const corpus =
        exaSearchResult.results
          ?.map((r: any) => r.highlights?.[0] || "")
          .join("\n") || "";
      return { corpus, results: exaSearchResult };
    } catch {
      return { corpus: "", results: { results: [] } };
    }
  }

  public static async executeFullPipeline(
    rawItems: RawScrapedPackage[]
  ): Promise<ProcessedAsset[]> {
    const processedOutputQueue: ProcessedAsset[] = [];

    for (const raw of rawItems) {
      try {
        const faceRentPerDay =
          parseFloat(raw.rawPriceText?.replace(/[^0-9.]/g, "")) || 0;

        const isCriticalMissing =
          faceRentPerDay <= 0 || !raw.projectName || !raw.roughAddress;

        const standardAddress = raw.roughAddress.trim().replace(/\s+/g, "");
        const assetId = crypto
          .createHash("md5")
          .update(`${raw.projectName}_${standardAddress}`)
          .digest("hex");

        const { benchmark, isDefault } = getBenchmark(
          raw.city,
          raw.district,
          raw.propertyType
        );
        const activeAssetPrice = raw.compTxPrice ?? benchmark.benchmarkAssetPrice;
        const activeOpexRatio = raw.opexRatio ?? benchmark.opexRatio;

        let negativeSentimentRate: number | null = 0.02;
        if (!isCriticalMissing) {
          const { corpus } = await this.searchExaSentiment(raw.projectName);
          negativeSentimentRate = await this.runMiniMaxSentimentAnalysis(
            raw.projectName,
            corpus
          );
        } else {
          negativeSentimentRate = null;
        }

        const calcResult = runFullFinancialCalc({
          faceRentPerSqmPerDay: faceRentPerDay,
          freeRentMonths: (() => {
            const v = parseFloat(raw.freeRentMonthsText?.replace(/[^0-9.]/g, ""));
            return Number.isFinite(v) ? v : 0;
          })(),
          leaseTotalMonths: raw.leaseTotalMonths,
          ltv: raw.inputLtv,
          loanRate: 0.045,
          opexRatio: activeOpexRatio,
          assetPricePerSqm: activeAssetPrice,
          benchmarkCapRate: benchmark.benchmarkCapRate,
          noiCagr3Y: raw.noiCagr3Y,
        });

        const sentimentPenalty =
          negativeSentimentRate !== null && negativeSentimentRate > 0.4 ? 0.2 : 0;
        const baseConfidence = isCriticalMissing
          ? 0.0
          : isDefault
          ? 0.75
          : 1.0;
        const finalConfidence = Math.max(0, baseConfidence - sentimentPenalty);

        const agentTimestamp = new Date().toISOString();

        const assetRecord: ProcessedAsset = {
          id: assetId,
          projectName: raw.projectName,
          city: raw.city,
          district: raw.district,
          rawAddress: standardAddress,
          propertyType: raw.propertyType,
          faceRent: faceRentPerDay,
          area: raw.area,
          dataSource: "LEGAL_SSR_EXA_MINIMAX_FLOW_V3",
          updatedAt: new Date().toISOString().split("T")[0],
          dynamicIndicators: {
            faceRent: isCriticalMissing ? null : faceRentPerDay,
            netEffectiveRent: isCriticalMissing ? null : calcResult.netEffectiveRent,
            capRate: isCriticalMissing ? null : calcResult.capRate,
            compTxPrice: raw.compTxPrice ?? null,
            noiCagr3Y: raw.noiCagr3Y,
            submarketVacancy: raw.macroSubmarketVacancy,
            negativeSentimentRate: negativeSentimentRate,
            ltvRatio: raw.inputLtv,
            debtYield: isCriticalMissing
              ? null
              : parseFloat(
                  (calcResult.noi / (activeAssetPrice * raw.inputLtv)).toFixed(4)
                ),
            cashOnCashReturn: isCriticalMissing ? null : calcResult.cashOnCashReturn,
            projectedIrr5Y: isCriticalMissing ? null : calcResult.projectedIrr5Y,
          },
          status: isCriticalMissing ? "CRITICAL_MISSING" : "PENDING_REVIEW",
          confidenceScore: finalConfidence,
          agentTimestamp: agentTimestamp,
          auditLog: [
            {
              action: "LOCAL_PIPELINE_CEMENTED",
              operator: "SYSTEM",
              timestamp: agentTimestamp,
            },
          ],
        };

        processedOutputQueue.push(assetRecord);
      } catch (err) {
        console.error(
          `[中枢异动] 资产 [${raw.projectName}] 计算中断，丢弃隔离。`,
          err
        );
        continue;
      }
    }

    return processedOutputQueue;
  }
}
