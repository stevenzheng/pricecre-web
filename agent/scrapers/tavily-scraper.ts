// agent/scrapers/tavily-scraper.ts
// ============================================================
// Tavily Search API 集成 v2 — 精准商业地产数据提取
// 策略：限定房源平台域名 + 建筑名模式 + 噪音过滤 + 价格阈值
// ============================================================
import axios from "axios";
import { RawScrapedPackage, PropertyType } from "../schemas";
import { GeoGisScraper } from "./geo-gis-scraper";

// ── 类型 ──────────────────────────────────────────────

const TAVILY_API = "https://api.tavily.com/search";

interface TavilySearchInput {
  api_key: string; query: string;
  search_depth?: "basic" | "advanced";
  include_answer?: boolean | "basic" | "advanced";
  include_raw_content?: boolean; max_results?: number;
  include_domains?: string[]; exclude_domains?: string[];
}

interface TavilyResult {
  title: string; url: string; content: string;
  raw_content?: string; score: number; published_date?: string;
}

interface TavilyResponse {
  query: string; answer?: string; results: TavilyResult[];
  response_time: number;
}

// ── 配置 & 映射 ──────────────────────────────────────

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("TAVILY_API_KEY 未设置");
  return key;
}

const CITY_ZH: Record<string, string> = {
  shanghai:"上海", beijing:"北京", shenzhen:"深圳", guangzhou:"广州",
  hangzhou:"杭州", chengdu:"成都", suzhou:"苏州", changsha:"长沙", xian:"西安",
};
const DISTRICT_ZH: Record<string, string> = {
  lujiazui:"陆家嘴", jing_an:"静安", zhangjiang:"张江", qiantan:"前滩",
  pudong:"浦东", huangpu:"黄浦", xuhui:"徐汇", changning:"长宁",
  hongkou:"虹口", yangpu:"杨浦", chaoyang:"朝阳", haidian:"海淀",
  dongcheng:"东城", xicheng:"西城", nanshan:"南山", futian:"福田",
  luohu:"罗湖", baoan:"宝安", tianhe:"天河", yuexiu:"越秀",
  haizhu:"海珠", xihu:"西湖", binjiang:"滨江", gusu:"姑苏",
  suzhou_gongyeyuan:"苏州工业园区", jinjiang:"锦江", wuhou:"武侯",
  gaoxin:"高新", yuelu:"岳麓", furong:"芙蓉", yanta:"雁塔",
  weiyang:"未央", all:"", _default:"",
};
const PROPERTY_ZH: Record<PropertyType, string> = {
  OFFICE:"写字楼", SHOPS:"商铺", INDUSTRIAL:"产业园",
};

// ── 商业地产专属域名清单 ────────────────────────────

const CRE_DOMAINS = [
  "office.ke.com", "haozu.com", "anjuke.com", "diandianzu.com",
  "fang.com", "58.com", "office.cs.com", "xzl.58.com",
  "sh.58.com", "bj.58.com", "sz.58.com", "gz.58.com",
  "hz.58.com", "cd.58.com", "xa.58.com",
];

// ── 建筑名噪音黑名单（非商业地产关键词） ─────────────

const BLACKLIST_KEYWORDS = [
  "租房", "二手房", "小区", "房东直租", "个人房东", "经纪人",
  "室友", "整租", "合租", "公寓出租", "住宅", "宿舍",
  "找了", "看过", "笔记", "攻略", "指南", "知乎", "小红书",
  "多图", "特价", "急售", "豪宅", "别墅", "房源", "免中介",
  "拎包入住", "精装修", "看房", "视频看房", "好房", "陪读",
];

// ── 商业地产建筑名关键词 ─────────────────────────────

const BUILDING_SUFFIX =
  "(?:大厦|中心|广场|大楼|商厦|商务楼|商务中心|总部|园区|城|坊|天地|" +
  "ONE|PLAZA|TOWER|PLACE|CENTER|SOHO|LOFT|国际|环球|金融|科创|" +
  "科技园|软件园|创意园|数码|港汇|世纪|时代|新天地|联合)";

// ── API 调用 ──────────────────────────────────────────

async function search(input: TavilySearchInput): Promise<TavilyResponse> {
  const res = await axios.post<TavilyResponse>(TAVILY_API, input, {
    headers: { "Content-Type": "application/json" }, timeout: 30000,
  });
  return res.data;
}

// ── 提取器 ────────────────────────────────────────────

