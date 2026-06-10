// app/admin/data-review/[id]/page.tsx — Property Detail Editor
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type IndicatorMap = Record<string, any>;

const SECTIONS: { key: string; label: string; fields: { key: string; label: string; unit?: string; format?: string; category?: string }[] }[] = [
  { key: "rent", label: "租金与回报", fields: [
    { key: "faceRent", label: "挂牌面价", unit: "元/㎡/天", format: "decimal" },
    { key: "netEffectiveRent", label: "净有效租金", unit: "元/㎡/天", format: "decimal" },
    { key: "capRate", label: "资本化率", unit: "%", format: "percent" },
    { key: "priceToRentRatio", label: "售租比", format: "decimal" },
    { key: "yieldOnCost", label: "成本收益率", unit: "%", format: "percent" },
    { key: "irr5Y", label: "5年IRR", unit: "%", format: "percent" },
    { key: "npvPerSqm", label: "单位面积NPV", unit: "元/㎡", format: "int" },
  ]},
  { key: "lease", label: "租赁结构", fields: [
    { key: "wale", label: "加权平均租期", unit: "年", format: "decimal" },
    { key: "retentionRate", label: "续租率", unit: "%", format: "percent" },
    { key: "tenantConcentration", label: "租户集中度", unit: "%", format: "percent" },
    { key: "vacancyRate", label: "空置率", unit: "%", format: "percent" },
    { key: "freeRentMonths", label: "免租期", unit: "月", format: "int" },
    { key: "leaseEscalation", label: "租金年递增", unit: "%", format: "percent" },
  ]},
  { key: "financial", label: "财务指标", fields: [
    { key: "area", label: "面积", unit: "㎡", format: "int" },
    { key: "annualRevenuePerSqm", label: "年收入/㎡", unit: "元", format: "int" },
    { key: "opexRatio", label: "运营费用率", unit: "%", format: "percent" },
    { key: "noiCagr3Y", label: "NOI 3年复合增长", unit: "%", format: "percent" },
    { key: "ltv", label: "LTV", unit: "%", format: "percent" },
    { key: "debtServiceCoverageRatio", label: "偿债覆盖率", format: "decimal" },
    { key: "loanToValue", label: "贷款估值比", unit: "%", format: "percent" },
  ]},
  { key: "market", label: "市场与地理", fields: [
    { key: "submarketRentAvg", label: "商圈均价", unit: "元/㎡/天", format: "decimal" },
    { key: "submarketVacancyAvg", label: "商圈空置率", unit: "%", format: "percent" },
    { key: "macroSubmarketVacancy", label: "宏观空置率", unit: "%", format: "percent" },
    { key: "cityAvgRent", label: "城市均价", unit: "元/㎡/天", format: "decimal" },
    { key: "rentPremiumVsSubmarket", label: "商圈溢价", unit: "%", format: "percent" },
    { key: "geoScore", label: "区位评分", format: "int" },
    { key: "transitScore", label: "交通评分", format: "int" },
  ]},
  { key: "quality", label: "资产质量", fields: [
    { key: "buildingGrade", label: "建筑等级", format: "text" },
    { key: "yearBuilt", label: "建成年份", format: "int" },
    { key: "floorPlate", label: "标准层面积", unit: "㎡", format: "int" },
    { key: "ceilingHeight", label: "层高", unit: "m", format: "decimal" },
    { key: "greenCertification", label: "绿色认证", format: "text" },
    { key: "parkingRatio", label: "车位配比", format: "decimal" },
    { key: "propertyMgmt", label: "物业管理", format: "text" },
  ]},
];

function formatValue(v: any, fmt: string): string {
  if (v === undefined || v === null || v === "") return "";
  const n = Number(v);
  if (isNaN(n)) return String(v);
  switch (fmt) {
    case "percent": return (n * 100).toFixed(1);
    case "decimal": return n.toFixed(2);
    case "int": return Math.round(n).toString();
    default: return String(v);
  }
}

