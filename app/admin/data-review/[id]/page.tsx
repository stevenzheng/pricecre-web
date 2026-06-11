// app/admin/data-review/[id]/page.tsx — Property Detail Editor
// 字段键与前台 PropertyCard 显示的指标键完全一致（来源：components/PropertyCard.tsx getIndicatorFields）
// 数值直接按存储值编辑（如 16.3 表示 16.3%），不做单位换算，前后台一致
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type IndicatorMap = Record<string, any>;

const TYPE_OPTIONS = [
  { value: "OFFICE", label: "写字楼" },
  { value: "SHOPS", label: "商业零售" },
  { value: "INDUSTRIAL", label: "产业园" },
];

const SECTIONS: { key: string; label: string; fields: { key: string; label: string; unit?: string; text?: boolean }[] }[] = [
  { key: "rent", label: "租金与回报", fields: [
    { key: "netEffectiveRent", label: "净有效租金", unit: "元/㎡/天" },
    { key: "capRate", label: "资本化率", unit: "%" },
    { key: "priceToRentRatio", label: "售租比", unit: "x" },
    { key: "yieldSpread", label: "收益利差", unit: "bp" },
    { key: "cashOnCashReturn", label: "现金回报率", unit: "%" },
    { key: "projectedIrr5Y", label: "5年预测IRR", unit: "%" },
    { key: "reversionRate", label: "续租调升率", unit: "%" },
  ]},
  { key: "lease", label: "租赁结构", fields: [
    { key: "wale", label: "加权平均租期", unit: "年" },
    { key: "retentionRate", label: "租户留存率", unit: "%" },
    { key: "tenantConcentration", label: "租户集中度", unit: "%" },
    { key: "spaceUtilization", label: "空间利用率", unit: "%" },
    { key: "netAbsorption", label: "净吸纳量", unit: "㎡" },
    { key: "collectionRate", label: "收缴率", unit: "%" },
  ]},
  { key: "financial", label: "财务指标", fields: [
    { key: "npiMargin", label: "净物业收入利润率", unit: "%" },
    { key: "noiCagr3Y", label: "NOI 3年复合增长", unit: "%" },
    { key: "ltvRatio", label: "贷款价值比", unit: "%" },
    { key: "debtYield", label: "债务收益率", unit: "%" },
    { key: "capexIntensity", label: "单位资本投入", unit: "元/㎡" },
    { key: "landFloorPrice", label: "土地楼面价", unit: "元/㎡" },
    { key: "compTxPrice", label: "可比大宗单价", unit: "元/㎡" },
  ]},
  { key: "market", label: "市场与区位", fields: [
    { key: "submarketVacancy", label: "商圈空置率", unit: "%" },
    { key: "netCorporateMigration", label: "企业净迁入", unit: "%" },
    { key: "hqSupplyChainRatio", label: "总部集聚度", unit: "%" },
    { key: "kolBuzzIndex", label: "热度指数" },
    { key: "negativeSentimentRate", label: "负面声量", unit: "%" },
    { key: "corporateInquiryIndex", label: "企业问询指数" },
    { key: "policyIncentiveLevel", label: "政策级数" },
    { key: "culturalRadianceLevel", label: "文化辐射级数" },
  ]},
  { key: "quality", label: "资产质量与运营", fields: [
    { key: "esgCertification", label: "绿色认证", text: true },
    { key: "pmOperatorTier", label: "物业品牌", text: true },
    { key: "facilitySlaRating", label: "设施SLA评分" },
    { key: "electricityOutputRatio", label: "电产比", unit: "x" },
    { key: "taxCovenantRate", label: "亩均税收", unit: "%" },
    { key: "employeeHappinessScore", label: "员工幸福指数" },
  ]},
];

