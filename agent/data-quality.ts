// agent/data-quality.ts
// ============================================================
// 数据质量校验模块 — 与 DATA_DICTIONARY.md v5.0 规则对齐
// ============================================================
import { RawScrapedPackage, ProcessedAsset, PropertyType } from "./schemas";

// ── 面价范围（DATA_DICTIONARY §6） ────────────────────

const FACE_RENT_RANGES: Record<PropertyType, [number, number]> = {
  OFFICE: [1.5, 50],
  SHOPS: [3, 60],
  INDUSTRIAL: [0.5, 10],
};

/** 面积范围 */
const AREA_RANGE: [number, number] = [100, 1_000_000];

/** 免租期合理范围（月） */
const FREE_RENT_MONTHS_RANGE: [number, number] = [0, 36];

// ── 合法9城 ──────────────────────────────────────────

const VALID_CITIES = [
  "上海", "北京", "深圳", "苏州", "成都", "广州", "杭州", "长沙", "西安",
];

// ── 合法行政区（核心商圈） ────────────────────────────

const VALID_DISTRICTS_BY_CITY: Record<string, string[]> = {
  "上海": ["浦东新区", "黄浦区", "静安区", "徐汇区", "长宁区", "虹口区", "杨浦区", "普陀区", "闵行区", "宝山区", "嘉定区", "松江区"],
  "北京": ["朝阳区", "海淀区", "东城区", "西城区", "丰台区", "石景山区", "通州区", "大兴区"],
  "深圳": ["南山区", "福田区", "罗湖区", "宝安区", "龙华区", "龙岗区", "光明区", "坪山区"],
  "苏州": ["姑苏区", "吴中区", "相城区", "吴江区", "虎丘区", "苏州工业园区"],
  "成都": ["锦江区", "武侯区", "青羊区", "金牛区", "成华区", "高新区", "天府新区"],
  "广州": ["天河区", "越秀区", "海珠区", "荔湾区", "白云区", "番禺区", "黄埔区"],
  "杭州": ["西湖区", "上城区", "拱墅区", "滨江区", "余杭区", "萧山区", "钱塘区"],
  "长沙": ["岳麓区", "芙蓉区", "天心区", "开福区", "雨花区", "望城区"],
  "西安": ["雁塔区", "未央区", "碑林区", "莲湖区", "新城区", "灞桥区", "长安区"],
};

// ── 校验结果类型 ─────────────────────────────────────

export interface QualityReport {
  passed: boolean;
  severity: "OK" | "WARN" | "CRITICAL";
  checks: QualityCheck[];
  summary: string;
}

export interface QualityCheck {
  field: string;
  rule: string;
  passed: boolean;
  actual?: string;
  expected?: string;
}

// ── 单条 RawScrapedPackage 校验 ──────────────────────

export function validateRawPackage(
  pkg: RawScrapedPackage
): QualityReport {
  const checks: QualityCheck[] = [];

  // 1. 项目名非空
  const hasName = pkg.projectName && pkg.projectName.trim().length >= 2;
  checks.push({
    field: "projectName",
    rule: "项目名至少2个字符",
    passed: hasName,
    actual: pkg.projectName?.substring(0, 30),
    expected: "非空，≥2字符",
  });

  // 2. 城市合法性
  const validCity = VALID_CITIES.includes(pkg.city);
  checks.push({
    field: "city",
    rule: "必须在9城列表内",
    passed: validCity,
    actual: pkg.city,
  });

  // 3. 行政区合法性
  let validDistrict = true;
  if (pkg.district) {
    const cityDistricts = VALID_DISTRICTS_BY_CITY[pkg.city] || [];
    // 模糊匹配：区名包含或反包含
    const matched = cityDistricts.some(
      (d) =>
        pkg.district.includes(d.replace(/[区市]$/, "")) ||
        d.includes(pkg.district.replace(/[区市]$/, ""))
    );
    if (!matched) validDistrict = false;
  }
  checks.push({
    field: "district",
    rule: "行政区需在对应城市合法列表内",
    passed: validDistrict,
    actual: pkg.district,
  });

  // 4. 地址非空
  const hasAddress = pkg.roughAddress && pkg.roughAddress.trim().length >= 5;
  checks.push({
    field: "roughAddress",
    rule: "地址至少5个字符",
    passed: hasAddress,
    actual: pkg.roughAddress?.substring(0, 50),
    expected: "非空，≥5字符",
  });

  // 5. 物业类型合法
  const validType = ["OFFICE", "SHOPS", "INDUSTRIAL"].includes(pkg.propertyType);
  checks.push({
    field: "propertyType",
    rule: "OFFICE / SHOPS / INDUSTRIAL",
    passed: validType,
    actual: pkg.propertyType,
  });

  // 6. 租金价格合理
  const priceValue = parseFloat(
    pkg.rawPriceText?.replace(/[^0-9.]/g, "") || "0"
  );
  const [rentMin, rentMax] = FACE_RENT_RANGES[pkg.propertyType];
  const validRent = priceValue >= rentMin && priceValue <= rentMax;
  checks.push({
    field: "rawPriceText",
    rule: `${pkg.propertyType} 面价范围 ${rentMin}-${rentMax}元/㎡/天`,
    passed: validRent || priceValue === 0,
    actual: `${priceValue}元/㎡/天`,
    expected: `${rentMin}-${rentMax}元/㎡/天`,
  });

  // 7. 面积范围
  if (pkg.area !== undefined) {
    const validArea = pkg.area >= AREA_RANGE[0] && pkg.area <= AREA_RANGE[1];
    checks.push({
      field: "area",
      rule: `面积范围 ${AREA_RANGE[0]}-${AREA_RANGE[1].toLocaleString()}㎡`,
      passed: validArea,
      actual: `${pkg.area}㎡`,
    });
  }

  // 8. 免租期范围
  const freeMonths = parseFloat(
    pkg.freeRentMonthsText?.replace(/[^0-9.]/g, "") || "0"
  );
  const validFreeMonths =
    Number.isNaN(freeMonths) ||
    (freeMonths >= FREE_RENT_MONTHS_RANGE[0] &&
      freeMonths <= FREE_RENT_MONTHS_RANGE[1]);
  checks.push({
    field: "freeRentMonths",
    rule: `免租期范围 ${FREE_RENT_MONTHS_RANGE[0]}-${FREE_RENT_MONTHS_RANGE[1]}月`,
    passed: validFreeMonths,
    actual: `${freeMonths}月`,
  });

  // ── 汇总判定 ──────────────────────────────────────
  const allChecked = checks.filter((c) => c.field !== undefined);
  const criticalFields = ["projectName", "city", "propertyType", "roughAddress"];
  const criticalFailures = allChecked.filter(
    (c) => !c.passed && criticalFields.includes(c.field)
  );

  let severity: QualityReport["severity"];
  let summary: string;

  if (criticalFailures.length > 0) {
    severity = "CRITICAL";
    summary = `严重缺陷: ${criticalFailures.map((c) => c.field).join(", ")}`;
  } else {
    const totalFailed = allChecked.filter((c) => !c.passed).length;
    if (totalFailed >= 3) {
      severity = "WARN";
      summary = `${totalFailed} 项未通过`;
    } else if (totalFailed > 0) {
      severity = "WARN";
      summary = `${totalFailed} 项告警`;
    } else {
      severity = "OK";
      summary = "全部通过";
    }
  }

  return {
    passed: criticalFailures.length === 0,
    severity,
    checks,
    summary,
  };
}

