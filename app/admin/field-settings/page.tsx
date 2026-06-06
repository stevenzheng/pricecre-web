// app/admin/field-settings/page.tsx — Field Settings (3 property-type tabs, categorized, Vercel-style)
"use client";

import { useState, useEffect, useRef } from "react";

interface FieldMeta {
  key: string; label: string; category: string;
  isActive: boolean; isPremium: boolean; format: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
}

const TYPE_LABELS: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };

const TYPE_CATEGORIES: Record<string, Record<string, string>> = {
  OFFICE: {
    core: "核心指标", valuation: "估值指标", lease: "租约质量",
    office: "写字楼效率", ops: "运营效率", exit: "投后退出",
    service: "物业品牌", debt: "资本债务",
    macro: "宏观合规", social: "舆情社群", migration: "企业迁入",
  },
  SHOPS: {
    core: "核心指标", valuation: "估值指标", lease: "租约质量",
    shops: "商业零售", retail: "零售生态", brand: "品牌选址",
    ops: "运营效率", debt: "资本债务",
    macro: "宏观合规", social: "舆情社群", culture: "文化艺术",
  },
  INDUSTRIAL: {
    core: "核心指标", valuation: "估值指标",
    industrial: "产业园", ops: "运营效率", exit: "投后退出",
    service: "物业品牌", debt: "资本债务",
    macro: "宏观合规", migration: "企业迁入",
  },
};

const catIcons: Record<string, string> = {
  "核心指标": "◆", "估值指标": "◈", "租约质量": "◎", "写字楼效率": "◇", "商业零售": "▣",
  "宏观合规": "○", "投前建造": "△", "运营效率": "◉", "投后退出": "▽",
  "经济政策": "◊", "舆情社群": "☆", "产业园": "⬡", "零售生态": "▨",
  "企业迁入": "▷", "品牌选址": "◁", "文化艺术": "♢", "物业品牌": "✧",
  "资本债务": "⬟", "人口统计": "⬢",
};

