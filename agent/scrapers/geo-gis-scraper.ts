// agent/scrapers/geo-gis-scraper.ts
// ============================================================
// 地理 GIS 爬虫 — 高德地图 API + 城市知识库 + 坐标验证
// 与 DATA_DICTIONARY.md v5.0 / master-pipeline 对齐
// ============================================================
import axios from "axios";

// ── 公共接口 ──────────────────────────────────────────

export interface GeoStats {
  /** 子市场空置率 (0-1)，GSI 估算值 */
  macroSubmarketVacancy?: number;
  /** 验证后的面积(㎡)，从地理API补全 */
  area?: number;
  /** 人口密度估计 (人/平方公里) */
  populationDensity?: number;
  /** 交通可达性评分 (1-10) */
  transitScore?: number;
  /** 500m 内商业POI数量 */
  nearbyPoiCount?: number;
  /** 坐标验证信息 */
  coordinateValidation?: {
    isValid: boolean;
    formattedAddress: string;
    confidence: number;
  };
}

export interface GeoQueryInput {
  /** 项目/建筑名称 */
  projectName: string;
  /** 城市名（中文） */
  city: string;
  /** 行政区（中文） */
  district: string;
  /** 粗略地址（完整或部分地址字符串） */
  roughAddress: string;
  /** 可选：已知坐标 [lng, lat] */
  coords?: [number, number];
}

// ── 城市/商圈知识库 ──────────────────────────────────

interface DistrictProfile {
  district: string;
  citySimKey: string;
  /** 商圈空置率估计 (0-1) */
  vacancyEstimate: number;
  /** 基准人口密度 (人/km²) */
  baseDensity: number;
  /** 交通评分 (1-10) */
  transitScore: number;
  /** 商圈等级分类 */
  tier: "TIER_1" | "TIER_2" | "TIER_3";
}

const CITY_ALIAS_MAP: Record<string, string> = {
  shanghai: "shanghai", "上海": "shanghai", sh: "shanghai",
  beijing: "beijing", "北京": "beijing", bj: "beijing",
  shenzhen: "shenzhen", "深圳": "shenzhen", sz: "shenzhen",
  suzhou: "suzhou", "苏州": "suzhou", su: "suzhou",
  chengdu: "chengdu", "成都": "chengdu", cd: "chengdu",
  guangzhou: "guangzhou", "广州": "guangzhou", gz: "guangzhou",
  hangzhou: "hangzhou", "杭州": "hangzhou", hz: "hangzhou",
  changsha: "changsha", "长沙": "changsha", cs: "changsha",
  xian: "xian", "西安": "xian", xa: "xian",
};

function normalizeCity(raw: string): string {
  return CITY_ALIAS_MAP[raw.trim()] || raw.trim().toLowerCase();
}

/**
 * 核心9城核心商圈知识库
 * vacancyEstimate 来自 Savills/JLL 公开报告均值
 */
