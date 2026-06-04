// agent/scrapers/ssr-hydration-scraper.ts
// ============================================================
// SSR 网页脱水爬虫 — 4大平台页面解析器 + JSON-LD 提取
// 贝壳商办 / 好租 / 安居客 / 点点租
// 与 DATA_DICTIONARY.md v5.0 字段词典完全对齐
// ============================================================
import axios from "axios";
import { RawScrapedPackage, PropertyType } from "../schemas";
import { GeoGisScraper } from "./geo-gis-scraper";

// ── 公共类型 ──────────────────────────────────────────

export interface SsrHydrationResult {
  projectName: string;
  rawPriceText: string;
  pricePerDay: number | null;
  freeRentMonthsText: string;
  freeRentMonths: number;
  area: number;
  address: string;
  district: string;
  cityKeystring: string;
  propertyType: PropertyType;
  url: string;
  platformName: string;
  scrapedAt: string;
  /** HTML原文（用于调试） */
  htmlPreview?: string;
}

export interface CrawlJobConfig {
  targetUrl: string;
  label: string;
  propertyType: PropertyType;
  city: string;
  district: string;
  /** 最大结果数 */
  maxResults?: number;
}

// ── 平台注册表 ────────────────────────────────────────

interface PlatformRegistry {
  name: string;
  displayName: string;
  domainPattern: RegExp;
  /** 爬取处理函数 */
  crawl: (config: CrawlJobConfig) => Promise<SsrHydrationResult[]>;
  /** 详情页爬取函数 */
  crawlDetail: (url: string, context: Partial<CrawlJobConfig>) => Promise<SsrHydrationResult | null>;
}

// ── HTML 获取器 ───────────────────────────────────────

const FETCH_TIMEOUT = 20000;
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

interface FetchResult {
  html: string;
  finalUrl: string;
  status: number;
}