export default function FieldSettingsPage() {
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"OFFICE" | "SHOPS" | "INDUSTRIAL">("OFFICE");
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/field-settings?type=" + activeType).then(r => r.json()).then(d => {
      if (d.fields?.length) {
        // Map API response: moduleType → propertyType, fieldName → label, fieldKey → key, isDisplayed → isActive
        setFields(d.fields.map((f: any) => ({
          key: f.fieldKey, label: f.fieldName, category: f.category || "core",
          isActive: f.isDisplayed, isPremium: f.isLocked, format: f.fieldType || "text",
          propertyType: f.moduleType || activeType,
        })));
      } else {
        setFields(getDefaultFields(activeType));
      }
    }).catch(() => setFields(getDefaultFields(activeType))).finally(() => setLoading(false));
  }, [activeType]);

  const toggleField = async (key: string, currentActive: boolean) => {
    setFields(prev => prev.map(f => f.key === key ? { ...f, isActive: !f.isActive } : f));
    setSaving(true);
    try {
      const updated = fields.map(f => f.key === key ? { ...f, isActive: !currentActive } : f);
      await fetch("/api/admin/field-settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: updated, moduleType: activeType }),
      });
    } catch { }
    setSaving(false);
  };

  const startEdit = (f: FieldMeta) => { setEditingKey(f.key); setEditValue(f.label); setTimeout(() => inputRef.current?.focus(), 50); };

  const saveEdit = async () => {
    if (!editingKey) return;
    const newLabel = editValue.trim();
    if (!newLabel) { setEditingKey(null); return; }
    setFields(prev => prev.map(f => f.key === editingKey ? { ...f, label: newLabel } : f));
    setEditingKey(null);
    setSaving(true);
    try {
      const updated = fields.map(f => f.key === editingKey ? { ...f, label: newLabel } : f);
      await fetch("/api/admin/field-settings", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: updated, moduleType: activeType }),
      });
    } catch { }
    setSaving(false);
  };

  const typeFields = fields.filter(f => f.propertyType === activeType);
  const activeCount = typeFields.filter(f => f.isActive).length;
  const filtered = filter === "all" ? typeFields : typeFields.filter(f => f.isActive === (filter === "active"));

  const catMap = new Map<string, FieldMeta[]>();
  const cats = TYPE_CATEGORIES[activeType];
  for (const [ck, cn] of Object.entries(cats)) {
    catMap.set(cn, []);
  }
  for (const f of filtered) {
    const cn = cats[f.category as keyof typeof cats] || f.category;
    if (catMap.has(cn)) catMap.get(cn)!.push(f);
  }

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h1 className="vl-page-title">字段配置</h1>
          <p className="vl-page-desc">
            {TYPE_LABELS[activeType]} · {typeFields.length} 项指标 · {activeCount} 项启用
            {saving && <span style={{ color: "#0070F3", marginLeft: 8, fontSize: 12 }}>⏳ 保存中...</span>}
          </p>
        </div>
      </div>

      {/* Property Type Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E5E5E5", marginBottom: 20 }}>
        {(["OFFICE", "SHOPS", "INDUSTRIAL"] as const).map(t => (
          <button key={t} onClick={() => { setActiveType(t); setFilter("all"); }}
            style={{
              padding: "8px 20px", border: "none", borderBottom: `2px solid ${activeType === t ? "#171717" : "transparent"}`,
              borderRadius: 0, background: "transparent",
              fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: activeType === t ? 600 : 500,
              color: activeType === t ? "#171717" : "#737373", letterSpacing: "-0.01em",
              cursor: "pointer", marginBottom: -1, transition: "all 0.12s",
            }}
            onMouseEnter={e => { if (activeType !== t) e.currentTarget.style.color = "#171717"; }}
            onMouseLeave={e => { if (activeType !== t) e.currentTarget.style.color = "#737373"; }}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="vl-action-bar" style={{ marginBottom: 16 }}>
        <div className="vl-filter-tabs" style={{ borderBottom: "none" }}>
          {(["all", "active", "inactive"] as const).map(s => (
            <button key={s} className={`vl-filter-tab${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}
              style={{ borderBottom: filter === s ? "2px solid #171717" : "2px solid transparent", padding: "6px 14px" }}>
              {s === "all" ? "全部" : s === "active" ? "已启用" : "已隐藏"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {Array.from(catMap.entries()).map(([catName, catFields], ci) => {
            if (catFields.length === 0) return null;
            const bgColors = ["#F8FAFC", "#F5F7FA", "transparent"];
            const bg = bgColors[ci % 3];
            return (
              <div key={catName} style={{
                background: bg, borderRadius: 8, padding: "12px 14px",
                border: bg === "transparent" ? "none" : "1px solid rgba(0,0,0,0.04)",
              }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: "#0070F3", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", margin: "0 0 8px" }}>
                  {catIcons[catName] && <span style={{ marginRight: 6, fontSize: 10 }}>{catIcons[catName]}</span>}
                  {catName} · {catFields.filter(f => f.isActive).length}/{catFields.length}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 5 }}>
                  {catFields.map(f => (
                    <div key={f.key} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 6,
                      background: "#FFFFFF", border: "1px solid #E5E5E5",
                      opacity: f.isActive ? 1 : 0.45, transition: "opacity 0.15s",
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingKey === f.key ? (
                          <input ref={inputRef} className="vl-input" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingKey(null); }}
                            onBlur={saveEdit} style={{ padding: "3px 6px", fontSize: 12 }} />
                        ) : (
                          <span onClick={() => startEdit(f)}
                            style={{ fontSize: 12, fontWeight: 600, color: f.isActive ? "#171717" : "#A3A3A3", fontFamily: "var(--font-sans)", cursor: "pointer", borderBottom: "1px dashed transparent", textDecoration: f.isActive ? "none" : "line-through" }}
                            onMouseEnter={e => (e.currentTarget.style.borderBottomColor = "#D4D4D4")}
                            onMouseLeave={e => (e.currentTarget.style.borderBottomColor = "transparent")}>{f.label}</span>
                        )}
                      </div>
                      <button onClick={() => toggleField(f.key, f.isActive)}
                        style={{ flexShrink: 0, width: 36, height: 20, borderRadius: 9999, border: "none", cursor: "pointer", background: f.isActive ? "#171717" : "#D4D4D4", position: "relative", transition: "background 0.15s" }}>
                        <span style={{ position: "absolute", top: "50%", left: f.isActive ? "auto" : 2, right: f.isActive ? 2 : "auto", transform: "translateY(-50%)", width: 16, height: 16, borderRadius: "50%", background: "#FFFFFF", transition: "all 0.15s" }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ===== Per-type default field lists ===== */

function getDefaultFields(type: "OFFICE" | "SHOPS" | "INDUSTRIAL"): FieldMeta[] {
  const officeFields: FieldMeta[] = [
    { key: "netEffectiveRent", label: "净有效租金", category: "core", isActive: true, isPremium: true, format: "currency", propertyType: "OFFICE" },
    { key: "capRate", label: "资本化率", category: "valuation", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "priceToRentRatio", label: "售租比", category: "valuation", isActive: true, isPremium: true, format: "ratio", propertyType: "OFFICE" },
    { key: "wale", label: "加权平均租期", category: "lease", isActive: true, isPremium: true, format: "number", propertyType: "OFFICE" },
    { key: "retentionRate", label: "租户留存率", category: "lease", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "tenantConcentration", label: "租户集中度", category: "lease", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "netAbsorption", label: "净吸纳量", category: "office", isActive: true, isPremium: false, format: "number", propertyType: "OFFICE" },
    { key: "reversionRate", label: "续租调升率", category: "office", isActive: true, isPremium: false, format: "percent", propertyType: "OFFICE" },
    { key: "spaceUtilization", label: "空间利用率", category: "office", isActive: true, isPremium: false, format: "percent", propertyType: "OFFICE" },
    { key: "npiMargin", label: "净物业利润率", category: "ops", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "collectionRate", label: "租金收缴率", category: "ops", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "compTxPrice", label: "大宗交易单价", category: "exit", isActive: false, isPremium: true, format: "currency", propertyType: "OFFICE" },
    { key: "noiCagr3Y", label: "3年NOI增长率", category: "exit", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "projectedIrr5Y", label: "5年预测IRR", category: "exit", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "pmOperatorTier", label: "品牌名称", category: "service", isActive: false, isPremium: false, format: "text", propertyType: "OFFICE" },
    { key: "facilitySlaRating", label: "设施SLA评级", category: "service", isActive: false, isPremium: false, format: "number", propertyType: "OFFICE" },
    { key: "ltvRatio", label: "贷款价值比", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "debtYield", label: "债务收益率", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "cashOnCashReturn", label: "现金回报率", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "landFloorPrice", label: "土地楼面价", category: "valuation", isActive: false, isPremium: true, format: "currency", propertyType: "OFFICE" },
    { key: "capexIntensity", label: "单位CapEx", category: "dev", isActive: false, isPremium: true, format: "currency", propertyType: "OFFICE" },
    { key: "esgCertification", label: "绿色认证", category: "macro", isActive: true, isPremium: false, format: "text", propertyType: "OFFICE" },
    { key: "submarketVacancy", label: "商圈空置率", category: "macro", isActive: true, isPremium: false, format: "percent", propertyType: "OFFICE" },
    { key: "policyIncentiveLevel", label: "政策扶持级数", category: "macro", isActive: false, isPremium: false, format: "number", propertyType: "OFFICE" },
    { key: "yieldSpread", label: "收益利差", category: "macro", isActive: false, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "kolBuzzIndex", label: "KOL热度指数", category: "social", isActive: true, isPremium: false, format: "number", propertyType: "OFFICE" },
    { key: "negativeSentimentRate", label: "负面声量率", category: "social", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "netCorporateMigration", label: "企业净迁入率", category: "migration", isActive: true, isPremium: true, format: "percent", propertyType: "OFFICE" },
    { key: "hqSupplyChainRatio", label: "总部集聚度", category: "migration", isActive: false, isPremium: false, format: "percent", propertyType: "OFFICE" },
  ];

  const shopsFields: FieldMeta[] = [
    { key: "netEffectiveRent", label: "净有效租金", category: "core", isActive: true, isPremium: true, format: "currency", propertyType: "SHOPS" },
    { key: "capRate", label: "资本化率", category: "valuation", isActive: true, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "priceToRentRatio", label: "售租比", category: "valuation", isActive: true, isPremium: true, format: "ratio", propertyType: "SHOPS" },
    { key: "wale", label: "加权平均租期", category: "lease", isActive: true, isPremium: true, format: "number", propertyType: "SHOPS" },
    { key: "retentionRate", label: "租户留存率", category: "lease", isActive: true, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "salesEfficiency", label: "坪效", category: "shops", isActive: true, isPremium: false, format: "currency", propertyType: "SHOPS" },
    { key: "rentToSalesRatio", label: "租售比", category: "shops", isActive: true, isPremium: false, format: "percent", propertyType: "SHOPS" },
    { key: "footfallTicketSize", label: "客单价", category: "shops", isActive: false, isPremium: false, format: "text", propertyType: "SHOPS" },
    { key: "anchorDependency", label: "主力店占比", category: "shops", isActive: false, isPremium: false, format: "percent", propertyType: "SHOPS" },
    { key: "merchantChurnRate", label: "商户掉铺率", category: "shops", isActive: true, isPremium: false, format: "percent", propertyType: "SHOPS" },
    { key: "firstStoreRatio", label: "首店占比", category: "brand", isActive: false, isPremium: false, format: "percent", propertyType: "SHOPS" },
    { key: "openToCloseRatio", label: "开闭店比", category: "brand", isActive: true, isPremium: true, format: "ratio", propertyType: "SHOPS" },
    { key: "tradeAreaPopulation", label: "商圈人口", category: "retail", isActive: false, isPremium: true, format: "number", propertyType: "SHOPS" },
    { key: "demographicPremiumScore", label: "人口红利分", category: "retail", isActive: false, isPremium: false, format: "number", propertyType: "SHOPS" },
    { key: "culturalRadianceLevel", label: "文化辐射级", category: "culture", isActive: false, isPremium: false, format: "number", propertyType: "SHOPS" },
    { key: "footfallPulseRate", label: "客流脉冲系数", category: "culture", isActive: false, isPremium: true, format: "ratio", propertyType: "SHOPS" },
    { key: "npiMargin", label: "净物业利润率", category: "ops", isActive: true, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "collectionRate", label: "租金收缴率", category: "ops", isActive: true, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "ltvRatio", label: "贷款价值比", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "debtYield", label: "债务收益率", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "cashOnCashReturn", label: "现金回报率", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "SHOPS" },
    { key: "esgCertification", label: "绿色认证", category: "macro", isActive: true, isPremium: false, format: "text", propertyType: "SHOPS" },
    { key: "submarketVacancy", label: "商圈空置率", category: "macro", isActive: true, isPremium: false, format: "percent", propertyType: "SHOPS" },
    { key: "kolBuzzIndex", label: "KOL热度指数", category: "social", isActive: true, isPremium: false, format: "number", propertyType: "SHOPS" },
    { key: "negativeSentimentRate", label: "负面声量率", category: "social", isActive: true, isPremium: true, format: "percent", propertyType: "SHOPS" },
  ];

  const industrialFields: FieldMeta[] = [
    { key: "netEffectiveRent", label: "净有效租金", category: "core", isActive: true, isPremium: true, format: "currency", propertyType: "INDUSTRIAL" },
    { key: "capRate", label: "资本化率", category: "valuation", isActive: true, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "priceToRentRatio", label: "售租比", category: "valuation", isActive: true, isPremium: true, format: "ratio", propertyType: "INDUSTRIAL" },
    { key: "electricityOutputRatio", label: "综合电产比", category: "industrial", isActive: false, isPremium: false, format: "ratio", propertyType: "INDUSTRIAL" },
    { key: "taxCovenantRate", label: "亩均税收", category: "industrial", isActive: false, isPremium: false, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "npiMargin", label: "净物业利润率", category: "ops", isActive: true, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "collectionRate", label: "租金收缴率", category: "ops", isActive: true, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "compTxPrice", label: "大宗交易单价", category: "exit", isActive: false, isPremium: true, format: "currency", propertyType: "INDUSTRIAL" },
    { key: "noiCagr3Y", label: "3年NOI增长率", category: "exit", isActive: true, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "projectedIrr5Y", label: "5年预测IRR", category: "exit", isActive: true, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "pmOperatorTier", label: "品牌名称", category: "service", isActive: false, isPremium: false, format: "text", propertyType: "INDUSTRIAL" },
    { key: "facilitySlaRating", label: "设施SLA评级", category: "service", isActive: false, isPremium: false, format: "number", propertyType: "INDUSTRIAL" },
    { key: "ltvRatio", label: "贷款价值比", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "debtYield", label: "债务收益率", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "cashOnCashReturn", label: "现金回报率", category: "debt", isActive: false, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "esgCertification", label: "绿色认证", category: "macro", isActive: true, isPremium: false, format: "text", propertyType: "INDUSTRIAL" },
    { key: "submarketVacancy", label: "商圈空置率", category: "macro", isActive: true, isPremium: false, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "policyIncentiveLevel", label: "政策扶持级数", category: "macro", isActive: false, isPremium: false, format: "number", propertyType: "INDUSTRIAL" },
    { key: "netCorporateMigration", label: "企业净迁入率", category: "migration", isActive: true, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "hqSupplyChainRatio", label: "总部集聚度", category: "migration", isActive: false, isPremium: false, format: "percent", propertyType: "INDUSTRIAL" },
    { key: "landFloorPrice", label: "土地楼面价", category: "valuation", isActive: false, isPremium: true, format: "currency", propertyType: "INDUSTRIAL" },
    { key: "yieldSpread", label: "收益利差", category: "macro", isActive: false, isPremium: true, format: "percent", propertyType: "INDUSTRIAL" },
  ];

  if (type === "OFFICE") return officeFields;
  if (type === "SHOPS") return shopsFields;
  return industrialFields;
}