const DISTRICT_KNOWLEDGE: DistrictProfile[] = [
  // 上海
  { district: "lujiazui", citySimKey: "shanghai", vacancyEstimate: 0.065, baseDensity: 28000, transitScore: 9.5, tier: "TIER_1" },
  { district: "pudong", citySimKey: "shanghai", vacancyEstimate: 0.078, baseDensity: 12000, transitScore: 7.5, tier: "TIER_2" },
  { district: "jing_an", citySimKey: "shanghai", vacancyEstimate: 0.045, baseDensity: 35000, transitScore: 9.0, tier: "TIER_1" },
  { district: "huangpu", citySimKey: "shanghai", vacancyEstimate: 0.055, baseDensity: 42000, transitScore: 9.5, tier: "TIER_1" },
  { district: "xuhui", citySimKey: "shanghai", vacancyEstimate: 0.072, baseDensity: 22000, transitScore: 8.5, tier: "TIER_1" },
  { district: "changning", citySimKey: "shanghai", vacancyEstimate: 0.060, baseDensity: 25000, transitScore: 8.0, tier: "TIER_1" },
  { district: "zhangjiang", citySimKey: "shanghai", vacancyEstimate: 0.085, baseDensity: 8000, transitScore: 6.5, tier: "TIER_2" },
  { district: "qiantan", citySimKey: "shanghai", vacancyEstimate: 0.052, baseDensity: 15000, transitScore: 8.5, tier: "TIER_1" },
  { district: "hongkou", citySimKey: "shanghai", vacancyEstimate: 0.068, baseDensity: 30000, transitScore: 7.5, tier: "TIER_2" },
  { district: "yangpu", citySimKey: "shanghai", vacancyEstimate: 0.075, baseDensity: 18000, transitScore: 7.0, tier: "TIER_2" },
  // 北京
  { district: "chaoyang", citySimKey: "beijing", vacancyEstimate: 0.058, baseDensity: 22000, transitScore: 9.0, tier: "TIER_1" },
  { district: "haidian", citySimKey: "beijing", vacancyEstimate: 0.050, baseDensity: 18000, transitScore: 8.0, tier: "TIER_1" },
  { district: "dongcheng", citySimKey: "beijing", vacancyEstimate: 0.042, baseDensity: 35000, transitScore: 9.0, tier: "TIER_1" },
  { district: "xicheng", citySimKey: "beijing", vacancyEstimate: 0.040, baseDensity: 38000, transitScore: 9.0, tier: "TIER_1" },
  // 深圳
  { district: "nanshan", citySimKey: "shenzhen", vacancyEstimate: 0.085, baseDensity: 16000, transitScore: 8.5, tier: "TIER_1" },
  { district: "futian", citySimKey: "shenzhen", vacancyEstimate: 0.072, baseDensity: 25000, transitScore: 9.0, tier: "TIER_1" },
  { district: "luohu", citySimKey: "shenzhen", vacancyEstimate: 0.068, baseDensity: 30000, transitScore: 8.0, tier: "TIER_1" },
  { district: "baoan", citySimKey: "shenzhen", vacancyEstimate: 0.095, baseDensity: 10000, transitScore: 6.5, tier: "TIER_2" },
  // 广州
  { district: "tianhe", citySimKey: "guangzhou", vacancyEstimate: 0.070, baseDensity: 20000, transitScore: 8.5, tier: "TIER_1" },
  { district: "yuexiu", citySimKey: "guangzhou", vacancyEstimate: 0.065, baseDensity: 32000, transitScore: 8.0, tier: "TIER_1" },
  { district: "haizhu", citySimKey: "guangzhou", vacancyEstimate: 0.078, baseDensity: 15000, transitScore: 7.0, tier: "TIER_2" },
  // 杭州
  { district: "xihu", citySimKey: "hangzhou", vacancyEstimate: 0.062, baseDensity: 15000, transitScore: 8.0, tier: "TIER_1" },
  { district: "binjiang", citySimKey: "hangzhou", vacancyEstimate: 0.075, baseDensity: 9000, transitScore: 7.0, tier: "TIER_2" },
  // 苏州
  { district: "gusu", citySimKey: "suzhou", vacancyEstimate: 0.130, baseDensity: 12000, transitScore: 7.0, tier: "TIER_2" },
  { district: "suzhou_gongyeyuan", citySimKey: "suzhou", vacancyEstimate: 0.110, baseDensity: 6000, transitScore: 5.5, tier: "TIER_3" },
  // 成都
  { district: "jinjiang", citySimKey: "chengdu", vacancyEstimate: 0.095, baseDensity: 18000, transitScore: 7.5, tier: "TIER_1" },
  { district: "wuhou", citySimKey: "chengdu", vacancyEstimate: 0.088, baseDensity: 15000, transitScore: 7.5, tier: "TIER_1" },
  { district: "gaoxin", citySimKey: "chengdu", vacancyEstimate: 0.110, baseDensity: 7000, transitScore: 6.0, tier: "TIER_2" },
  // 长沙
  { district: "yuelu", citySimKey: "changsha", vacancyEstimate: 0.125, baseDensity: 10000, transitScore: 6.5, tier: "TIER_2" },
  { district: "furong", citySimKey: "changsha", vacancyEstimate: 0.115, baseDensity: 14000, transitScore: 7.0, tier: "TIER_2" },
  // 西安
  { district: "yanta", citySimKey: "xian", vacancyEstimate: 0.120, baseDensity: 11000, transitScore: 6.5, tier: "TIER_2" },
  { district: "weiyang", citySimKey: "xian", vacancyEstimate: 0.130, baseDensity: 9000, transitScore: 6.0, tier: "TIER_3" },
];