function parseValue(s: string, fmt: string): number | string {
  if (s === "") return s;
  if (fmt === "text") return s;
  const n = parseFloat(s);
  if (isNaN(n)) return s;
  if (fmt === "percent") return n / 100;
  return n;
}

export default function PropertyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [indicators, setIndicators] = useState<IndicatorMap>({});
  const [meta, setMeta] = useState({ projectName: "", city: "", district: "", propertyType: "OFFICE", faceRent: 0, dataSource: "", confidenceScore: 0 });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Fetch from mock API
    fetch("/api/admin/mock-properties").then(r => r.json()).then(data => {
      const p = (data.properties || []).find((x: any) => x.id === id);
      if (p) {
        setMeta({
          projectName: p.projectName || "",
          city: p.city || "",
          district: p.district || "",
          propertyType: p.propertyType || "OFFICE",
          faceRent: Number(p.faceRent) || 0,
          dataSource: p.dataSource || "",
          confidenceScore: Number(p.confidenceScore) || 0,
        });
        // Also try to get full indicators
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    // Try to get full indicators from API
    fetch(`/api/admin/property/${id}`).then(r => r.json()).then(d => {
      if (d.indicators) setIndicators(d.indicators);
      if (d.projectName) setMeta(prev => ({ ...prev, ...d }));
    }).catch(() => {});
  }, [id]);

  const handleSave = async () => {
    setSaving(true); setMsg("");
    try {
      const res = await fetch(`/api/admin/property/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, indicators }),
      });
      const d = await res.json();
      setMsg(d.success ? "保存成功！" : (d.error || "保存失败"));
    } catch { setMsg("网络错误"); }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: 24, color: "#737373", fontFamily: "var(--font-sans)" }}>加载中...</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <button onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "#737373" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: 0 }}>{meta.projectName || "编辑资产"}</p>
          </div>
          <p style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)", margin: 0 }}>{meta.city} · {meta.district} · ID: {id}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {msg && <span style={{ fontSize: 12, alignSelf: "center", color: msg.includes("成功") ? "#10B981" : "#EE0000", fontFamily: "var(--font-sans)" }}>{msg}</span>}
          <button onClick={() => router.back()} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", color: "#404040", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>返回</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
            {saving ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>

      {/* Meta Section */}
      <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>基本信息</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="项目名称" value={meta.projectName} onChange={v => setMeta({...meta, projectName: v})} />
          <Field label="城市" value={meta.city} onChange={v => setMeta({...meta, city: v})} />
          <Field label="区域" value={meta.district} onChange={v => setMeta({...meta, district: v})} />
          <Field label="面价" value={String(meta.faceRent)} onChange={v => setMeta({...meta, faceRent: parseFloat(v)||0})} />
          <Field label="数据源" value={meta.dataSource} onChange={v => setMeta({...meta, dataSource: v})} />
          <Field label="可信度" value={String(meta.confidenceScore)} onChange={v => setMeta({...meta, confidenceScore: parseFloat(v)||0})} />
        </div>
      </div>

      {/* Indicators */}
      {SECTIONS.map(section => (
        <div key={section.key} style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>{section.label}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {section.fields.map(f => {
              const raw = indicators[f.key] !== undefined ? indicators[f.key] : "";
              const displayVal = f.format !== "text" && raw !== "" ? formatValue(raw, f.format!) : String(raw);
              return (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>
                    {f.label} {f.unit ? `(${f.unit})` : ""}
                  </label>
                  <input
                    type={f.format === "text" ? "text" : "number"}
                    step="any"
                    value={displayVal}
                    onChange={e => setIndicators(prev => ({ ...prev, [f.key]: parseValue(e.target.value, f.format!) }))}
                    placeholder="—"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: f.format === "text" ? "var(--font-sans)" : "var(--font-mono)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
          {saving ? "保存中..." : "保存修改"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}
