// agent/master-pipeline.ts
// ============================================================
// 总控管线 — Exa舆情 → MiniMax情感 → 精算 → Supabase
// MiniMax M2.7 via mydamoxing.cn 代理
// ============================================================
import crypto from "crypto";
import axios from "axios";
import pLimit from "p-limit";
import { RawScrapedPackage, ProcessedAsset } from "./schemas";
import { runFullFinancialCalc } from "./financial-engine";
import { getBenchmark } from "./submarket-benchmarks";
import { batchUploadAssets } from "./uploader";

/** 管线内部并发度（Exa+MiniMax 外呼） */
const PIPELINE_CONCURRENCY = 3;

/** 楼盘名标准化：去空白/全角符号，用于去重指纹 */
function normalizeProjectName(name: string): string {
  return (name || "")
    .replace(/\s+/g, "")
    .replace(/[（(]/g, "(").replace(/[）)]/g, ")")
    .replace(/·|•|・/g, "")
    .toLowerCase();
}

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
  ): Promise<number | null> {
    // 没有任何舆情文本 = 未发现负面 → 0；模型/网络失败 → null（不伪造数值）
    if (!corpus || corpus.trim() === "") return 0;
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
      return isNaN(rate) || rate < 0 || rate > 1 ? null : rate;
    } catch {
      return null;
    }
  }

  private static async searchExaSentiment(projectName: string): Promise<{ corpus: string; results: any }> {
    const EXA_API_KEY = process.env.EXASEARCH_API_KEY || process.env.EXA_API_KEY;
    const Exa = await import("exa-js").then((m) => m.Exa);
    const exa = new Exa(EXA_API_KEY || "");

    if (!EXA_API_KEY) {
      console.warn("[Exa] EXASEARCH_API_KEY 未配置，跳过舆情扫描");
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
    // 舆情外呼可用性只判断一次（无 key 时整批快速跳过，不再逐条尝试）
    const sentimentEnabled =
      !!(process.env.EXASEARCH_API_KEY || process.env.EXA_API_KEY) &&
      !!process.env.ANTHROPIC_API_KEY;
    if (!sentimentEnabled) {
      console.warn("[管线] Exa/MiniMax key 未配置，本批跳过舆情扫描（negativeSentimentRate 置 null）");
    }

    // 批内去重：同一 楼盘名+城市 只保留第一条
    const seenFingerprints = new Set<string>();
    const dedupedItems = rawItems.filter((raw) => {
      const fp = `${normalizeProjectName(raw.projectName)}_${raw.city}`;
      if (seenFingerprints.has(fp)) return false;
      seenFingerprints.add(fp);
      return true;
    });
    if (dedupedItems.length < rawItems.length) {
      console.log(`[管线] 批内去重: ${rawItems.length} → ${dedupedItems.length} 条`);
    }

    const limit = pLimit(PIPELINE_CONCURRENCY);
    const results = await Promise.all(
      dedupedItems.map((raw) => limit(() => this.processOne(raw, sentimentEnabled)))
    );
    return results.filter((r): r is ProcessedAsset => r !== null);
  }

  private static async processOne(
    raw: RawScrapedPackage,
    sentimentEnabled: boolean
  ): Promise<ProcessedAsset | null> {
      try {
        const faceRentPerDay =
          parseFloat(raw.rawPriceText?.replace(/[^0-9.]/g, "")) || 0;

        const isCriticalMissing =
          faceRentPerDay <= 0 || !raw.projectName || !raw.roughAddress;

        const standardAddress = raw.roughAddress.trim().replace(/\s+/g, "");
        // 去重指纹 = 标准化楼盘名 + 城市（地址抓取不稳，跨平台同楼地址写法各异，
        // 用名称+城市做主键可避免同一栋楼在审核队列里重复堆积）
        const assetId = crypto
          .createHash("md5")
          .update(`${normalizeProjectName(raw.projectName)}_${raw.city}`)
          .digest("hex");

        const { benchmark, isDefault } = getBenchmark(
          raw.city,
          raw.district,
          raw.propertyType
        );
        const activeAssetPrice = raw.compTxPrice ?? benchmark.benchmarkAssetPrice;
        const activeOpexRatio = raw.opexRatio ?? benchmark.opexRatio;

        // 舆情：只有具备外呼条件且数据完整时才扫描；否则置 null（不要伪造 0.02/0.05 这种假精度）
        let negativeSentimentRate: number | null = null;
        if (!isCriticalMissing && sentimentEnabled) {
          const { corpus } = await this.searchExaSentiment(raw.projectName);
          negativeSentimentRate = await this.runMiniMaxSentimentAnalysis(
            raw.projectName,
            corpus
          );
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
            // Only set values that have actual data — never fabricate
            faceRent: isCriticalMissing ? null : faceRentPerDay,
            netEffectiveRent: isCriticalMissing ? null : calcResult.netEffectiveRent,
            capRate: isCriticalMissing ? null : calcResult.capRate,
            priceToRentRatio: isCriticalMissing ? null : parseFloat((activeAssetPrice / (faceRentPerDay * 365)).toFixed(2)),
            wale: null,         // needs SSR parsing
            retentionRate: null, // needs SSR parsing
            tenantConcentration: null,
            netAbsorption: null,
            reversionRate: null,
            spaceUtilization: null,
            salesEfficiency: null,
            rentToSalesRatio: null,
            footfallTicketSize: null,
            anchorDependency: null,
            merchantChurnRate: null,
            firstStoreRatio: null,
            openToCloseRatio: null,
            electricityOutputRatio: null,
            taxCovenantRate: null,
            loadingDockRatio: null,
            esgCertification: null,
            landFloorPrice: null,
            capexIntensity: null,
            npiMargin: isCriticalMissing ? null : parseFloat((calcResult.noi / calcResult.grossRevenueYear).toFixed(4)),
            collectionRate: null,
            compTxPrice: raw.compTxPrice ?? null,
            noiCagr3Y: raw.noiCagr3Y,
            submarketVacancy: raw.macroSubmarketVacancy,
            policyIncentiveLevel: null,
            yieldSpread: isCriticalMissing ? null : parseFloat((0.025 - calcResult.capRate).toFixed(4)),
            kolBuzzIndex: null,
            negativeSentimentRate: negativeSentimentRate,
            employeeHappinessScore: null,
            netCorporateMigration: null,
            hqSupplyChainRatio: null,
            corporateInquiryIndex: null,
            culturalRadianceLevel: null,
            footfallPulseRate: null,
            culturalPremiumScore: null,
            pmOperatorTier: null,
            facilitySlaRating: null,
            maintenanceScore: null,
            ltvRatio: raw.inputLtv,
            debtYield: isCriticalMissing ? null : parseFloat((calcResult.noi / (activeAssetPrice * raw.inputLtv)).toFixed(4)),
            cashOnCashReturn: isCriticalMissing ? null : calcResult.cashOnCashReturn,
            projectedIrr5Y: isCriticalMissing ? null : calcResult.projectedIrr5Y,
            tradeAreaPopulation: null,
            demographicPremiumScore: null,
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

        return assetRecord;
      } catch (err) {
        console.error(
          `[中枢异动] 资产 [${raw.projectName}] 计算中断，丢弃隔离。`,
          err
        );
        return null;
      }
  }
}