// ── 批量校验 ─────────────────────────────────────────

export function validateBatch(
  packages: RawScrapedPackage[]
): {
  total: number;
  passed: number;
  critical: number;
  warn: number;
  reports: QualityReport[];
  validPackages: RawScrapedPackage[];
} {
  const reports = packages.map(validateRawPackage);
  const critical = reports.filter((r) => r.severity === "CRITICAL").length;
  const warn = reports.filter((r) => r.severity === "WARN").length;
  const passed = reports.filter((r) => r.severity === "OK").length;

  return {
    total: packages.length,
    passed,
    critical,
    warn,
    reports,
    validPackages: packages.filter(
      (_, i) => reports[i].passed
    ),
  };
}

// ── ProcessedAsset 管线后校验 ────────────────────────

export function validateProcessedAsset(
  asset: ProcessedAsset
): QualityCheck[] {
  const checks: QualityCheck[] = [];

  // 置信度
  if (asset.confidenceScore < 0.5 && asset.status !== "CRITICAL_MISSING") {
    checks.push({
      field: "confidenceScore",
      rule: "置信度 < 0.5 应标记为 CRITICAL_MISSING",
      passed: false,
      actual: `${asset.confidenceScore.toFixed(2)}`,
    });
  }

  // 净有效租金逻辑
  const neRent = asset.dynamicIndicators.netEffectiveRent;
  if (
    neRent !== null &&
    neRent !== undefined &&
    asset.dynamicIndicators.faceRent !== null &&
    asset.dynamicIndicators.faceRent !== undefined &&
    neRent > asset.dynamicIndicators.faceRent * 365 * 0.95
  ) {
    checks.push({
      field: "netEffectiveRent",
      rule: "净有效租金不应超过面价年化",
      passed: false,
      actual: `${neRent} vs ${asset.dynamicIndicators.faceRent * 365}`,
    });
  }

  // 资本化率范围
  const capRate = asset.dynamicIndicators.capRate;
  if (capRate !== null && capRate !== undefined && (capRate < 0.01 || capRate > 0.20)) {
    checks.push({
      field: "capRate",
      rule: "资本化率应在 1%-20% 之间",
      passed: false,
      actual: `${(capRate * 100).toFixed(1)}%`,
    });
  }

  // LTV 范围
  const ltv = asset.dynamicIndicators.ltvRatio;
  if (ltv !== null && ltv !== undefined && (ltv < 0 || ltv > 0.9)) {
    checks.push({
      field: "ltvRatio",
      rule: "LTV 应在 0-90% 之间",
      passed: false,
      actual: `${(ltv * 100).toFixed(1)}%`,
    });
  }

  return checks;
}

// ── 统计摘要 ─────────────────────────────────────────

export function generateQualitySummary(
  reports: QualityReport[]
): string {
  const total = reports.length;
  const ok = reports.filter((r) => r.severity === "OK").length;
  const warn = reports.filter((r) => r.severity === "WARN").length;
  const critical = reports.filter((r) => r.severity === "CRITICAL").length;

  const failedFields = new Map<string, number>();
  for (const report of reports) {
    for (const check of report.checks) {
      if (!check.passed) {
        failedFields.set(
          check.field,
          (failedFields.get(check.field) || 0) + 1
        );
      }
    }
  }

  const topFailures = Array.from(failedFields.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([field, count]) => `  ${field}: ${count}条`);

  return [
    `数据质量报告`,
    `─────────────────`,
    `总计: ${total} 条`,
    `通过: ${ok} | 告警: ${warn} | 严重: ${critical}`,
    `通过率: ${((ok / total) * 100).toFixed(1)}%`,
    ``,
    `Top 缺陷字段:`,
    ...(topFailures.length > 0 ? topFailures : ["  无"]),
    `─────────────────`,
  ].join("\n");
}