async function fetchWithRetry(url: string, attempt = 0): Promise<FetchResult | null> {
  try {
    const response = await axios.get(url, {
      headers: REQUEST_HEADERS,
      timeout: FETCH_TIMEOUT,
      maxRedirects: 5,
      responseType: "text",
      validateStatus: (s) => s < 500,
    });

    return {
      html: response.data,
      finalUrl: response.request?.res?.responseUrl || url,
      status: response.status,
    };
  } catch (err: any) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[HTTP] ${url} 重试 ${attempt + 1}/${MAX_RETRIES} — ${err.message}`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      return fetchWithRetry(url, attempt + 1);
    }
    console.error(`[HTTP] ${url} 最终失败: ${err.message}`);
    return null;
  }
}

// ── 通用 HTML 解析工具 ────────────────────────────────

/** 从 HTML 中提取 JSON-LD 结构化数据 */
function extractJsonLd(html: string): Record<string, any> | null {
  const jsonLdRegex =
    /<script\s+type="application\/(ld\+json|json)"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[2]);
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      // continue
    }
  }
  return null;
}

/** 从 HTML meta 标签提取数据 */
function extractMetaTags(html: string): Record<string, string> {
  const meta: Record<string, string> = {};
  const metaRegex = /<meta[^>]+(?:name|property)="([^"]+)"[^>]+content="([^"]*)"[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = metaRegex.exec(html)) !== null) {
    meta[match[1]] = match[2];
  }
  return meta;
}

/** 提取所有文本节点中的数字 */
function extractNumber(text: string): number | null {
  const cleaned = text.replace(/[^0-9.\-]/g, "").trim();
  const num = parseFloat(cleaned);
  return Number.isFinite(num) && num > 0 ? num : null;
}

/** 提取文本中的面积 (㎡) 数字 */
function extractArea(text: string): number | null {
  // 匹配 "123㎡" "123 ㎡" "123m²" "123平方米" "123平米"
  const re = /(\d+[\d,.]*)\s*(?:㎡|m²|m2|平方米|平米|sqm)/i;
  const match = text.match(re);
  if (match) {
    const num = parseFloat(match[1].replace(/,/g, ""));
    return Number.isFinite(num) && num > 0 ? num : null;
  }
  return null;
}

/** 提取文本中的租金价格 */
function extractFaceRent(text: string): { text: string; value: number | null } {
  // 匹配 "18.5元/㎡/天" "18.5/㎡/天" "18.5 元/平/天" "18.5元每天每平米"
  const re =
    /(\d+[\d.]*)\s*(?:元|￥|¥)?\s*[\/／]?\s*(?:㎡|平方米|m2|m²|平|sqm)?\s*[\/／]?\s*(?:天|日|day)/i;
  const match = text.match(re);
  if (match) {
    const val = parseFloat(match[1]);
    return { text: match[0].trim(), value: Number.isFinite(val) ? val : null };
  }
  return { text, value: null };
}

/** 提取免租期月份 */
function extractFreeRentMonths(text: string): { text: string; months: number } {
  const re = /(\d+[\d.]*)\s*(?:个?月|mon)/i;
  const match = text.match(re);
  if (match) {
    const m = parseFloat(match[1]);
    return { text: match[0], months: Number.isFinite(m) ? m : 0 };
  }
  return { text: "", months: 0 };
}

// ── 城市名映射 ────────────────────────────────────────

const CITY_EN_TO_ZH: Record<string, string> = {
  shanghai: "上海", beijing: "北京", shenzhen: "深圳",
  suzhou: "苏州", chengdu: "成都", guangzhou: "广州",
  hangzhou: "杭州", changsha: "长沙", xian: "西安",
};
const CITY_ZH_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(CITY_EN_TO_ZH).map(([k, v]) => [v, k])
);

// ── 数据质量校验 ──────────────────────────────────────

const RENT_RANGES: Record<PropertyType, [number, number]> = {
  OFFICE: [1.5, 50],
  SHOPS: [3, 60],
  INDUSTRIAL: [0.5, 10],
};

function validateRent(faceRent: number, propertyType: PropertyType): boolean {
  const [min, max] = RENT_RANGES[propertyType];
  return faceRent >= min && faceRent <= max;
}

function validateArea(area: number): boolean {
  return area >= 100 && area <= 1000000;
}

// ___________________________________________________________________________
// ══════════════════════════════════════════════════════════════════════════
// 平台 1: 贝壳商办 (ke.com/office)
// ══════════════════════════════════════════════════════════════════════════

const BEIKE_CITY_CODES: Record<string, string> = {
  shanghai: "sh", beijing: "bj", shenzhen: "sz",
  suzhou: "su", chengdu: "cd", guangzhou: "gz",
  hangzhou: "hz", changsha: "cs", xian: "xa",
};

function buildBeikeListUrl(city: string, district: string, page = 1): string {
  const cityCode = BEIKE_CITY_CODES[city] || city;
  // 贝壳商办搜索URL: office.ke.com/{city}/{district}/
  if (district && district !== "all") {
    return `https://office.ke.com/${cityCode}/${district}/pg${page}/`;
  }
  return `https://office.ke.com/${cityCode}/pg${page}/`;
}