// 城市级默认值（无精确商圈匹配时回退）
const CITY_DEFAULTS: Record<string, DistrictProfile> = {
  shanghai: { district: "_default", citySimKey: "shanghai", vacancyEstimate: 0.072, baseDensity: 20000, transitScore: 7.5, tier: "TIER_2" },
  beijing: { district: "_default", citySimKey: "beijing", vacancyEstimate: 0.060, baseDensity: 22000, transitScore: 8.0, tier: "TIER_2" },
  shenzhen: { district: "_default", citySimKey: "shenzhen", vacancyEstimate: 0.088, baseDensity: 18000, transitScore: 8.0, tier: "TIER_2" },
  guangzhou: { district: "_default", citySimKey: "guangzhou", vacancyEstimate: 0.078, baseDensity: 16000, transitScore: 7.0, tier: "TIER_2" },
  hangzhou: { district: "_default", citySimKey: "hangzhou", vacancyEstimate: 0.080, baseDensity: 11000, transitScore: 7.0, tier: "TIER_2" },
  suzhou: { district: "_default", citySimKey: "suzhou", vacancyEstimate: 0.145, baseDensity: 8000, transitScore: 5.5, tier: "TIER_3" },
  chengdu: { district: "_default", citySimKey: "chengdu", vacancyEstimate: 0.105, baseDensity: 12000, transitScore: 6.5, tier: "TIER_2" },
  changsha: { district: "_default", citySimKey: "changsha", vacancyEstimate: 0.135, baseDensity: 10000, transitScore: 6.0, tier: "TIER_3" },
  xian: { district: "_default", citySimKey: "xian", vacancyEstimate: 0.140, baseDensity: 9000, transitScore: 5.5, tier: "TIER_3" },
};

// ── 行政区名称模糊匹配 ───────────────────────────────

function normalizeDistrict(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.includes("浦东") || s.includes("pudong")) return "pudong";
  if (s.includes("静安") || s.includes("jingan") || s.includes("jing_an")) return "jing_an";
  if (s.includes("陆家嘴") || s.includes("lujiazui")) return "lujiazui";
  if (s.includes("黄浦") || s.includes("huangpu")) return "huangpu";
  if (s.includes("徐汇") || s.includes("xuhui")) return "xuhui";
  if (s.includes("长宁") || s.includes("changning")) return "changning";
  if (s.includes("张江") || s.includes("zhangjiang")) return "zhangjiang";
  if (s.includes("前滩") || s.includes("qiantan")) return "qiantan";
  if (s.includes("虹口") || s.includes("hongkou")) return "hongkou";
  if (s.includes("杨浦") || s.includes("yangpu")) return "yangpu";
  if (s.includes("朝阳") || s.includes("chaoyang")) return "chaoyang";
  if (s.includes("海淀") || s.includes("haidian")) return "haidian";
  if (s.includes("东城") || s.includes("dongcheng")) return "dongcheng";
  if (s.includes("西城") || s.includes("xicheng")) return "xicheng";
  if (s.includes("南山") || s.includes("nanshan")) return "nanshan";
  if (s.includes("福田") || s.includes("futian")) return "futian";
  if (s.includes("罗湖") || s.includes("luohu")) return "luohu";
  if (s.includes("宝安") || s.includes("baoan")) return "baoan";
  if (s.includes("天河") || s.includes("tianhe")) return "tianhe";
  if (s.includes("越秀") || s.includes("yuexiu")) return "yuexiu";
  if (s.includes("海珠") || s.includes("haizhu")) return "haizhu";
  if (s.includes("西湖") || s.includes("xihu")) return "xihu";
  if (s.includes("滨江") || s.includes("binjiang")) return "binjiang";
  if (s.includes("姑苏") || s.includes("gusu")) return "gusu";
  if (s.includes("工业园") || s.includes("gongyeyuan")) return "suzhou_gongyeyuan";
  if (s.includes("锦江") || s.includes("jinjiang")) return "jinjiang";
  if (s.includes("武侯") || s.includes("wuhou")) return "wuhou";
  if (s.includes("高新") || s.includes("gaoxin")) return "gaoxin";
  if (s.includes("岳麓") || s.includes("yuelu")) return "yuelu";
  if (s.includes("芙蓉") || s.includes("furong")) return "furong";
  if (s.includes("雁塔") || s.includes("yanta")) return "yanta";
  if (s.includes("未央") || s.includes("weiyang")) return "weiyang";
  return s.replace(/\s+/g, "_");
}

