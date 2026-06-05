// app/admin/data-review/[id]/page.tsx — Ghost Admin Asset Detail Editor
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface AssetDetail {
  id: string; projectName: string; city: string; district: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number; area: number | null; dataSource: string;
  status?: string; confidenceScore?: number;
  dynamicIndicators: Record<string, any>;
}

const LABELS: Record<string, string> = {
  faceRent: "挂牌面价", netEffectiveRent: "净有效租金", capRate: "资本化率", priceToRentRatio: "售租比",
  wale: "加权平均租期", retentionRate: "租户留存率", tenantConcentration: "租户集中度",
  netAbsorption: "净吸纳量", reversionRate: "续租调升率", spaceUtilization: "空间利用率",
  salesEfficiency: "坪效", rentToSalesRatio: "租售比", footfallTicketSize: "客流客单价",
  anchorDependency: "主力店面积占比", merchantChurnRate: "商户掉铺率",
  electricityOutputRatio: "电产比", taxCovenantRate: "亩均税收达成率",
  esgCertification: "ESG认证", landFloorPrice: "土地楼面价", capexIntensity: "单位面积CapEx",
  npiMargin: "NPI利润率", collectionRate: "收缴率", compTxPrice: "大宗交易单价", noiCagr3Y: "3年NOI增速",
  submarketVacancy: "商圈空置率", policyIncentiveLevel: "政策扶持级数", yieldSpread: "收益利差",
  kolBuzzIndex: "KOL热度指数", negativeSentimentRate: "负面声量率",
  netCorporateMigration: "企业净迁入率", hqSupplyChainRatio: "总部集聚度",
  culturalRadianceLevel: "文化辐射级数", footfallPulseRate: "客流脉冲系数",
  pmOperatorTier: "物业服务商等级", facilitySlaRating: "设施SLA评分",
  ltvRatio: "贷款价值比", debtYield: "债务收益率", cashOnCashReturn: "现金回报率", projectedIrr5Y: "5年预测IRR",
  tradeAreaPopulation: "商圈人口总量", demographicPremiumScore: "人口匹配度得分",
  openToCloseRatio: "开关店比率",
};

const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };

function AssetDetailInner() {
  const params = useParams(); const router = useRouter(); const searchParams = useSearchParams();
  const id = params.id as string;
  const source = searchParams.get("source") || "production";

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const apiUrl = source === "review" ? `/api/admin/review-queue/${id}` : `/api/admin/properties/${id}`;
    fetch(apiUrl).then(r => r.json()).then(data => {
      setAsset(data);
      const init: Record<string, string> = {};
      if (data.dynamicIndicators) Object.entries(data.dynamicIndicators).forEach(([k, v]) => { init[k] = v == null ? "" : String(v); });
      setEdits(init);
    }).finally(() => setLoading(false));
  }, [id, source]);

  const handleSave = async () => {
    if (!asset) return; setSaving(true);
    const updated: Record<string, any> = {};
    Object.entries(edits).forEach(([k, v]) => { if (v === "") { updated[k] = null; return; } const num = Number(v); updated[k] = isNaN(num) ? v : num; });
    const apiUrl = source === "review" ? `/api/admin/review-queue/${id}` : `/api/admin/properties/${id}`;
    const res = await fetch(apiUrl, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dynamicIndicators: updated, faceRent: asset.faceRent }) });
    setToast(res.ok ? "已保存" : "保存失败");
    setSaving(false); setTimeout(() => setToast(""), 3000);
  };

  const handleApprove = async () => {
    if (!confirm("确认批准并发布到前台？")) return;
    setSaving(true);
    const res = await fetch(`/api/admin/review-queue/${id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "approve" }) });
    const data = await res.json();
    setToast(data.success ? "已批准发布" : "操作失败");
    setSaving(false);
    if (data.success) setTimeout(() => router.push("/admin/data-review"), 1000);
  };

  if (loading) return <div className="gh-content-inner"><div className="gh-empty"><p className="gh-empty-title">加载中...</p></div></div>;
  if (!asset) return <div className="gh-content-inner"><div className="gh-empty"><p className="gh-empty-title">资产不存在</p></div></div>;

  const allFields = Object.keys(asset.dynamicIndicators || {}).filter(k => k !== "__proto__");

  return (
    <div className="gh-content-inner">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button onClick={() => router.back()} className="gh-btn-text">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          返回
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="gh-page-title">{asset.projectName}</h1>
          <p className="gh-page-desc">
            {asset.city} · {asset.district} · {typeLabel[asset.propertyType]} · ¥{Number(asset.faceRent).toFixed(1)}/㎡/天
            {source === "review" && ` · 置信度 ${((asset.confidenceScore ?? 1) * 100).toFixed(0)}%`}
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="gh-btn-outline">{saving ? "保存中..." : "保存修改"}</button>
        {source === "review" && <button onClick={handleApprove} disabled={saving} className="gh-btn-primary">批准发布</button>}
      </div>

      {toast && <div className="gh-toast" style={{ marginBottom: 16 }} onClick={() => setToast("")}>{toast}</div>}

      {/* Fields grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 8 }}>
        {allFields.map(field => {
          const val = edits[field] ?? "";
          const isNull = val === "";
          const label = LABELS[field] || field;
          return (
            <div key={field} className="gh-card-static" style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: isNull ? "#D1D5DB" : "#738A94", minWidth: 100, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {label}
              </span>
              <input
                type="text" value={val}
                onChange={e => setEdits(prev => ({ ...prev, [field]: e.target.value }))}
                placeholder="—"
                style={{ flex: 1, border: "none", outline: "none", fontSize: 13, fontFamily: "var(--font-geist-mono), monospace", color: isNull ? "#D1D5DB" : "#15171A", background: "transparent", textAlign: "right" }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AssetDetailPage() {
  return (
    <Suspense fallback={<div className="gh-content-inner"><div className="gh-empty"><p className="gh-empty-title">加载中...</p></div></div>}>
      <AssetDetailInner />
    </Suspense>
  );
}