function parseBeikeListingPage(html: string): SsrHydrationResult[] {
  const results: SsrHydrationResult[] = [];

  // 贝壳商办列表页结构：每个房源在 <div class="office-list-item"> 或类似容器中
  // 常见模式：data-housecode 属性包含房源信息
  // 使用正则提取每个房源的区块

  const listingBlocks = html.split(/<div[^>]*\bclass="[^"]*office-list(?:-item)?[^"]*"[^>]*>/gi);
  if (listingBlocks.length < 2) {
    // 尝试备选结构
    const altBlocks = html.split(/<div[^>]*\bclass="[^"]*info-panel[^"]*"[^>]*>/gi);
    if (altBlocks.length >= 2) {
      return parseGenericListingBlocks(altBlocks, "贝壳商办", "OFFICE");
    }
    console.log("[贝壳] 未找到列表项，尝试 JSON-LD");
    return tryBeikeJsonLd(html);
  }

  for (let i = 1; i < listingBlocks.length; i++) {
    const block = listingBlocks[i];
    // 提取项目名称
    const nameMatch =
      block.match(/<a[^>]*\bclass="[^"]*name[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
    const projectName = nameMatch
      ? nameMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    // 跳过非房源区块
    if (!projectName || projectName.length < 2) continue;

    // 提取价格
    const priceMatch =
      block.match(/(\d+[\d.]*)\s*(?:元|￥|¥)[^<]*?(?:[\/／][^<]*?(?:㎡|平|m2|天|日))/i) ||
      block.match(/<span[^>]*\bclass="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const rawPriceText = priceMatch
      ? priceMatch[0].replace(/<[^>]*>/g, "").trim()
      : "";

    // 提取面积
    const areaMatch =
      extractArea(block) ||
      (() => {
        const m = block.match(/(\d+[\d,]*)\s*(?:㎡|m²|m2|平方米)/i);
        return m ? parseFloat(m[1].replace(/,/g, "")) : null;
      })();

    // 提取地址
    const addrMatch = block.match(
      /<span[^>]*\bclass="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    );
    const address = addrMatch
      ? addrMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    if (projectName && rawPriceText) {
      results.push({
        projectName,
        rawPriceText,
        pricePerDay: extractFaceRent(rawPriceText).value,
        freeRentMonthsText: extractFreeRentMonthsText(block),
        freeRentMonths: extractFreeRentMonths(extractFreeRentMonthsText(block)).months,
        area: areaMatch ?? 0,
        address,
        district: "",
        cityKeystring: "",
        propertyType: "OFFICE",
        url: "",
        platformName: "贝壳商办",
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

function tryBeikeJsonLd(html: string): SsrHydrationResult[] {
  const jsonLd = extractJsonLd(html);
  if (!jsonLd) return [];

  const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const results: SsrHydrationResult[] = [];

  for (const item of items) {
    if ((item["@type"] === "Product" || item["@type"] === "RealEstateListing") && item.name) {
      const priceValue = item.offers?.price || item.price;
      const priceText = priceValue ? `${priceValue}元/㎡/天` : "";

      results.push({
        projectName: item.name,
        rawPriceText: priceText,
        pricePerDay: typeof priceValue === "number" ? priceValue : null,
        freeRentMonthsText: "",
        freeRentMonths: 0,
        area: item.floorSize?.value || 0,
        address: item.address?.streetAddress || "",
        district: item.address?.addressLocality || "",
        cityKeystring: "",
        propertyType: "OFFICE",
        url: item.url || "",
        platformName: "贝壳商办·JSON-LD",
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

function extractFreeRentMonthsText(html: string): string {
  const patterns = [
    /免租[期]?\s*[:：]?\s*(\d+[\d.]*)\s*(?:个?月)/i,
    /free\s*rent\s*[:：]?\s*(\d+)/i,
    /装修期\s*[:：]?\s*(\d+[\d.]*)\s*(?:个?月)/i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return match[0].replace(/<[^>]*>/g, "");
  }
  return "";
}

// ___________________________________________________________________________
// ══════════════════════════════════════════════════════════════════════════
// 平台 2: 好租 (haozu.com)
// ══════════════════════════════════════════════════════════════════════════

function buildHaozuListUrl(city: string, propertyType: PropertyType): string {
  const typePath = propertyType === "SHOPS" ? "shop" : "office";
  return `https://${city}.haozu.com/${typePath}/`;
}

function parseHaozuListingPage(
  html: string,
  propertyType: PropertyType
): SsrHydrationResult[] {
  const results: SsrHydrationResult[] = [];

  // 好租列表页：每个房源在 <li class="list-item"> 或 <div class="item"> 中
  const blocks = html.split(
    /<(?:li|div)[^>]*\bclass="[^"]*(?:list-item|item-unit|property-item)[^"]*"[^>]*>/gi
  );

  if (blocks.length < 2) {
    return parseGenericListingBlocks(
      html.split(/<(?:div|li)[^>]*\bclass="[^"]*(?:item|unit)[^"]*"[^>]*>/gi),
      "好租",
      propertyType
    );
  }

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    const nameMatch =
      block.match(/<a[^>]*\bclass="[^"]*(?:title|name)[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<h\d[^>]*\bclass="[^"]*(?:title|name)[^"]*"[^>]*>([\s\S]*?)<\/h\d>/i) ||
      block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
    const projectName = nameMatch
      ? nameMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    if (!projectName || projectName.length < 2) continue;

    const priceMatch =
      block.match(/(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:㎡|平|m2)\s*[\/／]\s*(?:天|日|月)/i) ||
      block.match(/<span[^>]*\bclass="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
    const rawPriceText = priceMatch
      ? priceMatch[0].replace(/<[^>]*>/g, "").trim()
      : "";

    // 好租价格可能是 元/㎡/月，需要除以30转天
    let pricePerDay: number | null = extractFaceRent(rawPriceText).value;
    if (pricePerDay === null) {
      const monthlyRe = /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:㎡|平|m2)\s*[\/／]\s*(?:月|mon)/i;
      const monthlyMatch = block.match(monthlyRe);
      if (monthlyMatch) {
        const monthly = parseFloat(monthlyMatch[1]);
        if (Number.isFinite(monthly)) {
          pricePerDay = parseFloat((monthly / 30).toFixed(1));
        }
      }
    }

    const area = extractArea(block);
    const addrMatch = block.match(
      /<span[^>]*\bclass="[^"]*(?:address|location|addr)[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    );
    const address = addrMatch
      ? addrMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    if (projectName) {
      results.push({
        projectName,
        rawPriceText,
        pricePerDay,
        freeRentMonthsText: extractFreeRentMonthsText(block),
        freeRentMonths: extractFreeRentMonths(extractFreeRentMonthsText(block)).months,
        area: area ?? 0,
        address,
        district: "",
        cityKeystring: "",
        propertyType,
        url: "",
        platformName: "好租",
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ___________________________________________________________________________
// ══════════════════════════════════════════════════════════════════════════
// 平台 3: 安居客 (anjuke.com)
// ══════════════════════════════════════════════════════════════════════════

function buildAnjukeListUrl(city: string): string {
  return `https://${city}.anjuke.com/office/`;
}

function parseAnjukeListingPage(
  html: string,
  propertyType: PropertyType
): SsrHydrationResult[] {
  const results: SsrHydrationResult[] = [];

  // 安居客列表页：每个房源在 <div class="list-item"> 或 <div data-link="">
  const blocks = html.split(
    /<(?:div|li)[^>]*\bclass="[^"]*(?:list-item|property-item|unit-item)[^"]*"[^>]*>/gi
  );

  if (blocks.length < 2) {
    return parseGenericListingBlocks(
      html.split(/<(?:div|li)[^>]*\bclass="[^"]*(?:item)[^"]*"[^>]*>/gi),
      "安居客",
      propertyType
    );
  }

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    const nameMatch =
      block.match(/<a[^>]*\bclass="[^"]*(?:house-title|title|name)[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<a[^>]*\btarget="_blank"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
    const projectName = nameMatch
      ? nameMatch[1].replace(/<[^>]*>/g, "").trim().replace(/^\s*\d+\.?\s*/, "")
      : "";

    if (!projectName || projectName.length < 2) continue;

    const priceMatch =
      block.match(/(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／][^<]*?(?:天|日)/i) ||
      block.match(/<span[^>]*\bclass="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
      block.match(/<em[^>]*\bclass="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/em>/i);

    const rawPriceText = priceMatch
      ? priceMatch[0].replace(/<[^>]*>/g, "").trim()
      : "";

    const pricePerDay = extractFaceRent(rawPriceText).value;
    const area = extractArea(block);

    const addrMatch = block.match(
      /<span[^>]*\bclass="[^"]*(?:address|addr|position|comm-address)[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    );
    const address = addrMatch
      ? addrMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    if (projectName) {
      results.push({
        projectName,
        rawPriceText,
        pricePerDay,
        freeRentMonthsText: "",
        freeRentMonths: 0,
        area: area ?? 0,
        address,
        district: "",
        cityKeystring: "",
        propertyType,
        url: "",
        platformName: "安居客",
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ___________________________________________________________________________
// ══════════════════════════════════════════════════════════════════════════
// 平台 4: 点点租 (diandianzu.com)
// ══════════════════════════════════════════════════════════════════════════

function buildDiandianzuListUrl(city: string, page = 1): string {
  return `https://${city}.diandianzu.com/list-pg${page}/`;
}

function parseDiandianzuListingPage(
  html: string,
  propertyType: PropertyType
): SsrHydrationResult[] {
  const results: SsrHydrationResult[] = [];

  // 点点租使用 card/item 结构
  const blocks = html.split(
    /<(?:div|li)[^>]*\bclass="[^"]*(?:card|item-unit|list-item|building-item)[^"]*"[^>]*>/gi
  );

  if (blocks.length < 2) {
    return parseGenericListingBlocks(
      html.split(/<(?:div|li)[^>]*\bclass="[^"]*(?:item|unit)[^"]*"[^>]*>/gi),
      "点点租",
      propertyType
    );
  }

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    const nameMatch =
      block.match(/<a[^>]*\bclass="[^"]*(?:name|title|building-name)[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<h\d[^>]*\bclass="[^"]*(?:name|title)[^"]*"[^>]*>([\s\S]*?)<\/h\d>/i) ||
      block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
    const projectName = nameMatch
      ? nameMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    if (!projectName || projectName.length < 2) continue;

    const priceMatch =
      block.match(/(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:㎡|平|m2)\s*[\/／]\s*(?:天|日)/i) ||
      block.match(/<span[^>]*\bclass="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
      block.match(/<em[^>]*>([\s\S]*?元[\s\S]*?)<\/em>/i);

    const rawPriceText = priceMatch
      ? priceMatch[0].replace(/<[^>]*>/g, "").trim()
      : "";

    const pricePerDay = extractFaceRent(rawPriceText).value;
    const area = extractArea(block);

    const addrMatch = block.match(
      /<span[^>]*\bclass="[^"]*(?:address|addr|location|position)[^"]*"[^>]*>([\s\S]*?)<\/span>/i
    );
    const address = addrMatch
      ? addrMatch[1].replace(/<[^>]*>/g, "").trim()
      : "";

    if (projectName) {
      results.push({
        projectName,
        rawPriceText,
        pricePerDay,
        freeRentMonthsText: "",
        freeRentMonths: 0,
        area: area ?? 0,
        address,
        district: "",
        cityKeystring: "",
        propertyType,
        url: "",
        platformName: "点点租",
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

// ___________________________________________________________________________
// ══════════════════════════════════════════════════════════════════════════
// 通用解析器 — 所有平台的 JSON-LD + 结构化数据回退
// ══════════════════════════════════════════════════════════════════════════

function parseGenericListingBlocks(
  blocks: string[],
  platformName: string,
  propertyType: PropertyType
): SsrHydrationResult[] {
  const results: SsrHydrationResult[] = [];

  if (blocks.length < 2) return results;

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];

    // 尝试提取任何形式的价格数字
    const priceText = extractPriceFromHtmlFragment(block);
    const area = extractArea(block);

    // 提取名称
    const nameMatch =
      block.match(/<a[^>]*>([\s\S]*?)<\/a>/i) ||
      block.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
    const projectName = nameMatch
      ? nameMatch[1].replace(/<[^>]*>/g, "").trim().substring(0, 80)
      : "";

    if (projectName && priceText) {
      results.push({
        projectName,
        rawPriceText: priceText,
        pricePerDay: extractFaceRent(priceText).value,
        freeRentMonthsText: "",
        freeRentMonths: 0,
        area: area ?? 0,
        address: "",
        district: "",
        cityKeystring: "",
        propertyType,
        url: "",
        platformName,
        scrapedAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

function extractPriceFromHtmlFragment(html: string): string {
  const patterns = [
    /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:㎡|m2|平)\s*[\/／]\s*(?:天|日)/i,
    /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:天|日)/i,
    /\b(?:price|租金)\s*[:：]?\s*(\d+[\d.]*)/i,
    />\s*(\d+[\d.]*)\s*(?:元|￥|¥)[^<]*</i,
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return match[0].replace(/<[^>]*>/g, "").trim();
  }
  return "";
}

// ___________________________________________________________________________
// ══════════════════════════════════════════════════════════════════════════
// 主爬虫类 — SsrHydrationScraper
// ══════════════════════════════════════════════════════════════════════════

export class SsrHydrationScraper {
  // ── 平台分发路由 ─────────────────────────────────

  private static routePlatform(targetUrl: string): PlatformRegistry | null {
    if (targetUrl.includes("ke.com") || targetUrl.includes("贝壳")) {
      return {
        name: "beike",
        displayName: "贝壳商办",
        domainPattern: /ke\.com/,
        crawl: this.crawlBeike.bind(this),
        crawlDetail: async () => null,
      };
    }
    if (targetUrl.includes("haozu.com") || targetUrl.includes("好租")) {
      return {
        name: "haozu",
        displayName: "好租",
        domainPattern: /haozu\.com/,
        crawl: this.crawlHaozu.bind(this),
        crawlDetail: async () => null,
      };
    }
    if (targetUrl.includes("anjuke.com") || targetUrl.includes("安居客")) {
      return {
        name: "anjuke",
        displayName: "安居客",
        domainPattern: /anjuke\.com/,
        crawl: this.crawlAnjuke.bind(this),
        crawlDetail: async () => null,
      };
    }
    if (
      targetUrl.includes("diandianzu.com") ||
      targetUrl.includes("点点租")
    ) {
      return {
        name: "diandianzu",
        displayName: "点点租",
        domainPattern: /diandianzu\.com/,
        crawl: this.crawlDiandianzu.bind(this),
        crawlDetail: async () => null,
      };
    }
    return null;
  }

  // ── 平台 1: 贝壳商办 ──────────────────────────────

  private static async crawlBeike(
    config: CrawlJobConfig
  ): Promise<SsrHydrationResult[]> {
    const cityCode = BEIKE_CITY_CODES[config.city] || config.city;
    const allResults: SsrHydrationResult[] = [];
    const maxPages = config.maxResults ? Math.ceil(config.maxResults / 20) : 3;

    for (let page = 1; page <= maxPages; page++) {
      const listUrl = buildBeikeListUrl(config.city, config.district, page);
      console.log(`  [贝壳] 列表页 ${page}: ${listUrl}`);

      const result = await fetchWithRetry(listUrl);
      if (!result || result.status !== 200) {
        console.warn(`  [贝壳] 列表页 ${page} 获取失败 (HTTP ${result?.status})`);
        continue;
      }

      const parsed = parseBeikeListingPage(result.html);

      // 填充城市/区/业态信息
      for (const item of parsed) {
        item.cityKeystring = config.city;
        item.district = config.district;
        item.propertyType = config.propertyType;
        item.url = result.finalUrl;
      }

      allResults.push(...parsed);
      console.log(`  [贝壳] 列表页 ${page} 提取 ${parsed.length} 条`);

      // 如果当前页无结果，停止翻页
      if (parsed.length === 0) break;

      // 翻页间隔
      if (page < maxPages) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    return allResults;
  }

  // ── 平台 2: 好租 ──────────────────────────────────

  private static async crawlHaozu(
    config: CrawlJobConfig
  ): Promise<SsrHydrationResult[]> {
    const listUrl = buildHaozuListUrl(config.city, config.propertyType);
    console.log(`  [好租] 列表页: ${listUrl}`);

    const result = await fetchWithRetry(listUrl);
    if (!result || result.status !== 200) {
      console.warn(`  [好租] 获取失败 (HTTP ${result?.status})`);
      return [];
    }

    const parsed = parseHaozuListingPage(result.html, config.propertyType);

    for (const item of parsed) {
      item.cityKeystring = config.city;
      item.district = config.district;
      item.url = result.finalUrl;
    }

    console.log(`  [好租] 提取 ${parsed.length} 条`);
    return parsed;
  }

  // ── 平台 3: 安居客 ─────────────────────────────────

  private static async crawlAnjuke(
    config: CrawlJobConfig
  ): Promise<SsrHydrationResult[]> {
    const listUrl = buildAnjukeListUrl(config.city);
    console.log(`  [安居客] 列表页: ${listUrl}`);

    const result = await fetchWithRetry(listUrl);
    if (!result || result.status !== 200) {
      console.warn(`  [安居客] 获取失败 (HTTP ${result?.status})`);
      return [];
    }

    const parsed = parseAnjukeListingPage(result.html, config.propertyType);

    for (const item of parsed) {
      item.cityKeystring = config.city;
      item.district = config.district;
      item.url = result.finalUrl;
    }

    console.log(`  [安居客] 提取 ${parsed.length} 条`);
    return parsed;
  }

  // ── 平台 4: 点点租 ─────────────────────────────────

  private static async crawlDiandianzu(
    config: CrawlJobConfig
  ): Promise<SsrHydrationResult[]> {
    const allResults: SsrHydrationResult[] = [];
    const maxPages = config.maxResults ? Math.ceil(config.maxResults / 20) : 3;

    for (let page = 1; page <= maxPages; page++) {
      const listUrl = buildDiandianzuListUrl(config.city, page);
      console.log(`  [点点租] 列表页 ${page}: ${listUrl}`);

      const result = await fetchWithRetry(listUrl);
      if (!result || result.status !== 200) {
        console.warn(`  [点点租] 列表页 ${page} 获取失败 (HTTP ${result?.status})`);
        continue;
      }

      const parsed = parseDiandianzuListingPage(result.html, config.propertyType);

      for (const item of parsed) {
        item.cityKeystring = config.city;
        item.district = config.district;
        item.url = result.finalUrl;
      }

      allResults.push(...parsed);
      console.log(`  [点点租] 列表页 ${page} 提取 ${parsed.length} 条`);

      if (parsed.length === 0) break;
      if (page < maxPages) await new Promise((r) => setTimeout(r, 1500));
    }

    return allResults;
  }

  // ── 公共: 旧版 dehydratePropertyPage 接口（保持兼容）─

  static async dehydratePropertyPage(
    targetUrl: string
  ): Promise<SsrHydrationResult | null> {
    console.log(`[SSR爬虫] 抓取详情页 → ${targetUrl}`);

    const platform = this.routePlatform(targetUrl);
    if (!platform) {
      console.warn(`[SSR爬虫] ${targetUrl} 无匹配平台路由`);
      return null;
    }

    // 使用列表页爬取获取第一条
    const context: Partial<CrawlJobConfig> = {
      targetUrl,
      label: platform.displayName,
      propertyType: "OFFICE",
      city: this.guessCityFromUrl(targetUrl),
      district: "all",
      maxResults: 1,
    };

    const results = await platform.crawl(context as CrawlJobConfig);
    return results.length > 0 ? results[0] : null;
  }

  // ── 公共: 根据 CrawlJobConfig 执行完整爬取 ─────────

  static async crawlJob(config: CrawlJobConfig): Promise<SsrHydrationResult[]> {
    console.log(
      `\n[爬虫] 开始 ${config.label} | ${config.city}/${config.district} | ${config.propertyType}`
    );

    const platform = this.routePlatform(config.targetUrl);
    if (!platform) {
      console.error(`[爬虫] ${config.targetUrl} 无匹配平台路由`);
      return [];
    }

    let results: SsrHydrationResult[] = [];

    try {
      results = await platform.crawl(config);
    } catch (err: any) {
      console.error(`[爬虫] ${config.label} 异常: ${err.message}`);
      return [];
    }

    console.log(
      `[爬虫] ${config.label} 完成: ${results.length} 条房源\n`
    );
    return results;
  }

  // ── 公共: 批量爬取 ────────────────────────────────

  static async crawlBatch(
    jobs: CrawlJobConfig[],
    concurrency = 2
  ): Promise<Map<string, SsrHydrationResult[]>> {
    const resultsByLabel = new Map<string, SsrHydrationResult[]>();

    // 串行执行以避免触发反爬
    for (const job of jobs) {
      const results = await this.crawlJob(job);
      resultsByLabel.set(job.label, results);

      // 平台间冷却
      if (jobs.indexOf(job) < jobs.length - 1) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    return resultsByLabel;
  }

  // ── 公共: 将 SsrHydrationResult 转为 RawScrapedPackage ─

  static async enrichToRawPackage(
    item: SsrHydrationResult
  ): Promise<RawScrapedPackage> {
    // 调用 GIS 获取商圈数据
    const gisStats = await GeoGisScraper.calculateSubmarketDemographics({
      projectName: item.projectName,
      city: item.cityKeystring,
      district: item.district,
      roughAddress: item.address,
    });

    const faceRent = validateRent(item.pricePerDay ?? 0, item.propertyType)
      ? item.pricePerDay ?? 0
      : 0;

    return {
      projectName: item.projectName,
      city: CITY_EN_TO_ZH[item.cityKeystring] || item.cityKeystring,
      district: item.district,
      roughAddress: item.address,
      propertyType: item.propertyType,
      rawPriceText: item.rawPriceText || `${faceRent}元/㎡/天`,
      freeRentMonthsText: item.freeRentMonthsText || "0",
      area: validateArea(item.area) ? item.area : undefined,
      leaseTotalMonths: 36,
      macroSubmarketVacancy: gisStats.macroSubmarketVacancy ?? 0.15,
      inputLtv: 0.6,
      compTxPrice: undefined,
      noiCagr3Y: 0.02,
      opexRatio: undefined,
    };
  }

  // ── 完整管线：爬取 + GIS + 转 RawPackage ──────────

  static async crawlAndEnrich(
    config: CrawlJobConfig
  ): Promise<RawScrapedPackage[]> {
    const results = await this.crawlJob(config);
    if (results.length === 0) return [];

    console.log(
      `\n[GIS赋能] 为 ${results.length} 条房源补充商圈数据...`
    );

    const packages: RawScrapedPackage[] = [];
    for (const item of results) {
      const pkg = await this.enrichToRawPackage(item);
      packages.push(pkg);
    }

    console.log(`[GIS赋能] 完成 ${packages.length} 条\n`);
    return packages;
  }

  // ── 工具: 从 URL 猜测城市 ─────────────────────────

  private static guessCityFromUrl(url: string): string {
    const hostMatch = url.match(/([a-z]+)\.(?:ke\.com|haozu\.com|anjuke\.com|diandianzu\.com)/i);
    if (hostMatch) {
      const subdomain = hostMatch[1].toLowerCase();
      // 反查 CITY_EN_TO_ZH，也查 BEIKE_CITY_CODES
      const en = CITY_ZH_TO_EN[subdomain] || Object.keys(CITY_EN_TO_ZH).find((k) => k === subdomain);
      if (en) return en;
    }
    return "shanghai";
  }
}