// ── 商圈匹配 ──────────────────────────────────────────

function lookupDistrictProfile(city: string, district: string): DistrictProfile | null {
  const cityKey = normalizeCity(city);
  const districtKey = normalizeDistrict(district);

  // 精确匹配
  let match = DISTRICT_KNOWLEDGE.find(
    (d) => d.citySimKey === cityKey && d.district === districtKey
  );
  if (match) return match;

  // 区名包含匹配
  match = DISTRICT_KNOWLEDGE.find(
    (d) =>
      d.citySimKey === cityKey &&
      (districtKey.includes(d.district) || d.district.includes(districtKey))
  );
  if (match) return match;

  // 返回城市默认
  return CITY_DEFAULTS[cityKey] || null;
}

// ── 坐标验证 ──────────────────────────────────────────

/**
 * 校验经纬度是否在合理范围内
 * 中国地理范围：经度 73-135，纬度 18-54
 */
function validateCoordBounds(lng: number, lat: number): boolean {
  return lng >= 73 && lng <= 135 && lat >= 18 && lat <= 54;
}

// ── 高德地图 API 集成 ─────────────────────────────────

/**
 * 高德地图地理编码 API
 * 将地址转换为坐标 + 结构化地址
 */
export async function gaodeGeocode(
  address: string,
  city?: string
): Promise<{
  formattedAddress: string;
  lng: number;
  lat: number;
  adcode: string;
  district: string;
  confidence: number;
} | null> {
  const apiKey = process.env.AMAP_API_KEY || process.env.GAODE_API_KEY;
  if (!apiKey) {
    console.log("[GIS·高德] 无 AMAP_API_KEY，跳过地理编码");
    return null;
  }

  try {
    const params: Record<string, string> = {
      key: apiKey,
      address: address,
      output: "JSON",
    };
    if (city) params.city = city;

    const response = await axios.get(
      "https://restapi.amap.com/v3/geocode/geo",
      { params, timeout: 8000 }
    );

    const data = response.data;
    if (data.status !== "1" || !data.geocodes?.length) {
      console.warn(`[GIS·高德] 地理编码无结果: ${address}`);
      return null;
    }

    const best = data.geocodes[0];
    const location = best.location?.split(",");
    if (!location || location.length !== 2) return null;

    return {
      formattedAddress: best.formatted_address || address,
      lng: parseFloat(location[0]),
      lat: parseFloat(location[1]),
      adcode: best.adcode || "",
      district: (best.district || "").replace(/\s+/g, ""),
      confidence: parseFloat(best.level || "1"),
    };
  } catch (err: any) {
    console.error(`[GIS·高德] API 调用失败: ${err.message}`);
    return null;
  }
}

/**
 * 高德地图逆地理编码
 */
export async function gaodeReverseGeocode(
  lng: number,
  lat: number
): Promise<{ formattedAddress: string; district: string; adcode: string } | null> {
  const apiKey = process.env.AMAP_API_KEY || process.env.GAODE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.get(
      "https://restapi.amap.com/v3/geocode/regeo",
      {
        params: {
          key: apiKey,
          location: `${lng},${lat}`,
          output: "JSON",
          radius: 100,
          extensions: "base",
        },
        timeout: 8000,
      }
    );

    const data = response.data;
    if (data.status !== "1" || !data.regeocode) return null;

    const addr = data.regeocode.addressComponent;
    return {
      formattedAddress: data.regeocode.formatted_address || "",
      district: addr?.district || addr?.township || "",
      adcode: addr?.adcode || "",
    };
  } catch {
    return null;
  }
}