export default function PropertyEditorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [loadError, setLoadError] = useState("");
  const [source, setSource] = useState("");
  const [indicators, setIndicators] = useState<IndicatorMap>({});
  const [meta, setMeta] = useState({ projectName: "", city: "", district: "", propertyType: "OFFICE", faceRent: 0, dataSource: "", confidenceScore: 0 });

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError("");
    fetch(`/api/admin/property/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setLoadError("未找到该资产，可能已被删除"); setLoading(false); return; }
        setMeta({
          projectName: d.projectName || "",
          city: d.city || "",
          district: d.district || "",
          propertyType: d.propertyType || "OFFICE",
          faceRent: Number(d.faceRent) || 0,
          dataSource: d.dataSource || "",
          confidenceScore: Number(d.confidenceScore) || 0,
        });
        setIndicators(d.indicators || {});
        setSource(d.source || "");
        setLoading(false);
      })
      .catch(() => { setLoadError("加载失败，请检查网络后重试"); setLoading(false); });
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

  if (loading) return <div className="bw-loading"><div className="bw-spin" /><span>加载中</span></div>;

  if (loadError) return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 14, color: "#EE0000", fontFamily: "var(--font-sans)" }}>{loadError}</p>
      <button onClick={() => router.push("/admin/data-review")} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 6, border: "1px solid var(--bw-line)", background: "var(--bw-surface)", fontSize: 13, cursor: "pointer", fontFamily: "var(--font-sans)" }}>← 返回资产列表</button>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <button onClick={() => router.push("/admin/data-review")} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--bw-muted)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: 0 }}>{meta.projectName || "编辑资产"}</p>
            {source === "mock" && <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "2px 6px", borderRadius: 4, background: "rgba(245,166,35,0.1)", color: "#F5A623" }}>演示数据 · 保存后转为正式数据</span>}
          </div>
          <p style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>{meta.city} · {meta.district} · ID: {id}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {msg && <span style={{ fontSize: 12, alignSelf: "center", color: msg.includes("成功") ? "#10B981" : "#EE0000", fontFamily: "var(--font-sans)" }}>{msg}</span>}
          <button onClick={() => router.push("/admin/data-review")} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid var(--bw-line)", background: "var(--bw-surface)", color: "var(--bw-text-2)", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>返回</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
            {saving ? "保存中..." : "保存修改"}
          </button>
        </div>
      </div>

      {/* Meta Section — 与前台展示字段一致 */}
      <div style={{ background: "var(--bw-surface)", borderRadius: 10, border: "1px solid var(--bw-line)", padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>基本信息</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="项目名称" value={meta.projectName} onChange={v => setMeta({...meta, projectName: v})} />
          <Field label="城市" value={meta.city} onChange={v => setMeta({...meta, city: v})} />
          <Field label="区域" value={meta.district} onChange={v => setMeta({...meta, district: v})} />
          <div>
            <label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>业态</label>
            <select value={meta.propertyType} onChange={e => setMeta({...meta, propertyType: e.target.value})}
              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box", background: "var(--bw-surface)" }}>
              {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <Field label="挂牌面价 (元/㎡/天)" value={String(meta.faceRent)} onChange={v => setMeta({...meta, faceRent: parseFloat(v)||0})} />
          <Field label="数据来源" value={meta.dataSource} onChange={v => setMeta({...meta, dataSource: v})} />
          <Field label="可信度 (0~1)" value={String(meta.confidenceScore)} onChange={v => setMeta({...meta, confidenceScore: parseFloat(v)||0})} />
        </div>
      </div>

      {/* Indicators — 键名与前台 PropertyCard 一致，留空表示前台不展示该项 */}
      {SECTIONS.map(section => (
        <div key={section.key} style={{ background: "var(--bw-surface)", borderRadius: 10, border: "1px solid var(--bw-line)", padding: 16, marginBottom: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>{section.label}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {section.fields.map(f => {
              const raw = indicators[f.key];
              const displayVal = raw === undefined || raw === null ? "" : String(raw);
              return (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>
                    {f.label} {f.unit ? `(${f.unit})` : ""}
                  </label>
                  <input
                    type={f.text ? "text" : "number"}
                    step="any"
                    value={displayVal}
                    onChange={e => {
                      const v = e.target.value;
                      setIndicators(prev => {
                        const next = { ...prev };
                        if (v === "") { delete next[f.key]; return next; }
                        next[f.key] = f.text ? v : (isNaN(parseFloat(v)) ? v : parseFloat(v));
                        return next;
                      });
                    }}
                    placeholder="— 留空则前台不展示"
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: f.text ? "var(--font-sans)" : "var(--font-mono)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Bottom Save */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        {msg && <span style={{ fontSize: 12, alignSelf: "center", color: msg.includes("成功") ? "#10B981" : "#EE0000", fontFamily: "var(--font-sans)" }}>{msg}</span>}
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
      <label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }} />
    </div>
  );
}
