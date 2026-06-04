"use client";
import { showModal } from "@/components/Toast";
import { indicatorExplanations } from "@/lib/indicator-explanations";

import { useReducer, useMemo, useCallback } from "react";
import {
  CommercialProperty,
  DynamicIndicators,
  PropertyType,
} from "@/types/indicators";
import { propertyTypeLabels } from "@/lib/mock-data";

/* ===== State Machine ===== */

type CardState = {
  isExpanded: boolean;
  isUnlocking: boolean;
  hasUnlocked: boolean;
};

type CardAction =
  | { type: "TOGGLE_EXPAND" }
  | { type: "START_UNLOCK" }
  | { type: "UNLOCK_SUCCESS" }
  | { type: "UNLOCK_FAIL" };

function cardReducer(state: CardState, action: CardAction): CardState {
  switch (action.type) {
    case "TOGGLE_EXPAND":
      return { ...state, isExpanded: !state.isExpanded };
    case "START_UNLOCK":
      return { ...state, isUnlocking: true };
    case "UNLOCK_SUCCESS":
      return { ...state, isUnlocking: false, hasUnlocked: true };
    case "UNLOCK_FAIL":
      return { ...state, isUnlocking: false };
    default:
      return state;
  }
}

/* ===== Indicator Field Builder ===== */

interface IndicatorField {
  key: string;
  abbr: string;
  label: string;
  value: number | string | undefined;
  format: "currency" | "percent" | "number" | "text" | "ratio";
  isLocked: boolean;
  isPositive?: boolean;
}

type FieldDef = Pick<IndicatorField, "key" | "abbr" | "label" | "format" | "isLocked" | "isPositive">;

