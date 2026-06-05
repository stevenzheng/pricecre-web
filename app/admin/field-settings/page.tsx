// app/admin/field-settings/page.tsx — Indicator Field Manager
"use client";

import { useState, useEffect } from "react";

interface FieldMeta {
  key: string;
  label: string;
  category: string;
  isActive: boolean;
  isPremium: boolean;
  format: string;
}

const CATEGORIES: Record<string, string> = {
  core: "核心指标",
  valuation: "估值指标",
  lease: "租约质量",
  office: "写字楼效率",
  shops: "商业零售",
  macro: "宏观合规",
  dev: "投前建造",
  ops: "运营效率",
  exit: "投后退出",
  economy: "经济政策",
  social: "舆情社群",
  industrial: "产业园",
  retail: "零售生态",
  migration: "企业迁入",
  brand: "品牌选址",
  culture: "文化艺术",
  service: "物业品牌",
  debt: "资本债务",
  population: "人口统计",
};

export default function FieldSettingsPage() {
  const [fields, setFields] = useState<FieldMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // Load from API — fallback to hardcoded 47 fields
    fetch("/api/admin/field-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.fields?.length) {
          setFields(d.fields);
        } else {
          // Fallback to default 47-field set
          setFields(getDefaultFields());
        }
      })
      .catch(() => setFields(getDefaultFields()))
      .finally(() => setLoading(false));
  }, []);

  const toggleField = (key: string) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, isActive: !f.isActive } : f))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/field-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
    } catch {}
    setSaving(false);
  };

  const filtered = filter === "all"
    ? fields
    : fields.filter((f) => f.isActive === (filter === "active"));

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">字段配置</h1>
        <p className="admin-page-desc">
          47 项精算指标的显示/隐藏控制 · {fields.filter((f) => f.isActive).length} 项启用
        </p>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "active", "inactive"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid",
              borderColor: filter === s ? "#533afd" : "#e2e4ea",
              background: filter === s ? "rgba(83,58,253,0.08)" : "#fff",
              color: filter === s ? "#533afd" : "#64748d",
              fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >
            {s === "all" ? "全部" : s === "active" ? "已启用" : "已隐藏"}
          </button>
        ))}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            marginLeft: "auto", padding: "6px 16px", borderRadius: 6, border: "none",
            background: saving ? "#cbd5e1" : "#533afd", color: "#fff", fontSize: 12, cursor: "pointer",
          }}
        >
          {saving ? "保存中..." : "保存配置"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>加载中...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>指标名称</th>
                <th>分类</th>
                <th>格式</th>
                <th style={{ width: 80 }}>状态</th>
                <th style={{ width: 80 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.key} style={{ opacity: f.isActive ? 1 : 0.5 }}>
                  <td className="str-td-hint">{i + 1}</td>
                  <td style={{ fontWeight: 400 }}>{f.label}</td>
                  <td className="str-td-hint">{CATEGORIES[f.category] || f.category}</td>
                  <td className="str-td-mono">{f.format}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: f.isActive ? "#10b981" : "#ef4444",
                    }}>
                      {f.isActive ? "启用" : "隐藏"}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleField(f.key)}
                      style={{
                        padding: "4px 10px", borderRadius: 5, border: "1px solid",
                        borderColor: f.isActive ? "#ef4444" : "#10b981",
                        background: f.isActive ? "#fef2f2" : "#ecfdf5",
                        color: f.isActive ? "#ef4444" : "#10b981",
                        fontSize: 11, cursor: "pointer",
                      }}
                    >
                      {f.isActive ? "隐藏" : "启用"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function getDefaultFields(): FieldMeta[] {
  return [
    { key: "netEffectiveRent", label: "净有效租金", category: "core", isActive: true, isPremium: true, format: "currency" },
    { key: "capRate", label: "资本化率", category: "valuation", isActive: true, isPremium: true, format: "percent" },
    { key: "priceToRent", label: "售租比", category: "valuation", isActive: true, isPremium: true, format: "ratio" },
    { key: "wale", label: "加权平均租期", category: "lease", isActive: true, isPremium: true, format: "number" },
    { key: "retentionRate", label: "租户留存率", category: "lease", isActive: true, isPremium: true, format: "percent" },
    { key: "tenantConcentration", label: "租户集中度", category: "lease", isActive: true, isPremium: true, format: "percent" },
    { key: "netAbsorption", label: "净吸纳量", category: "office", isActive: true, isPremium: false, format: "number" },
    { key: "reversionRate", label: "续租调升率", category: "office", isActive: true, isPremium: false, format: "percent" },
    { key: "spaceDensity", label: "工位利用率", category: "office", isActive: true, isPremium: false, format: "percent" },
    { key: "salesEfficiency", label: "坪效", category: "shops", isActive: true, isPremium: false, format: "currency" },
    { key: "rentToSales", label: "租金占营业额比", category: "shops", isActive: true, isPremium: false, format: "percent" },
    { key: "footfallTicketSize", label: "客单价", category: "shops", isActive: false, isPremium: false, format: "text" },
    { key: "esgCertification", label: "绿色认证", category: "macro", isActive: true, isPremium: false, format: "text" },
    { key: "landAcquisitionCost", label: "土地获取楼面价", category: "dev", isActive: false, isPremium: true, format: "currency" },
    { key: "capex", label: "单位面积CapEx", category: "dev", isActive: false, isPremium: true, format: "currency" },
    { key: "npiMargin", label: "净物业收入利润率", category: "ops", isActive: true, isPremium: true, format: "percent" },
    { key: "collectionRate", label: "租金收缴率", category: "ops", isActive: true, isPremium: true, format: "percent" },
    { key: "exitCapRate", label: "大宗交易对标单价", category: "exit", isActive: false, isPremium: true, format: "currency" },
    { key: "noiGrowthCagr", label: "3年NOI复合增长率", category: "exit", isActive: true, isPremium: true, format: "percent" },
    { key: "submarketVacancy", label: "商圈空置率", category: "economy", isActive: true, isPremium: false, format: "percent" },
    { key: "policySubsidyLevel", label: "政策扶持级数", category: "economy", isActive: false, isPremium: false, format: "text" },
    { key: "yieldSpread", label: "无风险利率利差", category: "economy", isActive: false, isPremium: true, format: "percent" },
    { key: "kolBuzzIndex", label: "KOL热度指数", category: "social", isActive: true, isPremium: false, format: "number" },
    { key: "negativeSentimentRate", label: "负面声量率", category: "social", isActive: true, isPremium: true, format: "percent" },
    { key: "employeeSatisfaction", label: "员工幸福度", category: "social", isActive: false, isPremium: false, format: "number" },
    { key: "energyOutputRatio", label: "综合电产比", category: "industrial", isActive: false, isPremium: false, format: "ratio" },
    { key: "taxPerMu", label: "亩均税收达成率", category: "industrial", isActive: false, isPremium: false, format: "percent" },
    { key: "heavyLoadRatio", label: "重载车位配比", category: "industrial", isActive: false, isPremium: false, format: "text" },
    { key: "anchorRatio", label: "主力店面积占比", category: "retail", isActive: false, isPremium: false, format: "percent" },
    { key: "churnRate", label: "商户掉铺率", category: "retail", isActive: true, isPremium: false, format: "percent" },
    { key: "netCorporateMigration", label: "企业净迁入率", category: "migration", isActive: true, isPremium: true, format: "percent" },
    { key: "supplyChainDensity", label: "供应链集聚度", category: "migration", isActive: false, isPremium: false, format: "text" },
    { key: "inquiryActivityIndex", label: "选址带看活跃度", category: "migration", isActive: false, isPremium: false, format: "number" },
    { key: "flagshipRatio", label: "首店旗舰占比", category: "brand", isActive: false, isPremium: false, format: "percent" },
    { key: "openCloseRatio", label: "开店闭店比率", category: "brand", isActive: true, isPremium: true, format: "ratio" },
    { key: "cultureRadiance", label: "文化地标辐射级", category: "culture", isActive: false, isPremium: false, format: "number" },
    { key: "eventBurstCoeff", label: "演出客流脉冲系数", category: "culture", isActive: false, isPremium: true, format: "ratio" },
    { key: "culturePremiumScore", label: "文化配套溢价分", category: "culture", isActive: false, isPremium: false, format: "number" },
    { key: "propertyServiceBrand", label: "物业品牌等级", category: "service", isActive: false, isPremium: false, format: "text" },
    { key: "serviceScore", label: "物管服务口碑分", category: "service", isActive: false, isPremium: false, format: "number" },
    { key: "greenMepScore", label: "绿色能耗管理分", category: "service", isActive: false, isPremium: false, format: "number" },
    { key: "ltvRatio", label: "贷款价值比", category: "debt", isActive: false, isPremium: true, format: "percent" },
    { key: "debtYield", label: "债务收益率", category: "debt", isActive: false, isPremium: true, format: "percent" },
    { key: "cashOnCashReturn", label: "现金回报率", category: "debt", isActive: false, isPremium: true, format: "percent" },
    { key: "projectedIrr", label: "5年预测IRR", category: "debt", isActive: true, isPremium: true, format: "percent" },
    { key: "cbdPopulation", label: "3公里商圈人口", category: "population", isActive: false, isPremium: true, format: "number" },
    { key: "demographicFitScore", label: "客群匹配度", category: "population", isActive: false, isPremium: false, format: "number" },
  ];
}
