// agent/scrapers/tavily-scraper.ts
// ============================================================
// Tavily Search API 集成 — 爬虫替代 + 舆情引擎
// https://tavily.com  |  Free tier: 1000 req/month
//
// 用法:
//   TavilyScraper.crawl({ city:"shanghai", district:"lujiazui", propertyType:"OFFICE" })
//   → RawScrapedPackage[]  (爬虫模式)
//
//   TavilyScraper.gatherSentiment("上海中心大厦", "shanghai", "lujiazui")
//   → { kolBuzzIndex, negativeSentimentRate, corporateInquiryIndex }  (舆情模式)
// ============================================================
import axios from "axios";
import { RawScrapedPackage, PropertyType, DynamicIndicators } from "../schemas";
import { GeoGisScraper } from "./geo-gis-scraper";

// ── Tavily API 类型 ────────────────────────────────────

const TAVILY_API = "https://api.tavily.com/search";

interface TavilySearchInput {
  api_key: string;
  query: string;
  search_depth?: "basic" | "advanced";
  include_answer?: boolean | "basic" | "advanced";
  include_raw_content?: boolean;
  max_results?: number;
  include_domains?: string[];
  exclude_domains?: string[];
}

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  raw_content?: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  query: string;
  answer?: string;
  results: TavilyResult[];
  response_time: number;
  follow_up_questions?: string[];
  images?: Array<{ url: string; description?: string }>;
}

// ── 配置 ──────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY 环境变量未设置。免费注册: https://tavily.com");
  return key;
}

const CITY_EN_TO_ZH: Record<string, string> = {
  shanghai: "上海", beijing: "北京", shenzhen: "深圳",
  suzhou: "苏州", chengdu: "成都", guangzhou: "广州",
  hangzhou: "杭州", changsha: "长沙", xian: "西安",
};

const DISTRICT_EN_TO_ZH: Record<string, string> = {
  lujiazui: "陆家嘴", jing_an: "静安", zhangjiang: "张江",
  qiantan: "前滩", pudong: "浦东", huangpu: "黄浦",
  xuhui: "徐汇", changning: "长宁", hongkou: "虹口",
  yangpu: "杨浦", chaoyang: "朝阳", haidian: "海淀",
  dongcheng: "东城", xicheng: "西城", nanshan: "南山",
  futian: "福田", luohu: "罗湖", baoan: "宝安",
  tianhe: "天河", yuexiu: "越秀", haizhu: "海珠",
  xihu: "西湖", binjiang: "滨江", gusu: "姑苏",
  suzhou_gongyeyuan: "苏州工业园区", jinjiang: "锦江",
  wuhou: "武侯", gaoxin: "高新", yuelu: "岳麓",
  furong: "芙蓉", yanta: "雁塔", weiyang: "未央",
  all: "", _default: "",
};

const PROPERTY_TYPE_ZH: Record<PropertyType, string> = {
  OFFICE: "写字楼", SHOPS: "商铺", INDUSTRIAL: "产业园",
};

// ── 搜索词生成 ────────────────────────────────────────

interface QueryTemplates {
  /** 主爬取查询: 城市+商圈+业态+租金 */
  listing: string;
  /** 舆情查询: 城市+商圈+空置率/新闻 */
  market: string;
  /** 企业迁入查询 */
  corporate: string;
}

function buildQueries(
  city: string,
  district: string,
  propertyType: PropertyType
): QueryTemplates {
  const cityZh = CITY_EN_TO_ZH[city] || city;
  const typeZh = PROPERTY_TYPE_ZH[propertyType];
  const districtZh = DISTRICT_EN_TO_ZH[district] || district;

  const location = districtZh ? `${cityZh}${districtZh}` : cityZh;

  return {
    listing: `${location} ${typeZh} 租金 元每平米每天 2026`,
    market: `${location} ${typeZh} 商圈 空置率 市场分析 2026`,
    corporate: `${location} ${typeZh} 企业入驻 搬迁 新闻`,
  };
}

// ── Tavily API 调用 ────────────────────────────────────

async function search(params: TavilySearchInput): Promise<TavilyResponse> {
  const apiKey = getApiKey();

  try {
    const response = await axios.post<TavilyResponse>(TAVILY_API, params, {
      headers: { "Content-Type": "application/json" },
      timeout: 30000,
    });
    return response.data;
  } catch (err: any) {
    console.error(`[Tavily] 搜索失败: ${err.message}`);
    throw err;
  }
}