function getIndicatorFields(
  indicators: DynamicIndicators,
  propertyType: PropertyType
): IndicatorField[] {
  /* ===== Sector-specific field lists ===== */

  const officeFields: FieldDef[] = [
    { key: "netAbsorption", abbr: "ABS", label: "净吸纳量", format: "number", isLocked: true },
    { key: "reversionRate", abbr: "REV", label: "续租调升率", format: "percent", isLocked: true },
    { key: "spaceUtilization", abbr: "SU", label: "空间利用", format: "percent", isLocked: true },
  ];

  const shopFields: FieldDef[] = [
    { key: "salesEfficiency", abbr: "PXF", label: "坪效", format: "currency", isLocked: true },
    { key: "rentToSalesRatio", abbr: "RSR", label: "租售比", format: "percent", isLocked: true },
    { key: "footfallTicketSize", abbr: "FTS", label: "客单价", format: "text", isLocked: true },
    { key: "anchorDependency", abbr: "ANC", label: "主力店占比", format: "percent", isLocked: true },
    { key: "merchantChurnRate", abbr: "MCR", label: "掉铺率", format: "percent", isLocked: true, isPositive: false },
    { key: "firstStoreRatio", abbr: "FSR", label: "首店占比", format: "percent", isLocked: true },
    { key: "openToCloseRatio", abbr: "OCR", label: "开闭店比", format: "ratio", isLocked: true },
    { key: "tradeAreaPopulation", abbr: "TAP", label: "商圈人口", format: "number", isLocked: true },
    { key: "demographicPremiumScore", abbr: "DPS", label: "人口红利", format: "number", isLocked: true },
  ];

  const industrialFields: FieldDef[] = [
    { key: "electricityOutputRatio", abbr: "EOR", label: "电产比", format: "percent", isLocked: true },
    { key: "taxCovenantRate", abbr: "TCR", label: "亩均税收", format: "percent", isLocked: true },
    { key: "loadingDockRatio", abbr: "LDR", label: "车位配比", format: "ratio", isLocked: true },
  ];

  /* ===== Universal fields (all sectors, in exact PRD order) ===== */

  const universalFields: FieldDef[] = [
    { key: "capRate", abbr: "CAP", label: "资本化率", format: "percent", isLocked: true },
    { key: "priceToRentRatio", abbr: "PTR", label: "售租比", format: "ratio", isLocked: true },
    { key: "wale", abbr: "WALE", label: "平均租期", format: "number", isLocked: true },
    { key: "retentionRate", abbr: "RET", label: "租户留存率", format: "percent", isLocked: true },
    { key: "tenantConcentration", abbr: "TC", label: "租户集中度", format: "percent", isLocked: true },
    { key: "esgCertification", abbr: "ESG", label: "绿色认证", format: "text", isLocked: true },
    { key: "landFloorPrice", abbr: "LFP", label: "土地楼面价", format: "currency", isLocked: true },
    { key: "capexIntensity", abbr: "CAPEX", label: "单位投入", format: "currency", isLocked: true },
    { key: "npiMargin", abbr: "NPI", label: "利润率", format: "percent", isLocked: true },
    { key: "collectionRate", abbr: "COL", label: "收缴率", format: "percent", isLocked: true },
    { key: "compTxPrice", abbr: "CTX", label: "大宗单价", format: "currency", isLocked: true },
    { key: "noiCagr3Y", abbr: "NOI增速", label: "净收入增速", format: "percent", isLocked: true },
    { key: "submarketVacancy", abbr: "VAC", label: "商圈空置", format: "percent", isLocked: true, isPositive: false },
    { key: "policyIncentiveLevel", abbr: "POL", label: "政策级数", format: "number", isLocked: true },
    { key: "yieldSpread", abbr: "YLD", label: "收益利差", format: "percent", isLocked: true },
    { key: "kolBuzzIndex", abbr: "KOL", label: "热度指数", format: "number", isLocked: true },
    { key: "negativeSentimentRate", abbr: "NSR", label: "负面声量", format: "percent", isLocked: true, isPositive: false },
    { key: "employeeHappinessScore", abbr: "EHS", label: "幸福评分", format: "number", isLocked: true },
    { key: "netCorporateMigration", abbr: "NCM", label: "企业迁入", format: "percent", isLocked: true },
    { key: "hqSupplyChainRatio", abbr: "HQSC", label: "总部集聚", format: "percent", isLocked: true },
    { key: "corporateInquiryIndex", abbr: "CII", label: "选址活跃", format: "number", isLocked: true },
    { key: "culturalRadianceLevel", abbr: "CRL", label: "文化辐射", format: "number", isLocked: true },
  ];

  /* ===== Investment leverage fields ===== */

  const leverageFields: FieldDef[] = [
    { key: "ltvRatio", abbr: "LTV", label: "贷款价值比", format: "percent", isLocked: true },
    { key: "debtYield", abbr: "DEBT", label: "债务收益率", format: "percent", isLocked: true },
    { key: "cashOnCashReturn", abbr: "COC", label: "现金回报率", format: "percent", isLocked: true },
    { key: "projectedIrr5Y", abbr: "5年预测IRR", label: "5年预测IRR", format: "percent", isLocked: true },
  ];

  /* ===== Assemble based on property type ===== */

  let fieldDefs: FieldDef[] = [...universalFields];

  if (propertyType === PropertyType.OFFICE) {
    fieldDefs = [...universalFields, ...officeFields, ...leverageFields];
  } else if (propertyType === PropertyType.SHOPS) {
    fieldDefs = [...universalFields, ...shopFields];
  } else if (propertyType === PropertyType.INDUSTRIAL) {
    fieldDefs = [...universalFields, ...industrialFields, ...leverageFields];
  }

  return fieldDefs
    .filter((def) => {
      const val = indicators[def.key as keyof DynamicIndicators];
      return val !== undefined && val !== null;
    })
    .map((def) => ({
      ...def,
      value: indicators[def.key as keyof DynamicIndicators] as string | number | undefined,
    }));
}

/* ===== Formatter ===== */

function formatValue(value: number | string | undefined, format: IndicatorField["format"]): string {
  if (value === undefined) return "—";
  if (typeof value === "string") return value;
  switch (format) {
    case "currency":
      return "¥" + new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "number":
      return value >= 10000 ? `${(value / 10000).toFixed(1)}万` : value.toLocaleString("zh-CN");
    case "ratio":
      return `${value.toFixed(1)}x`;
    case "text":
      return String(value);
    default:
      return String(value);
  }
}

/* ===== Unified SVG Icons ===== */

const IconBuilding = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2" />
  </svg>
);

const IconStore = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9" />
    <path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const IconFactory = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12" />
    <path d="M9 18h2M13 18h2M9 14h2M13 14h2" />
  </svg>
);