function extractPrice(text: string): { value: number | null; raw: string } {
  // 元/㎡/天 格式
  const m1 = text.match(/(\d+[\d.]*)\s*(?:元|￥)\s*[\/／]\s*(?:㎡|m2|平|sqm|平米|平方米)\s*[\/／]\s*(?:天|日)/i);
  if (m1) { const v = parseFloat(m1[1]); if (v >= 0.5 && v <= 60) return { value: v, raw: m1[0] }; }

  // 日均 / 日租
  const m2 = text.match(/(?:日均|日租|每天|天租|租金为|租金约|租金)\s*[:：]?\s*(\d+[\d.]*)\s*(?:元|￥)\s*(?:\/|每)?\s*(?:(?:㎡|m2|平|sqm|平米|平方米)\s*(?:\/|每)?\s*(?:天|日))?/i);
  if (m2) { const v = parseFloat(m2[1]); if (v >= 0.5 && v <= 60) return { value: v, raw: m2[0] }; }

  // 元/天
  const m3 = text.match(/(\d+[\d.]*)\s*(?:元|￥)\s*[\/／]\s*(?:天|日)/i);
  if (m3) { const v = parseFloat(m3[1]); if (v >= 0.5 && v <= 60) return { value: v, raw: m3[0] }; }

  // 月租转日租 (元/㎡/月 ÷ 30)
  const m4 = text.match(/(\d+[\d.]*)\s*(?:元|￥)\s*[\/／]\s*(?:㎡|m2|平|sqm|平米|平方米)\s*[\/／]\s*(?:月)/i);
  if (m4) { const v = parseFloat((parseFloat(m4[1]) / 30).toFixed(1)); if (v >= 0.5 && v <= 60) return { value: v, raw: m4[0] }; }

  // 上下文推断: "XX大厦租金为7元" / "租金最高达8元" 等（有建筑名上下文）
  const m5 = text.match(/(?:租金(?:为|约|最高达|最低|在|：|:)?)\s*(\d+[\d.]*)\s*(?:元|￥)/i);
  if (m5) { const v = parseFloat(m5[1]); if (v >= 0.5 && v <= 60) return { value: v, raw: m5[0] }; }

  return { value: null, raw: "" };
}

function extractArea(text: string): number | null {
  const m = text.match(/(\d+[\d,]*)\s*(?:㎡|m²|m2|平方米|平米|sqm)/i);
  if (m) { const v = parseFloat(m[1].replace(/,/g, "")); if (v >= 50 && v <= 1000000) return Math.round(v); }
  const m2 = text.match(/(?:建筑面积|面积)\s*[:：]?\s*(\d+[\d,]*)/i);
  if (m2) { const v = parseFloat(m2[1].replace(/,/g, "")); if (v >= 50 && v <= 1000000) return Math.round(v); }
  return null;
}

function extractProjectName(text: string, title: string): string | null {
  const lower = (text + title).toLowerCase();
  if (BLACKLIST_KEYWORDS.some((kw) => lower.includes(kw))) return null;

  const suffixRe = new RegExp(BUILDING_SUFFIX, "gi");
  const candidates: string[] = [];

  for (const source of [title, text]) {
    let m: RegExpExecArray | null;
    while ((m = suffixRe.exec(source)) !== null) {
      // 找到后缀词位置，向前取2-15个字符作为建筑名
      const suffixPos = m.index;
      const suffixLen = m[0].length;
      // 向前扫描: 找最近的换行/句号/逗号/空格作为起点, 或取最多15字符
      const prefix = source.substring(Math.max(0, suffixPos - 15), suffixPos);
      const cleanPrefix = prefix.replace(/^.*[。，,；;\n\r\s·]/, "").trim();
      const name = cleanPrefix + m[0];
      if (name.length >= 4 && name.length <= 30) {
        candidates.push(name.trim());
      }
    }
  }

  // 取最短候选（排除纯地名）
  if (candidates.length > 0) {
    candidates.sort((a, b) => a.length - b.length);
    for (const c of candidates) {
      if (!/^(?:上海|北京|深圳|广州|杭州|成都|苏州|长沙|西安|浦东|陆家嘴|静安|朝阳|海淀|南山|福田)$/.test(c)) {
        return c;
      }
    }
  }

  // 项目名称标记
  const nm = text.match(/(?:项目名称|楼盘名称|物业名称|大厦名称)\s*[:：]?\s*([\u4e00-\u9fa5a-zA-Z0-9·]{2,30})/i);
  if (nm) return nm[1].trim();

  // 纯净标题
  if (title && title.length >= 3 && title.length <= 25 && !/[，,。．]/.test(title) && !/^\d/.test(title)) {
    return title;
  }
  return null;
}