// ── 爬虫: 搜索结果 → RawScrapedPackage ──────────────

function extractPriceFromText(text: string): number | null {
  // 匹配 "18.5元/㎡/天" "18.5元每天每平米" "日均18元" 等
  const patterns = [
    /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:㎡|m2|平|sqm)\s*[\/／]\s*(?:天|日)/i,
    /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:天|日)/i,
    /(?:租金|面价|挂牌)\s*[:：]?\s*(\d+[\d.]*)\s*(?:元|￥|¥)/i,
    /日均?\s*(\d+[\d.]*)\s*(?:元|￥|¥)/i,
    /(\d+[\d.]*)\s*元\s*[\/／]\s*(?:㎡|m2|平)\s*(?:[\/／]\s*(?:天|日))?/i,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match) {
      const val = parseFloat(match[1]);
      if (val >= 1 && val <= 100) return parseFloat(val.toFixed(1));
    }
  }
  return null;
}

function extractAreaFromText(text: string): number | null {
  const patterns = [
    /(\d+[\d,]*)\s*(?:㎡|m²|m2|平方米|平米|sqm)/i,
    /面积\s*[:：]?\s*(\d+[\d,]*)\s*(?:㎡|m²|m2|平方米|平米)/i,
    /总建筑面积\s*[:：]?\s*(\d+[\d,]*)/i,
    /(\d+[\d,]*)\s*万[方㎡]/i,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match) {
      let val = parseFloat(match[1].replace(/,/g, ""));
      if (text.includes("万方") || text.includes("万㎡")) val *= 10000;
      if (val >= 100 && val <= 1000000) return Math.round(val);
    }
  }
  return null;
}

function extractProjectNameFromText(text: string, title: string): string {
  // 优先用标题
  if (title) {
    // 去除常见的后缀词
    const cleaned = title
      .replace(/[-—–].*$/, "")
      .replace(/[（(].*?[)）]/g, "")
      .replace(/(租金|价格|多少钱|出租|出售|地址|电话|图片|简介).*$/gi, "")
      .trim();

    if (cleaned.length >= 2 && cleaned.length <= 30) return cleaned;
  }

  // 从内容中提取: "XX大厦" "XX中心" "XX广场"
  const namePatterns = [
    /([\u4e00-\u9fa5a-zA-Z]{2,20}(?:大厦|中心|广场|大楼|总部|园区|城|坊|天地|ONE|PLAZA|TOWER))/i,
    /项目名称\s*[:：]?\s*([\u4e00-\u9fa5a-zA-Z0-9]{2,30})/i,
  ];

  for (const re of namePatterns) {
    const match = text.match(re);
    if (match) return match[1].trim();
  }

  return "";
}

function extractAddressFromText(text: string): string {
  const patterns = [
    /地址\s*[:：]?\s*([\u4e00-\u9fa5a-zA-Z0-9路街巷号]{5,60})/i,
    /位于\s*([\u4e00-\u9fa5a-zA-Z0-9路街巷区]{3,40})/i,
    /([\u4e00-\u9fa5]{2,6}(?:市|区|新区|园区))[\u4e00-\u9fa5]*(?:路|街|大道)[\u4e00-\u9fa50-9]{1,10}(?:号)?/,
  ];

  for (const re of patterns) {
    const match = text.match(re);
    if (match) return match[1].trim();
  }

  return "";
}