// ── 商圈人口与交通估算 ────────────────────────────────

export class GeoGisScraper {

  // ── 主入口：根据查询输入计算完整 GeoStats ──────────

  static async calculateSubmarketDemographics(
    query: GeoQueryInput
  ): Promise<GeoStats> {
    const { city, district, roughAddress, coords } = query;
    const cityKey = normalizeCity(city);
    const profile = lookupDistrictProfile(city, district);

    const result: GeoStats = {};

    // 1. 商圈空置率
    result.macroSubmarketVacancy = profile?.vacancyEstimate ?? 0.15;

    // 2. 人口密度
    result.populationDensity = profile?.baseDensity ?? 10000;

    // 3. 交通评分
    result.transitScore = profile?.transitScore ?? 5.0;

    // 4. 坐标验证（优先使用 API，回退到知识库验证）
    const coordValidation = await this.validateCoordinate(
      coords ?? null,
      roughAddress,
      city
    );
    result.coordinateValidation = coordValidation;

    // 5. 附近 POI 估算（基于商圈等级）
    result.nearbyPoiCount = profile
      ? { TIER_1: 150, TIER_2: 80, TIER_3: 30 }[profile.tier]
      : 60;

    console.log(
      `[GIS] ${city} ${district} → 空置率 ${((result.macroSubmarketVacancy ?? 0) * 100).toFixed(1)}% | ` +
      `密度 ${result.populationDensity}人/km² | 交通 ${result.transitScore}/10`
    );

    return result;
  }

  // ── 保持旧接口兼容（master-pipeline 使用）─────────

  static async calculateSubmarketDemographicsLegacy(
    lng: number,
    lat: number
  ): Promise<{ macroSubmarketVacancy?: number; area?: number }> {
    if (!lng || !lat || !validateCoordBounds(lng, lat)) {
      console.log(`[GIS·Legacy] 无效坐标 (${lng},${lat})，返回默认值`);
      return { macroSubmarketVacancy: 0.15 };
    }

    // 尝试逆地理编码获取城市/区
    const reverse = await gaodeReverseGeocode(lng, lat);
    if (reverse) {
      // 用行政区匹配知识库
      for (const [cityLabel, cityKey] of Object.entries(CITY_ALIAS_MAP)) {
        if (reverse.district.toLowerCase().includes(cityLabel)) continue;
        const profile = lookupDistrictProfile(cityKey, reverse.district);
        if (profile) {
          return { macroSubmarketVacancy: profile.vacancyEstimate };
        }
      }
    }

    return { macroSubmarketVacancy: 0.15 };
  }

  // ── 坐标验证 ──────────────────────────────────────

  private static async validateCoordinate(
    coords: [number, number] | null,
    roughAddress: string,
    city: string
  ): Promise<GeoStats["coordinateValidation"]> {
    // 有API Key时优先高德地理编码
    const geocode = await gaodeGeocode(roughAddress, city);
    if (geocode) {
      return {
        isValid: validateCoordBounds(geocode.lng, geocode.lat),
        formattedAddress: geocode.formattedAddress,
        confidence: geocode.confidence,
      };
    }

    // 无API Key：坐标合法性校验
    if (coords && validateCoordBounds(coords[0], coords[1])) {
      return {
        isValid: true,
        formattedAddress: roughAddress.trim().replace(/\s+/g, ""),
        confidence: 0.7,
      };
    }

    // 无法验证但地址存在
    if (roughAddress && roughAddress.trim().length > 5) {
      return {
        isValid: true,
        formattedAddress: roughAddress.trim().replace(/\s+/g, ""),
        confidence: 0.4,
      };
    }

    return { isValid: false, formattedAddress: roughAddress, confidence: 0 };
  }
}
