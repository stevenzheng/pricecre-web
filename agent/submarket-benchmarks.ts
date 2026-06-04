// agent/submarket-benchmarks.ts
// 子市场基准数据 — 上海核心商圈（与 DATA_DICTIONARY 对齐）
import { SubmarketBenchmark } from "./schemas";

const BENCHMARKS: SubmarketBenchmark[] = [
  { city: "shanghai", district: "lujiazui",  propertyType: "OFFICE",    benchmarkAssetPrice: 95000, benchmarkCapRate: 0.040, opexRatio: 0.32, lastUpdated: "2026-01-01" },
  { city: "shanghai", district: "qiantan",   propertyType: "SHOPS",     benchmarkAssetPrice: 72000, benchmarkCapRate: 0.045, opexRatio: 0.42, lastUpdated: "2026-01-01" },
  { city: "shanghai", district: "zhangjiang",propertyType: "OFFICE",    benchmarkAssetPrice: 38000, benchmarkCapRate: 0.055, opexRatio: 0.28, lastUpdated: "2026-01-01" },
  { city: "shanghai", district: "zhangjiang",propertyType: "INDUSTRIAL",benchmarkAssetPrice: 22000, benchmarkCapRate: 0.065, opexRatio: 0.18, lastUpdated: "2026-01-01" },
  { city: "shanghai", district: "jing_an",   propertyType: "OFFICE",    benchmarkAssetPrice: 68000, benchmarkCapRate: 0.043, opexRatio: 0.30, lastUpdated: "2026-01-01" },
  { city: "_default", district: "_default",  propertyType: "OFFICE",    benchmarkAssetPrice: 40000, benchmarkCapRate: 0.050, opexRatio: 0.30, lastUpdated: "2026-01-01" },
  { city: "_default", district: "_default",  propertyType: "SHOPS",     benchmarkAssetPrice: 35000, benchmarkCapRate: 0.052, opexRatio: 0.42, lastUpdated: "2026-01-01" },
  { city: "_default", district: "_default",  propertyType: "INDUSTRIAL",benchmarkAssetPrice: 18000, benchmarkCapRate: 0.065, opexRatio: 0.18, lastUpdated: "2026-01-01" },
];

export function getBenchmark(
  city: string,
  district: string,
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL"
): { benchmark: SubmarketBenchmark; isDefault: boolean } {
  const c = city.toLowerCase().trim();
  const d = district.toLowerCase().trim();

  const exact = BENCHMARKS.find((b) => b.city === c && b.district === d && b.propertyType === propertyType);
  if (exact) return { benchmark: exact, isDefault: false };

  const cityLevel = BENCHMARKS.find((b) => b.city === c && b.district === "_default" && b.propertyType === propertyType);
  if (cityLevel) return { benchmark: cityLevel, isDefault: true };

  const fallback = BENCHMARKS.find((b) => b.city === "_default" && b.propertyType === propertyType)!;
  return { benchmark: fallback, isDefault: true };
}