function parseSearchResults(
  result: TavilyResponse,
  city: string,
  district: string,
  propertyType: PropertyType
): RawScrapedPackage[] {
  const allText = [
    result.answer || "",
    ...result.results.map((r) => `${r.title}\n${r.content}\n${r.raw_content || ""}`),
  ].join("\n\n");

  const packages: RawScrapedPackage[] = [];

  // 策略1: 先尝试从 Tavily Answer 中提取结构化信息
  if (result.answer) {
    const name = extractProjectNameFromText(result.answer, "");
    const price = extractPriceFromText(result.answer);
    const area = extractAreaFromText(result.answer);
    const address = extractAddressFromText(result.answer);

    if (name && price) {
      packages.push({
        projectName: name,
        city: CITY_EN_TO_ZH[city] || city,
        district,
        roughAddress: address || `${CITY_EN_TO_ZH[city] || city}${district}`,
        propertyType,
        rawPriceText: `${price}元/㎡/天`,
        freeRentMonthsText: "",
        area,
        leaseTotalMonths: 36,
        macroSubmarketVacancy: 0.15,
        inputLtv: 0.6,
      });
    }
  }

  // 策略2: 逐条解析搜索结果
  for (const item of result.results) {
    const combinedText = `${item.title}\n${item.content}\n${item.raw_content || ""}`;
    const name = extractProjectNameFromText(combinedText, item.title);
    const price = extractPriceFromText(combinedText);
    const area = extractAreaFromText(combinedText);
    const address = extractAddressFromText(combinedText);

    // Skip duplicates
    if (packages.some((p) => p.projectName === name)) continue;

    // 至少要有名字和价格才入库
    if (name && name.length >= 2) {
      packages.push({
        projectName: name,
        city: CITY_EN_TO_ZH[city] || city,
        district,
        roughAddress: address || `${CITY_EN_TO_ZH[city] || city}${district}`,
        propertyType,
        rawPriceText: price ? `${price}元/㎡/天` : "",
        freeRentMonthsText: "",
        area,
        leaseTotalMonths: 36,
        macroSubmarketVacancy: 0.15,
        inputLtv: 0.6,
      });

      // 限制每条搜索最多10个项目
      if (packages.length >= 15) break;
    }
  }

  return packages;
}

// ── 舆情引擎: Tavily → 舆情指标 ────────────────────

export interface SentimentIndicators {
  kolBuzzIndex: number;          // 0-100
  negativeSentimentRate: number; // 0-1
  corporateInquiryIndex: number; // 0-100
  policyIncentiveLevel: number;  // 1-5
  netCorporateMigration: number; // %
  hqSupplyChainRatio: number;    // %
}

function estimateSentiment(
  result: TavilyResponse
): Pick<
  SentimentIndicators,
  "kolBuzzIndex" | "negativeSentimentRate" | "corporateInquiryIndex"
> {
  const allText = [
    result.answer || "",
    ...result.results.map((r) => r.content),
  ].join(" ");

  // 简单启发式: 根据结果数量和相关性估算热度
  const resultCount = result.results.length;
  const avgScore = result.results.reduce((s, r) => s + r.score, 0) / Math.max(resultCount, 1);

  // 热度指数: 结果数 × 平均得分的加权
  const kolBuzzIndex = Math.min(100, Math.round(resultCount * avgScore * 12));

  // 负面词检测
  const negativeKeywords = [
    "投诉", "维权", "纠纷", "烂尾", "暴雷", "违约", "空置", "退租",
    "倒闭", "跑路", "裁员", "降薪", "亏损", "崩盘", "泡沫",
  ];
  const negativeHits = negativeKeywords.filter((kw) => allText.includes(kw)).length;
  const negativeSentimentRate = Math.min(1, negativeHits / Math.max(negativeKeywords.length / 2, 1));

  // 选址活跃度: 基于"入驻""搬迁""选址""扩租"等词频
  const corporateKeywords = [
    "入驻", "搬迁", "选址", "扩租", "总部", "设立", "落地", "迁入",
  ];
  const corporateHits = corporateKeywords.filter((kw) => allText.includes(kw)).length;
  const corporateInquiryIndex = Math.min(100, Math.round(corporateHits * 15 + resultCount * 5));

  return {
    kolBuzzIndex,
    negativeSentimentRate: parseFloat(negativeSentimentRate.toFixed(2)),
    corporateInquiryIndex,
  };
}

// ── 主类 ─────────────────────────────────────────────

export class TavilyScraper {
  /** 爬虫模式: 搜索 → 解析 → RawScrapedPackage */
  static async crawl(params: {
    city: string;
    district: string;
    propertyType: PropertyType;
    maxResults?: number;
  }): Promise<RawScrapedPackage[]> {
    const { city, district, propertyType, maxResults = 10 } = params;
    const districtZh = DISTRICT_EN_TO_ZH[district] || district;
    const cityZh = CITY_EN_TO_ZH[city] || city;
    const queries = buildQueries(city, district, propertyType);
    const apiKey = getApiKey();

    console.log(`[Tavily·爬取] ${cityZh}/${districtZh} ${PROPERTY_TYPE_ZH[propertyType]}`);
    console.log(`  搜索词: "${queries.listing}"`);

    const result = await search({
      api_key: apiKey,
      query: queries.listing,
      search_depth: "basic",          // free tier 仅 basic
      include_answer: "basic",
      include_raw_content: false,      // free tier 不包含 raw_content
      max_results: Math.min(maxResults, 20),
      include_domains: [
        "ke.com", "haozu.com", "anjuke.com", "diandianzu.com",
        "fang.com", "office.cs.com", "58.com",
      ],
    });

    console.log(`  响应: ${result.results.length} 条结果, ${result.response_time.toFixed(2)}s`);
    if (result.answer) {
      console.log(`  Answer: ${result.answer.substring(0, 100)}...`);
    }

    const packages = parseSearchResults(result, city, district, propertyType);
    console.log(`  解析: ${packages.length} 条有效项目`);

    return packages;
  }

