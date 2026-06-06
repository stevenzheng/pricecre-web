// app/admin/data-review/[id]/page.tsx — Asset Detail (category-grouped, auto-save)
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface AssetDetail {
  id: string; projectName: string; city: string; district: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number; area: number | null; dataSource: string;
  status?: string; confidenceScore?: number;
  dynamicIndicators: Record<string, any>;
}

const ALL_FIELDS: { key: string; label: string; category: string }[] = [
  { key: "netEffectiveRent", label: "净有效租金", category: "核心指标" },
  { key: "capRate", label: "资本化率", category: "估值指标" },
  { key: "priceToRentRatio", label: "售租比", category: "估值指标" },
  { key: "wale", label: "加权平均租期", category: "租约质量" },
  { key: "retentionRate", label: "租户留存率", category: "租约质量" },
  { key: "tenantConcentration", label: "租户集中度", category: "租约质量" },
  { key: "netAbsorption", label: "净吸纳量", category: "写字楼效率" },
  { key: "reversionRate", label: "续租调升率", category: "写字楼效率" },
  { key: "spaceUtilization", label: "空间利用率", category: "写字楼效率" },
  { key: "salesEfficiency", label: "坪效", category: "商业零售" },
  { key: "rentToSalesRatio", label: "租售比", category: "商业零售" },
  { key: "footfallTicketSize", label: "客流客单价", category: "商业零售" },
  { key: "openToCloseRatio", label: "开关店比率", category: "零售生态" },
  { key: "esgCertification", label: "ESG认证", category: "宏观合规" },
  { key: "landFloorPrice", label: "土地楼面价", category: "投前建造" },
  { key: "capexIntensity", label: "单位面积CapEx", category: "投前建造" },
  { key: "npiMargin", label: "NPI利润率", category: "运营效率" },
  { key: "collectionRate", label: "收缴率", category: "运营效率" },
  { key: "compTxPrice", label: "大宗交易单价", category: "投后退出" },
  { key: "noiCagr3Y", label: "3年NOI增速", category: "投后退出" },
  { key: "submarketVacancy", label: "商圈空置率", category: "经济政策" },
  { key: "policyIncentiveLevel", label: "政策扶持级数", category: "经济政策" },
  { key: "yieldSpread", label: "收益利差", category: "经济政策" },
  { key: "kolBuzzIndex", label: "KOL热度指数", category: "舆情社群" },
  { key: "negativeSentimentRate", label: "负面声量率", category: "舆情社群" },
  { key: "electricityOutputRatio", label: "电产比", category: "产业园" },
  { key: "taxCovenantRate", label: "亩均税收达成率", category: "产业园" },
  { key: "anchorDependency", label: "主力店面积占比", category: "零售生态" },
  { key: "merchantChurnRate", label: "商户掉铺率", category: "零售生态" },
  { key: "netCorporateMigration", label: "企业净迁入率", category: "企业迁入" },
  { key: "hqSupplyChainRatio", label: "总部集聚度", category: "企业迁入" },
  { key: "culturalRadianceLevel", label: "文化辐射级数", category: "文化艺术" },
  { key: "footfallPulseRate", label: "客流脉冲系数", category: "文化艺术" },
  { key: "pmOperatorTier", label: "品牌名称", category: "物业品牌" },
  { key: "facilitySlaRating", label: "设施SLA评分", category: "物业品牌" },
  { key: "ltvRatio", label: "贷款价值比", category: "资本债务" },
  { key: "debtYield", label: "债务收益率", category: "资本债务" },
  { key: "cashOnCashReturn", label: "现金回报率", category: "资本债务" },
  { key: "projectedIrr5Y", label: "5年预测IRR", category: "资本债务" },
  { key: "tradeAreaPopulation", label: "商圈人口总量", category: "人口统计" },
  { key: "demographicPremiumScore", label: "人口匹配度得分", category: "人口统计" },
];

const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };

const catIcons: Record<string, string> = {
  "核心指标": "◆", "估值指标": "◈", "租约质量": "◎", "写字楼效率": "◇", "商业零售": "▣",
  "宏观合规": "○", "投前建造": "△", "运营效率": "◉", "投后退出": "▽",
  "经济政策": "◊", "舆情社群": "☆", "产业园": "⬡", "零售生态": "▨",
  "企业迁入": "▷", "品牌选址": "◁", "文化艺术": "♢", "物业品牌": "✧",
  "资本债务": "⬟", "人口统计": "⬢", "资产概览": "⬟",
};