function extractAddress(text: string): string {
  const m = text.match(/(?:地址|位于|坐落|位置)\s*[:：]?\s*([\u4e00-\u9fa5a-zA-Z0-9路街巷号道]{4,60})/);
  if (m) return m[1].trim();
  return "";
}

// ── 是否是有效的物业记录 ─────────────────────────────

interface ParsedProperty {
  projectName: string;
  faceRent: number;
  faceRentRaw: string;
  area: number | null;
  address: string;
  source: string; // "answer" | "result"
}

function isNoiseItem(name: string, text: string): boolean {
  // 免费 / 一口价 / 面议 等非标价格 → 噪音
  if (/面议|可谈|电询|一口价|免费|赠送/i.test(text)) return true;
  // 标题明显是住宅的
  if (/小区|住宅|公寓出租|宿舍|单间|一室|两室|三室|四室/i.test(text) && !/写字楼|办公|商办/i.test(text)) return true;
  return false;
}

// ── 搜索结果解析（主逻辑） ────────────────────────────

function parseProperties(
  result: TavilyResponse,
  cityEn: string,
  districtEn: string,
  propertyType: PropertyType,
): RawScrapedPackage[] {
  const cityZh = CITY_ZH[cityEn] || cityEn;
  const districtZh = DISTRICT_ZH[districtEn] || districtEn;
  const packages: RawScrapedPackage[] = [];
  const seenNames = new Set<string>();

  // ── 策略1: 解析 Tavily AI Answer ──
  if (result.answer) {
    const answerText = result.answer;

    // Tavily answer 里可能包含多栋楼的租金信息
    // 如 "陆家嘴写字楼租金3.5元/㎡/天，静安1.5元/㎡/天"
    const buildingClauses = answerText.split(/[。；;]/);

    for (const clause of buildingClauses) {
      const price = extractPrice(clause);
      const name = extractProjectName(clause, "");
      if (price.value && name && !seenNames.has(name) && !isNoiseItem(name, clause)) {
        seenNames.add(name);
        packages.push({
          projectName: name, city: cityZh, district: districtEn,
          roughAddress: `${cityZh}${districtZh}`, propertyType,
          rawPriceText: `${price.value}元/㎡/天`,
          freeRentMonthsText: "", area: extractArea(clause) ?? undefined,
          leaseTotalMonths: 36, macroSubmarketVacancy: 0.15,
          inputLtv: 0.6, noiCagr3Y: 0.02,
        });
      }
    }

    // 注意：此处刻意不再用"城市均价"造伪资产记录。
    // 提取不到具体楼盘名 = 没有楼盘级数据，宁缺毋滥（数据准确性优先）。
  }

  // ── 策略2: 逐条解析搜索结果的 content ──
  for (const item of result.results) {
    const combinedText = `${item.title} ${item.content}`;

    // 噪音过滤
    if (isNoiseItem(item.title, combinedText)) continue;

    const price = extractPrice(combinedText);
    const name = extractProjectName(combinedText, item.title);
    const area = extractArea(combinedText);
    const address = extractAddress(combinedText);

    // 必须有名字和有效价格才入库
    if (!name || !price.value) continue;
    if (seenNames.has(name)) continue;

    seenNames.add(name);

    packages.push({
      projectName: name, city: cityZh, district: districtEn,
      roughAddress: address || `${cityZh}${districtZh}`, propertyType,
      rawPriceText: price.raw,
      freeRentMonthsText: "", area: area ?? undefined,
      leaseTotalMonths: 36, macroSubmarketVacancy: 0.15,
      inputLtv: 0.6, noiCagr3Y: 0.02,
    });

    if (packages.length >= 15) break;
  }

  return packages;
}

// ── 搜索词生成 ────────────────────────────────────────

function searchQuery(city: string, district: string, type: PropertyType): string {
  const cityZh = CITY_ZH[city] || city;
  const distZh = DISTRICT_ZH[district] || "";
  const typeZh = PROPERTY_ZH[type];
  const location = distZh ? `${cityZh}${distZh}` : cityZh;

  // 针对性搜索词：建筑名 + 租金
  return `${location} ${typeZh} 大厦 租金 元每平米每天`;
}

// ── 舆情 ──────────────────────────────────────────────