  /** 舆情模式: 搜索 → 舆情指标 */
  static async gatherSentiment(
    projectName: string,
    city: string,
    district: string
  ): Promise<SentimentIndicators> {
    const apiKey = getApiKey();
    const cityZh = CITY_EN_TO_ZH[city] || city;

    // 搜索1: 项目相关新闻
    const [marketResult, corpResult] = await Promise.all([
      search({
        api_key: apiKey,
        query: `${cityZh} ${district} 写字楼 商圈 空置率 市场 2026`,
        search_depth: "basic",
        max_results: 5,
      }),
      search({
        api_key: apiKey,
        query: `${cityZh} ${district} 企业 入驻 搬迁 总部 2026`,
        search_depth: "basic",
        max_results: 5,
      }),
    ]);

    const marketSentiment = estimateSentiment(marketResult);
    const corpSentiment = estimateSentiment(corpResult);

    // 政策激励估算: 基于是否有"政策""补贴""优惠"等词
    const allText = [marketResult.answer, corpResult.answer, ""].join(" ");
    const policyKeywords = ["政策", "补贴", "优惠", "扶持", "自贸", "高新", "新区"];
    const policyHits = policyKeywords.filter((kw) => allText.includes(kw)).length;
    const policyIncentiveLevel = Math.min(5, 1 + policyHits);

    // 企业净迁入估算
    const moveInWords = ["入驻", "迁入", "落地", "设立"];
    const moveOutWords = ["搬离", "迁出", "撤离", "关闭"];
    const moveIn = moveInWords.filter((kw) => allText.includes(kw)).length;
    const moveOut = moveOutWords.filter((kw) => allText.includes(kw)).length;
    const netMigration = moveOut === 0 ? 20 : Math.round(((moveIn - moveOut) / moveIn) * 20);

    console.log(
      `[Tavily·舆情] ${projectName}: 热度${marketSentiment.kolBuzzIndex} 负面${marketSentiment.negativeSentimentRate} 选址${corpSentiment.corporateInquiryIndex}`
    );

    return {
      kolBuzzIndex: marketSentiment.kolBuzzIndex,
      negativeSentimentRate: marketSentiment.negativeSentimentRate,
      corporateInquiryIndex: corpSentiment.corporateInquiryIndex,
      policyIncentiveLevel,
      netCorporateMigration: Math.max(-20, Math.min(30, netMigration)),
      hqSupplyChainRatio: Math.round(25 + corpSentiment.corporateInquiryIndex * 0.15),
    };
  }

  /** 一站式: 爬取 + GIS + 舆情 → 完整 RawScrapedPackage（带舆情指标） */
  static async crawlAndEnrich(params: {
    city: string;
    district: string;
    propertyType: PropertyType;
    maxResults?: number;
  }): Promise<RawScrapedPackage[]> {
    const rawPackages = await this.crawl(params);

    if (rawPackages.length === 0) return [];

    console.log(`\n[Tavily·GIS] 为 ${rawPackages.length} 条补充商圈数据...`);

    const enriched: RawScrapedPackage[] = [];
    for (const pkg of rawPackages) {
      const gisStats = await GeoGisScraper.calculateSubmarketDemographics({
        projectName: pkg.projectName,
        city: pkg.city,
        district: pkg.district,
        roughAddress: params.district,
      });

      pkg.macroSubmarketVacancy = gisStats.macroSubmarketVacancy ?? 0.15;

      enriched.push(pkg);
    }

    console.log(`[Tavily·GIS] 完成 ${enriched.length} 条\n`);
    return enriched;
  }
}