const propertyTypeIconMap: Record<PropertyType, React.ReactNode> = {
  [PropertyType.OFFICE]: <IconBuilding />,
  [PropertyType.SHOPS]: <IconStore />,
  [PropertyType.INDUSTRIAL]: <IconFactory />,
};

/* ===== Main Component ===== */

export default function PropertyCard({
  property,
  remainingCredits,
  onUnlock,
  autoExpand = false,
}: {
  property: CommercialProperty;
  remainingCredits: number;
  onUnlock?: (propertyId: string) => void;
  autoExpand?: boolean;
}) {
  const [state, dispatch] = useReducer(cardReducer, {
    isExpanded: autoExpand,
    isUnlocking: false,
    hasUnlocked: false,
  });

  const isUnlocked = property.isUnlocked || state.hasUnlocked;

  const indicatorFields = useMemo(
    () => getIndicatorFields(property.dynamicIndicators, property.propertyType),
    [property.dynamicIndicators, property.propertyType]
  );

  const sortedFields = useMemo(
    () =>
      [...indicatorFields].sort((a, b) => {
        if (a.key === "capRate") return -1;
        if (b.key === "capRate") return 1;
        if (a.key === "npiMargin") return -1;
        if (b.key === "npiMargin") return 1;
        return a.label.localeCompare(b.label);
      }),
    [indicatorFields]
  );

  const handleUnlock = useCallback(() => {
    if (isUnlocked || state.isUnlocking || remainingCredits <= 0) return;
    dispatch({ type: "START_UNLOCK" });
    if (onUnlock) onUnlock(property.id);
    // Shorter delay — the real API handles data, UI shows spinner briefly
    setTimeout(() => dispatch({ type: "UNLOCK_SUCCESS" }), 400);
  }, [isUnlocked, state.isUnlocking, remainingCredits, onUnlock, property.id]);

  const netEffectiveRent = isUnlocked ? property.dynamicIndicators.netEffectiveRent : null;
  const typeLabel = propertyTypeLabels[property.propertyType];
  const typeIcon = propertyTypeIconMap[property.propertyType];

  return (
    <div id={`property-${property.id}`} className={`card overflow-hidden ${state.isExpanded ? "ring-1" : ""}`} style={{ borderColor: state.isExpanded ? "var(--accent-border)" : "var(--line)" }}>
      {/* ---- Collapsed Header ---- */}
      <div
        className="p-3 sm:p-4 cursor-pointer select-none"
        onClick={() => dispatch({ type: "TOGGLE_EXPAND" })}
      >
        {/* Top Row: Type Badge (left) + Mini Indicators (right) */}
        <div className="flex items-start justify-between gap-1.5 mb-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider flex-shrink-0" style={{ color: "var(--text-muted)" }}>
            <span style={{ color: "var(--accent)" }}>{typeIcon}</span>
            {typeLabel}
          </span>

          {/* Quick-glance volatile indicators */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {property.dynamicIndicators.submarketVacancy != null && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{
                background: "var(--negative-soft)",
                color: "var(--negative)",
              }}>
                空置 {property.dynamicIndicators.submarketVacancy}%
              </span>
            )}
            {property.dynamicIndicators.netCorporateMigration != null && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{
                background: (property.dynamicIndicators.netCorporateMigration ?? 0) > 0 ? "var(--positive-soft)" : "var(--negative-soft)",
                color: (property.dynamicIndicators.netCorporateMigration ?? 0) > 0 ? "var(--positive)" : "var(--negative)",
              }}>
                迁入 {property.dynamicIndicators.netCorporateMigration > 0 ? "+" : ""}{property.dynamicIndicators.netCorporateMigration}%
              </span>
            )}
            {property.dynamicIndicators.kolBuzzIndex != null && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded" style={{
                background: "var(--accent-soft)",
                color: "var(--accent)",
              }}>
                热度 {property.dynamicIndicators.kolBuzzIndex}
              </span>
            )}
          </div>
        </div>

        {/* Project Name */}
        <h3 className="text-[15px] font-medium mb-0.5" style={{ color: "var(--text-strong)" }}>
          {property.projectName}
        </h3>

        {/* Location + Insight */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {property.city} · {property.district}
          </p>
          <div className="text-right text-[11px] leading-snug hidden sm:block" style={{ color: "var(--text-hint)" }}>
            {(property.dynamicIndicators.kolBuzzIndex ?? 0) > 80 ? "🔥 高热度商圈" : 
             (property.dynamicIndicators.submarketVacancy ?? 100) < 8 ? "📉 低空置率" :
             (property.dynamicIndicators.netCorporateMigration ?? 0) > 20 ? "📈 企业净迁入" : "数据持续更新中"}
          </div>
        </div>

        {/* Face Rent + Status */}
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider mb-0.5 font-medium" style={{ color: "var(--text-hint)" }}>
              挂牌租金面价
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>
                <span className="text-base font-normal">¥</span>{property.faceRent.toFixed(1)}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>/㎡/天</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked ? (
              <span className="badge badge-positive gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                已解锁
              </span>
            ) : (
              <span className="badge badge-locked gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-hint)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1" fill="var(--text-hint)"/></svg>
                需解锁
              </span>
            )}
            {/* Share button in collapsed state */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const evt = new CustomEvent("open-wechat-card", {
                  detail: {
                    projectName: property.projectName,
                    city: property.city,
                    district: property.district,
                    faceRent: property.faceRent,
                    propertyType: typeLabel,
                    indicators: sortedFields
                      .filter(f => !f.isLocked || isUnlocked)
                      .slice(0, 9)
                      .map(f => ({ label: f.label, value: isUnlocked ? formatValue(f.value, f.format) : "****" })),
                  },
                });
                document.dispatchEvent(evt);
              }}
              className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
              aria-label="生成微信分享卡片"
              title="微信分享"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
            <div style={{ color: "var(--text-hint)" }}>
              {state.isExpanded ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 10l4-4 4 4" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M4 6l4 4 4-4" /></svg>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---- Expanded Detail ---- */}
      {state.isExpanded && (
        <div className="border-t animate-slide-up" style={{ borderColor: "var(--line)" }}>
          {/* Net Effective Rent + Actions Row */}
          <div className="p-4 sm:p-5" style={{ background: "var(--panel)" }}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                    净有效租金
                  </span>
                  {!isUnlocked && (
                    <span className="badge badge-locked text-[11px]">
                      额度解锁
                    </span>
                  )}
                </div>
                {netEffectiveRent !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-medium" style={{ color: "var(--positive)", fontFamily: "var(--font-mono)" }}>
                      ¥{netEffectiveRent.toFixed(1)}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>/㎡/天</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-medium" style={{ color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>**.**</span>
                    <span className="text-xs" style={{ color: "var(--text-hint)" }}>解锁查看更多价值数据</span>
                  </div>
                )}
              </div>

              {/* Right: AI Analysis + Share (moved up from bottom) */}
              <div className="flex items-center gap-2">
                {/* AI Analysis Button (unlocked only) — Gemini sparkle icon */}
                {isUnlocked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const aiEvent = new CustomEvent("open-ai-analysis", {
                        detail: {
                          projectName: property.projectName,
                          city: property.city,
                          district: property.district,
                          propertyType: typeLabel,
                          faceRent: property.faceRent,
                          netEffectiveRent: netEffectiveRent,
                          indicators: sortedFields.map(f => ({
                            label: f.label,
                            value: formatValue(f.value, f.format),
                            key: f.key,
                          })),
                        },
                      });
                      document.dispatchEvent(aiEvent);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: "var(--accent)",
                      color: "var(--text-inverse)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l1.5 5.5L19 4l-3.5 4.5L22 12l-6.5 1.5L19 20l-5.5-4L12 22l-1.5-6L4 20l4-7L2 12l6-2.5L4 4l6.5 4.5L12 2z"/>
                    </svg>
                    AI 分析
                  </button>
                )}

                {/* Share Button (always visible, 2x icon) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const evt = new CustomEvent("open-wechat-card", {
                      detail: {
                        projectName: property.projectName,
                        city: property.city,
                        district: property.district,
                        faceRent: property.faceRent,
                        propertyType: typeLabel,
                        indicators: sortedFields
                          .filter(f => !f.isLocked || isUnlocked)
                          .slice(0, 9)
                          .map(f => ({ label: f.label, value: isUnlocked ? formatValue(f.value, f.format) : "****" })),
                      },
                    });
                    document.dispatchEvent(evt);
                  }}
                  className="p-2 rounded-lg transition-all duration-200 hover:bg-[var(--accent-soft)] hover:scale-110"
                  aria-label="生成微信分享卡片"
                  title="生成微信分享卡片"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                </button>

                {/* Unlock button when locked */}
                {!isUnlocked && (
                  <button
                    className="btn-primary text-sm"
                    onClick={(e) => { e.stopPropagation(); handleUnlock(); }}
                    disabled={state.isUnlocking || remainingCredits <= 0}
                  >
                    {state.isUnlocking ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        解锁中...
                      </>
                    ) : (
                      <>{remainingCredits > 0 ? "解锁" : "额度已用完"}</>
                    )}
                  </button>
                )}
              </div>
            </div>
            {remainingCredits <= 0 && !isUnlocked && (
              <p className="text-xs mt-2" style={{ color: "var(--text-hint)" }}>分享邀请链接给好友，双方各得额度</p>
            )}
          </div>

          {/* Indicators Grid */}
          <div className="p-4 sm:p-5">
            <div className="section-title">
              附属精算指标
              {!isUnlocked && (
                <span className="font-normal ml-2 text-[11px]" style={{ color: "var(--text-hint)" }}>解锁后查看</span>
              )}
            </div>
            {/* Mobile: 3 cols, Desktop: 4 cols */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
              {sortedFields.map((field) => {
                const isFieldLocked = field.isLocked && !isUnlocked;
                const displayValue = isFieldLocked ? null : formatValue(field.value, field.format);
                const isNegative = field.isPositive === false && typeof field.value === "number";
                const isPositive = field.isPositive !== false && typeof field.value === "number" && field.value > 0;

                return (
                  <div
                    key={field.key}
                    className={`metric-cell ${isFieldLocked ? "locked cursor-pointer hover:bg-[var(--accent-soft)]" : isUnlocked ? "unlocked" : ""}`}
                    style={{
                      ...(isFieldLocked ? { transition: "background 0.15s" } : {}),
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 52,
                    }}
                    onClick={() => {
                      if (isFieldLocked && !isUnlocked) {
                        if (remainingCredits <= 0) {
                          showModal("额度不足，请通过邀约分享或购买获取更多额度");
                        } else {
                          handleUnlock();
                        }
                      }
                    }}
                  >
                    {/* Chinese Label */}
                    <span
                      className="text-[11px] font-medium cursor-help hover:underline decoration-dotted"
                      style={{ color: isFieldLocked ? "var(--text-muted)" : "var(--text-muted)", lineHeight: 1.3 }}
                      onMouseEnter={(e) => {
                        const target = e.currentTarget;
                        const expl = indicatorExplanations[field.key];
                        if (expl) {
                          const cleanExpl = expl.includes(" — ") ? expl.split(" — ").slice(1).join(" — ") : expl;
                          const tip = document.createElement("div");
                          tip.className = "indicator-tooltip";
                          tip.textContent = cleanExpl;
                          tip.style.cssText = "position:fixed;z-index:9999;max-width:280px;padding:10px 14px;background:var(--bg-surface);color:var(--text);border:1px solid var(--line);border-radius:10px;font-size:11px;line-height:1.5;box-shadow:0 4px 20px rgba(0,0,0,0.15);pointer-events:none;";
                          document.body.appendChild(tip);
                          const rect = target.getBoundingClientRect();
                          tip.style.left = Math.min(rect.left, window.innerWidth - 290) + "px";
                          tip.style.top = (rect.bottom + 6) + "px";
                          (target as any)._tooltip = tip;
                        }
                      }}
                      onMouseLeave={(e) => {
                        const t = (e.currentTarget as any)._tooltip;
                        if (t) { t.remove(); (e.currentTarget as any)._tooltip = null; }
                      }}
                    >
                      {field.label}
                    </span>

                    {/* Value or Lock */}
                    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "flex-end", flex: 1, paddingTop: 4 }}>
                      {isFieldLocked ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-hint)", flexShrink: 0, opacity: 0.5 }}>
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      ) : (
                        <span
                          style={{
                            fontSize: field.format === "text" ? "10px" : "13px",
                            fontWeight: field.format === "text" ? 400 : 500,
                            color: isNegative ? "var(--negative)" : isPositive ? "var(--positive)" : "var(--text)",
                            fontFamily: field.format === "text" ? "var(--font-sans)" : "var(--font-mono)",
                            lineHeight: 1,
                          }}
                        >
                          {displayValue}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