export interface SentimentIndicators {
  kolBuzzIndex: number; negativeSentimentRate: number;
  corporateInquiryIndex: number; policyIncentiveLevel: number;
  netCorporateMigration: number; hqSupplyChainRatio: number;
}

function calcSentiment(r: TavilyResponse): Pick<SentimentIndicators, "kolBuzzIndex"|"negativeSentimentRate"|"corporateInquiryIndex"> {
  const txt = [r.answer||"", ...r.results.map(x=>x.content)].join(" ");
  const n = r.results.length;
  const avg = n>0 ? r.results.reduce((s,x)=>s+x.score,0)/n : 0;
  const neg = ["投诉","维权","烂尾","暴雷","违约","退租","倒闭","跑路","裁员","亏损","崩盘"].filter(k=>txt.includes(k)).length;
  const corp = ["入驻","搬迁","选址","扩租","总部","设立","落地","迁入"].filter(k=>txt.includes(k)).length;
  return {
    kolBuzzIndex: Math.min(100, Math.round(n*avg*12)),
    negativeSentimentRate: parseFloat(Math.min(1, neg/7).toFixed(2)),
    corporateInquiryIndex: Math.min(100, Math.round(corp*15+n*5)),
  };
}

// ── 主类 ─────────────────────────────────────────────

export class TavilyScraper {

  static async crawl(params: {
    city: string; district: string; propertyType: PropertyType; maxResults?: number;
  }): Promise<RawScrapedPackage[]> {
    const { city, district, propertyType, maxResults = 15 } = params;
    const apiKey = getApiKey();
    const query = searchQuery(city, district, propertyType);

    console.log(`[Tavily] ${CITY_ZH[city]||city}/${DISTRICT_ZH[district]||district} → "${query}"`);

    const result = await search({
      api_key: apiKey, query,
      search_depth: "basic",
      include_answer: "basic",
      include_raw_content: false,
      max_results: Math.min(maxResults, 20),
      include_domains: CRE_DOMAINS,
    });

    console.log(`[Tavily] ${result.results.length}条, ${result.response_time.toFixed(1)}s` +
      (result.answer ? ` | answer:${result.answer.slice(0,60)}...` : ""));

    const packages = parseProperties(result, city, district, propertyType);
    console.log(`[Tavily] 提取 ${packages.length} 条有效物业`);

    return packages;
  }

  static async gatherSentiment(projectName: string, city: string, district: string): Promise<SentimentIndicators> {
    const apiKey = getApiKey();
    const c = CITY_ZH[city] || city;
    const [mkt, corp] = await Promise.all([
      search({ api_key: apiKey, query: `${c} ${district||""} 写字楼 商圈 空置率 2026`, search_depth:"basic", max_results:5 }),
      search({ api_key: apiKey, query: `${c} ${district||""} 企业 入驻 搬迁 2026`, search_depth:"basic", max_results:5 }),
    ]);
    const ms = calcSentiment(mkt), cs = calcSentiment(corp);
    const all = [mkt.answer||"", corp.answer||""].join(" ");
    const pol = ["政策","补贴","优惠","扶持","自贸","高新","新区"].filter(k=>all.includes(k)).length;
    const mi = ["入驻","迁入","落地","设立"].filter(k=>all.includes(k)).length;
    const mo = ["搬离","迁出","撤离","关闭"].filter(k=>all.includes(k)).length;
    return {
      kolBuzzIndex:ms.kolBuzzIndex, negativeSentimentRate:ms.negativeSentimentRate,
      corporateInquiryIndex:cs.corporateInquiryIndex,
      policyIncentiveLevel:Math.min(5,1+pol),
      netCorporateMigration:Math.max(-20,Math.min(30, mo===0?20:Math.round(((mi-mo)/mi)*20))),
      hqSupplyChainRatio:Math.round(25+cs.corporateInquiryIndex*0.15),
    };
  }

  static async crawlAndEnrich(params: {
    city: string; district: string; propertyType: PropertyType; maxResults?: number;
  }): Promise<RawScrapedPackage[]> {
    const raw = await this.crawl(params);
    if (raw.length===0) return [];
    for (const pkg of raw) {
      const g = await GeoGisScraper.calculateSubmarketDemographics({
        projectName:pkg.projectName, city:pkg.city, district:pkg.district, roughAddress:params.district,
      });
      pkg.macroSubmarketVacancy = g.macroSubmarketVacancy ?? 0.15;
    }
    console.log(`[Tavily] GIS赋能完成 ${raw.length}条\n`);
    return raw;
  }
}