function AssetDetailInner() {
  const params = useParams(); const router = useRouter(); const searchParams = useSearchParams();
  const id = params.id as string;
  const source = searchParams.get("source") || "production";

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [hiddenFields, setHiddenFields] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty" | "error">("saved");
  const [toast, setToast] = useState("");
  const [approving, setApproving] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Editable meta fields
  const [meta, setMeta] = useState({ projectName: "", city: "", district: "", propertyType: "OFFICE", faceRent: 0, lat: "", lng: "", dataSource: "" });
  const metaTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const apiUrl = source === "review" ? `/api/admin/review-queue/${id}` : `/api/admin/properties/${id}`;
    fetch(apiUrl).then(r => r.json()).then(data => {
      setAsset(data);
      setMeta({
        projectName: data.projectName || "",
        city: data.city || "",
        district: data.district || "",
        propertyType: data.propertyType || "OFFICE",
        faceRent: Number(data.faceRent) || 0,
        lat: data.dynamicIndicators?.lat || "",
        lng: data.dynamicIndicators?.lng || "",
        dataSource: data.dataSource || "",
      });
      const init: Record<string, string> = {};
      ALL_FIELDS.forEach(f => {
        const val = data.dynamicIndicators?.[f.key];
        init[f.key] = val == null ? "" : String(val);
      });
      setEdits(init);
      fetch("/api/admin/field-settings?type=" + (data.propertyType || "OFFICE"))
        .then(r => r.json()).then(d => {
          const hidden = new Set<string>();
          (d.fields || []).forEach((f: any) => {
            if (!f.isDisplayed && f.fieldKey) hidden.add(f.fieldKey);
          });
          setHiddenFields(hidden);
        }).catch(() => {});
    }).finally(() => setLoading(false));
  }, [id, source]);

  const doSave = useCallback(async (currentEdits: Record<string, string>) => {
    if (!asset) return;
    setSaveStatus("saving");
    const updated: Record<string, any> = {};
    ALL_FIELDS.forEach(f => { const v = currentEdits[f.key]; if (v === "" || v == null) { updated[f.key] = null; return; } const num = Number(v); updated[f.key] = isNaN(num) ? v : num; });
    const apiUrl = source === "review" ? `/api/admin/review-queue/${id}` : `/api/admin/properties/${id}`;
    try { const res = await fetch(apiUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dynamicIndicators: updated }) }); setSaveStatus(res.ok ? "saved" : "error"); } catch { setSaveStatus("error"); }
  }, [asset, id, source]);

  // Auto-save meta fields (projectName, city, district, propertyType, faceRent, lat, lng, dataSource)
  const handleMetaChange = (key: string, value: string) => {
    setMeta(prev => {
      const next = { ...prev, [key]: value };
      if (metaTimerRef.current) clearTimeout(metaTimerRef.current);
      metaTimerRef.current = setTimeout(async () => {
        const apiUrl = source === "review" ? `/api/admin/review-queue/${id}` : `/api/admin/properties/${id}`;
        const body: Record<string, any> = { projectName: next.projectName, city: next.city, district: next.district, propertyType: next.propertyType, faceRent: Number(next.faceRent) || 0, dataSource: next.dataSource, dynamicIndicators: {} };
        if (next.lat) (body.dynamicIndicators as any).lat = next.lat;
        if (next.lng) (body.dynamicIndicators as any).lng = next.lng;
        await fetch(apiUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => {});
      }, 600);
      return next;
    });
  };

  const handleChange = (key: string, value: string) => {
    setEdits(prev => {
      const next = { ...prev, [key]: value };
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("dirty");
      saveTimerRef.current = setTimeout(() => doSave(next), 600);
      return next;
    });
  };

  const toggleHidden = async (key: string) => {
    setHiddenFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      fetch("/api/admin/field-settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: [{ key, isActive: !next.has(key), label: ALL_FIELDS.find(f => f.key === key)?.label || key }] }) }).catch(() => {});
      return next;
    });
  };

  const handleApprove = async () => {
    if (!confirm("确认批准并发布到前台？")) return;
    setApproving(true);
    if (saveTimerRef.current) { clearTimeout(saveTimerRef.current); await doSave(edits); }
    const updated: Record<string, any> = {};
    ALL_FIELDS.forEach(f => { const v = edits[f.key]; if (v === "" || v == null) { updated[f.key] = null; return; } const num = Number(v); updated[f.key] = isNaN(num) ? v : num; });
    const res = await fetch(`/api/admin/review-queue/${id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve", dynamicIndicators: updated }) });
    const data = await res.json();
    setToast(data.success ? "已批准发布" : ("失败: " + (data.error || "")));
    setApproving(false);
    if (data.success) setTimeout(() => router.push("/admin/data-review"), 1000);
  };

  if (loading) return <div className="vl-content-inner"><div className="vl-empty"><p className="vl-empty-title">加载中...</p></div></div>;
  if (!asset) return <div className="vl-content-inner"><div className="vl-empty"><p className="vl-empty-title">资产不存在</p></div></div>;

  // Group by category
  const catMap = new Map<string, typeof ALL_FIELDS>();
  ALL_FIELDS.forEach(f => { if (!catMap.has(f.category)) catMap.set(f.category, []); catMap.get(f.category)!.push(f); });
  const hiddenCount = ALL_FIELDS.filter(f => hiddenFields.has(f.key)).length;

  const generatePDF = () => {
    const now = new Date().toLocaleString("zh-CN");
    const cats = Array.from(catMap.entries());
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${asset.projectName} - PriceCRE</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Geist Sans',-apple-system,sans-serif;color:#1a1a2e;line-height:1.7;max-width:900px;margin:0 auto;padding:40px}
.header{border-bottom:3px solid #0f0f23;padding-bottom:24px;margin-bottom:32px;display:flex;align-items:center;gap:16px}
.header img{width:48px;height:48px;border-radius:8px}
.header h1{font-size:22px;font-weight:700;color:#0f0f23;letter-spacing:-0.02em}
.header .meta{font-size:12px;color:#6b7280;margin-top:4px}
.section{margin-bottom:28px}
.section h2{font-size:14px;font-weight:700;color:#2563eb;border-left:3px solid #2563eb;padding-left:12px;margin-bottom:14px;letter-spacing:-0.01em}
.property-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px}
.prop-item{background:#f8fafc;padding:10px 14px;border-radius:6px;border:1px solid #e2e8f0}
.prop-item .label{font-size:10px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em}
.prop-item .value{font-size:16px;font-weight:700;color:#0f0f23;margin-top:2px}
.indicator-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}
.indicator{display:flex;justify-content:space-between;align-items:center;padding:6px 10px;border-bottom:1px solid #f1f5f9;font-size:12px}
.indicator .lbl{font-weight:600;color:#334155}
.indicator .val{font-weight:600;color:#e11d48;font-family:'Geist Mono',monospace;font-size:11px}
.footer{margin-top:48px;padding-top:24px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8;line-height:1.8}
.footer strong{color:#475569}
.watermark{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:80px;color:rgba(37,99,235,0.03);font-weight:900;pointer-events:none;z-index:-1;white-space:nowrap}
@media print{body{padding:20px}.watermark{display:block}}
</style></head><body>
<div class="watermark">PriceCRE</div>
<div class="header"><img src="${window.location.origin}/og-image.png" alt="PriceCRE"><div><h1>${asset.projectName}</h1><div class="meta">PriceCRE · 商业地产量化精算报告 · ${now}</div></div></div>
<div class="section"><h2>资产概览</h2>
<div class="property-grid">
<div class="prop-item"><div class="label">城市</div><div class="value">${asset.city}</div></div>
<div class="prop-item"><div class="label">区域</div><div class="value">${asset.district}</div></div>
<div class="prop-item"><div class="label">业态</div><div class="value">${typeLabel[asset.propertyType]}</div></div>
<div class="prop-item"><div class="label">面价</div><div class="value">¥${Number(asset.faceRent).toFixed(1)}/㎡/天</div></div>
</div></div>
${cats.map(([cat, fields]) => {
  const vals = fields.filter(f => edits[f.key] && !hiddenFields.has(f.key));
  if (vals.length === 0) return "";
  return `<div class="section"><h2>${cat}</h2><div class="indicator-grid">${vals.map(f => `<div class="indicator"><span class="lbl">${f.label}</span><span class="val">${edits[f.key]}</span></div>`).join("")}</div></div>`;
}).join("")}
<div class="footer">
<p><strong>© ${new Date().getFullYear()} PriceCRE · 地产价值</strong> — 商业地产量化精算资产终端</p>
<p>本报告由 PriceCRE 数据治理中心生成，数据来源：${asset.dataSource || "本地AI代理"}。报告内容仅供参考，不构成投资建议。</p>
<p>报告生成时间：${now} | 资产ID：${asset.id}</p>
<p>PriceCRE 保留所有权利。未经授权，禁止复制、转载或用于商业用途。</p>
</div>
</body></html>`;
    const w = window.open("", "_blank", "width=900,height=700");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  return (
    <div className="vl-content-inner">
      {/* Header — inline info */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button onClick={() => router.back()} className="vl-btn-ghost" style={{ flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 }}>
            {/* Editable project name */}
            <input value={meta.projectName} onChange={e => handleMetaChange("projectName", e.target.value)}
              style={{ border: "none", borderBottom: "1px dashed #D4D4D4", outline: "none", fontSize: 18, fontWeight: 600,
                fontFamily: "var(--font-sans)", color: "#171717", letterSpacing: "-0.04em", width: 140, background: "transparent", padding: 0 }} />
            <span style={{ fontSize: 12, color: "#A3A3A3" }}>·</span>
            {/* Editable city */}
            <input value={meta.city} onChange={e => handleMetaChange("city", e.target.value)}
              style={{ border: "none", borderBottom: "1px dashed #D4D4D4", outline: "none", fontSize: 12, fontWeight: 500,
                color: "#525252", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", width: 40, background: "transparent", padding: 0 }} />
            {/* Editable district */}
            <input value={meta.district} onChange={e => handleMetaChange("district", e.target.value)}
              style={{ border: "none", borderBottom: "1px dashed #D4D4D4", outline: "none", fontSize: 12, fontWeight: 500,
                color: "#525252", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", width: 55, background: "transparent", padding: 0 }} />
            <span style={{ fontSize: 12, color: "#A3A3A3" }}>·</span>
            {/* Editable property type */}
            <select value={meta.propertyType} onChange={e => handleMetaChange("propertyType", e.target.value)}
              style={{ fontSize: 10, fontWeight: 600, fontFamily: "var(--font-sans)", padding: "2px 4px", borderRadius: 3,
                background: "rgba(0,112,243,0.06)", color: "#0070F3", border: "none", cursor: "pointer", outline: "none" }}>
              <option value="OFFICE">写字楼</option>
              <option value="SHOPS">商业零售</option>
              <option value="INDUSTRIAL">产业园</option>
            </select>
            <span style={{ fontSize: 12, color: "#A3A3A3" }}>·</span>
            {/* Editable face rent */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 1, borderBottom: "1px dashed #D4D4D4" }}>
              <span style={{ fontSize: 12, color: "#737373" }}>¥</span>
              <input type="number" step="0.1" value={meta.faceRent} onChange={e => handleMetaChange("faceRent", e.target.value)}
                style={{ border: "none", outline: "none", fontSize: 13, fontWeight: 600,
                  fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace", color: "#171717", width: 45, background: "transparent", padding: 0 }} />
              <span style={{ fontSize: 10, color: "#A3A3A3" }}>/㎡/天</span>
            </div>
            {source === "review" && (
              <><span style={{ fontSize: 12, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>·</span>
              <span style={{ fontSize: 12, color: (asset.confidenceScore ?? 1) >= 0.7 ? "#0070F3" : "#F5A623", fontFamily: "var(--font-sans)" }}>
                置信度 {((asset.confidenceScore ?? 1) * 100).toFixed(0)}%
              </span></>
            )}
            {/* Save indicator */}
            <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "1px 6px", borderRadius: 4,
              color: saveStatus === "saved" ? "#0070F3" : saveStatus === "saving" ? "#F5A623" : saveStatus === "dirty" ? "#A3A3A3" : "#EE0000",
              background: saveStatus === "saved" ? "rgba(0,112,243,0.06)" : saveStatus === "saving" ? "rgba(245,166,35,0.08)" : saveStatus === "dirty" ? "#F7F7F7" : "rgba(238,0,0,0.06)",
            }}>{saveStatus === "saved" ? "✓" : saveStatus === "saving" ? "⏳" : saveStatus === "dirty" ? "···" : "✗"}</span>
          </div>
          {/* Second row: data source + coordinates */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>数据源</span>
            <input value={meta.dataSource} onChange={e => handleMetaChange("dataSource", e.target.value)}
              style={{ border: "none", borderBottom: "1px dashed #D4D4D4", outline: "none", fontSize: 11, fontWeight: 500,
                color: "#525252", fontFamily: "var(--font-sans)", width: 80, background: "transparent", padding: 0 }} />
            <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>坐标</span>
            <input value={meta.lat} onChange={e => handleMetaChange("lat", e.target.value)} placeholder="纬度"
              style={{ border: "none", borderBottom: "1px dashed #D4D4D4", outline: "none", fontSize: 11, fontWeight: 500,
                fontFamily: "var(--font-geist-mono), monospace", width: 55, background: "transparent", padding: 0, color: "#171717" }} />
            <span style={{ fontSize: 10, color: "#D4D4D4" }}>,</span>
            <input value={meta.lng} onChange={e => handleMetaChange("lng", e.target.value)} placeholder="经度"
              style={{ border: "none", borderBottom: "1px dashed #D4D4D4", outline: "none", fontSize: 11, fontWeight: 500,
                fontFamily: "var(--font-geist-mono), monospace", width: 55, background: "transparent", padding: 0, color: "#171717" }} />
          </div>
        </div>
        <button onClick={generatePDF} className="vl-btn-secondary" style={{ flexShrink: 0, fontSize: 13 }}>导出 PDF</button>
        {source === "review" && (
          <button onClick={handleApprove} disabled={approving} className="vl-btn-primary" style={{ flexShrink: 0 }}>{approving ? "批准中..." : "批准发布"}</button>
        )}
      </div>

      {toast && <div className="vl-toast" style={{ marginBottom: 16, position: "static" }} onClick={() => setToast("")}>{toast}</div>}

      {hiddenCount > 0 && (
        <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>{hiddenCount} 个字段已隐藏</span>
          <button onClick={() => setHiddenFields(new Set())} className="vl-btn-ghost vl-btn-sm" style={{ fontSize: 11 }}>全部显示</button>
        </div>
      )}

      {/* Fields by category — color coded */}
      {Array.from(catMap.entries()).map(([cat, fields], ci) => {
        const bgColors = ["#F8FAFC", "#F5F7FA", "transparent"];
        const bg = bgColors[ci % 3];
        return (
        <div key={cat} style={{
          background: bg, borderRadius: 8, padding: "10px 12px", marginBottom: 8,
          border: bg === "transparent" ? "none" : `1px solid rgba(0,0,0,0.04)`,
        }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "#0070F3", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em", margin: "0 0 6px", textTransform: "none" }}>
            {catIcons[cat] && <span style={{ marginRight: 6, fontSize: 10 }}>{catIcons[cat]}</span>}{cat}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
            {fields.map(field => {
              const val = edits[field.key] ?? "";
              const isHidden = hiddenFields.has(field.key);
              return (
                <div key={field.key} style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 8px", borderRadius: 4,
                  background: isHidden ? "#F7F7F7" : "#FFFFFF",
                  border: `1px solid #E5E5E5`, opacity: isHidden ? 0.35 : 1,
                  transition: "opacity 0.15s",
                }}>
                  <span style={{ fontSize: 10, fontWeight: 500, color: isHidden ? "#A3A3A3" : "#737373", whiteSpace: "nowrap", fontFamily: "var(--font-sans)", textDecoration: isHidden ? "line-through" : "none" }}>
                    {field.label}
                  </span>
                  <input type="text" value={val} onChange={e => handleChange(field.key, e.target.value)}
                    placeholder="—" disabled={isHidden}
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 11, fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace", fontWeight: 500, textAlign: "right", padding: 0, color: isHidden ? "#A3A3A3" : (val ? "#E91E63" : "#D4D4D4"), minWidth: 40 }} />
                  <button onClick={() => toggleHidden(field.key)}
                    title={isHidden ? "显示" : "隐藏"}
                    style={{ width: 16, height: 16, border: "none", borderRadius: 3, background: "transparent", cursor: "pointer", opacity: 0.3, display: "flex", alignItems: "center", justifyContent: "center", color: "#737373", flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.7")} onMouseLeave={e => (e.currentTarget.style.opacity = "0.3")}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )})}

      <div style={{ marginTop: 16, fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", textAlign: "center" }}>
        输入后自动保存 · 点击 👁 控制前台显示
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  return (
    <Suspense fallback={<div className="vl-content-inner"><div className="vl-empty"><p className="vl-empty-title">加载中...</p></div></div>}>
      <AssetDetailInner />
    </Suspense>
  );
}
