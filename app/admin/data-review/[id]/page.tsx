"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

interface AssetDetail {
  id: string;
  projectName: string;
  city: string;
  district: string;
  rawAddress: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number;
  area: number | null;
  dataSource: string;
  status: string;
  confidenceScore: number;
  dynamicIndicators: Record<string, any>;
  auditLog: any[];
}

const INDICATOR_GROUPS: { label: string; fields: string[] }[] = [
  { label: "租金流", fields: ["faceRent", "netEffectiveRent"] },
  { label: "资产回报", fields: ["capRate", "priceToRentRatio"] },
  { label: "租约质量", fields: ["wale", "retentionRate", "tenantConcentration"] },
  { label: "办公运营", fields: ["netAbsorption", "reversionRate", "spaceUtilization"] },
  { label: "商业零售", fields: ["salesEfficiency", "rentToSalesRatio", "footfallTicketSize", "anchorDependency", "merchantChurnRate", "firstStoreRatio", "openToCloseRatio"] },
  { label: "产业园", fields: ["electricityOutputRatio", "taxCovenantRate", "loadingDockRatio"] },
  { label: "投融资", fields: ["esgCertification", "landFloorPrice", "capexIntensity", "npiMargin", "collectionRate", "compTxPrice", "noiCagr3Y"] },
  { label: "市场环境", fields: ["submarketVacancy", "policyIncentiveLevel", "yieldSpread", "kolBuzzIndex", "negativeSentimentRate", "employeeHappinessScore"] },
  { label: "企业迁徙", fields: ["netCorporateMigration", "hqSupplyChainRatio", "corporateInquiryIndex"] },
  { label: "文化溢价", fields: ["culturalRadianceLevel", "footfallPulseRate", "culturalPremiumScore"] },
  { label: "物业服务", fields: ["pmOperatorTier", "facilitySlaRating", "maintenanceScore"] },
  { label: "资本杠杆", fields: ["ltvRatio", "debtYield", "cashOnCashReturn", "projectedIrr5Y"] },
  { label: "人口红利", fields: ["tradeAreaPopulation", "demographicPremiumScore"] },
];

const FIELD_LABELS: Record<string, string> = {
  faceRent: "挂牌面价", netEffectiveRent: "净有效租金",
  capRate: "资本化率", priceToRentRatio: "售租比",
  wale: "加权平均租期", retentionRate: "租户留存率", tenantConcentration: "租户集中度",
  netAbsorption: "净吸纳量", reversionRate: "续租调升率", spaceUtilization: "空间利用率",
  salesEfficiency: "坪效", rentToSalesRatio: "租售比", footfallTicketSize: "客流客单价",
  anchorDependency: "主力店面积占比", merchantChurnRate: "商户掉铺率", firstStoreRatio: "首店面积占比", openToCloseRatio: "开关店比率",
  electricityOutputRatio: "电产比", taxCovenantRate: "亩均税收达成率", loadingDockRatio: "重载车位配比",
  esgCertification: "ESG认证", landFloorPrice: "土地楼面价", capexIntensity: "单位面积CapEx",
  npiMargin: "NPI利润率", collectionRate: "收缴率", compTxPrice: "大宗交易单价", noiCagr3Y: "3年NOI增速",
  submarketVacancy: "商圈空置率", policyIncentiveLevel: "政策扶持级数", yieldSpread: "收益利差",
  kolBuzzIndex: "KOL热度指数", negativeSentimentRate: "负面声量率", employeeHappinessScore: "员工幸福评分",
  netCorporateMigration: "企业净迁入率", hqSupplyChainRatio: "总部集聚度", corporateInquiryIndex: "选址活跃指数",
  culturalRadianceLevel: "文化辐射级数", footfallPulseRate: "客流脉冲系数", culturalPremiumScore: "文化溢价得分",
  pmOperatorTier: "物业服务商等级", facilitySlaRating: "设施SLA评分", maintenanceScore: "维护控制得分",
  ltvRatio: "贷款价值比", debtYield: "债务收益率", cashOnCashReturn: "现金回报率", projectedIrr5Y: "5年预测IRR",
  tradeAreaPopulation: "商圈人口总量", demographicPremiumScore: "人口匹配度得分",
};

function formatFieldValue(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number(v).toFixed(4);
  return String(v);
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [edits, setEdits] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`/api/admin/review-queue/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setAsset(data);
        // Initialize edits from current indicators
        const init: Record<string, string> = {};
        if (data.dynamicIndicators) {
          Object.entries(data.dynamicIndicators).forEach(([k, v]) => {
            init[k] = v == null ? "" : String(v);
          });
        }
        setEdits(init);
      })
      .catch(() => setAsset(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleIndicatorChange = (field: string, value: string) => {
    setEdits((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!asset) return;
    setSaving(true);
    setActionMsg("");
    try {
      // Build updated indicators object
      const updatedIndicators: Record<string, any> = {};
      Object.entries(edits).forEach(([k, v]) => {
        if (v === "") {
          updatedIndicators[k] = null;
        } else {
          const num = Number(v);
          updatedIndicators[k] = isNaN(num) ? v : num;
        }
      });

      const res = await fetch(`/api/admin/review-queue/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dynamicIndicators: updatedIndicators }),
      });
      if (!res.ok) throw new Error("保存失败");
      setActionMsg("已保存");
    } catch (e: any) {
      setActionMsg("保存失败: " + e.message);
    }
    setSaving(false);
  };

  const handleAction = async (action: "approve" | "reject") => {
    if (!asset) return;
    let rejectReason = "";
    if (action === "reject") {
      rejectReason = prompt("驳回原因：") || "";
      if (!rejectReason) return;
    } else if (!confirm("确认批准此资产？批准后将发布到前台网站。")) {
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/review-queue/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(action === "approve" ? "已批准并发布" : "已驳回");
        if (action === "approve") setTimeout(() => router.push("/admin/data-review"), 1000);
      } else {
        setActionMsg("操作失败");
      }
    } catch (e: any) {
      setActionMsg("操作失败: " + e.message);
    }
    setSaving(false);
  };

  if (loading) return <div className="admin-content-inner"><div className="admin-page-header"><h1 className="admin-page-title">加载中...</h1></div></div>;
  if (!asset) return <div className="admin-content-inner"><div className="admin-page-header"><h1 className="admin-page-title">资产不存在</h1></div></div>;

  const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };

  return (
    <div className="admin-content-inner">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: "4px 8px", borderRadius: 6 }}>←</button>
        <div className="admin-page-header">
          <h1 className="admin-page-title">{asset.projectName}</h1>
          <p className="admin-page-desc">
            {asset.city} · {asset.district} · {typeLabel[asset.propertyType] || asset.propertyType} · 面价 ¥{Number(asset.faceRent).toFixed(1)} · 置信度 {(asset.confidenceScore * 100).toFixed(0)}%
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={handleSave} disabled={saving} className="btn-secondary" style={{ fontSize: 12 }}>
            {saving ? "保存中..." : "保存修改"}
          </button>
          <button onClick={() => handleAction("reject")} disabled={saving} className="btn-secondary" style={{ fontSize: 12, borderColor: "var(--negative)", color: "var(--negative)" }}>
            驳回
          </button>
          <button onClick={() => handleAction("approve")} disabled={saving} className="btn-primary" style={{ fontSize: 12 }}>
            批准发布
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 8, background: "var(--accent-soft)", color: "var(--accent)", fontSize: 13 }}>
          {actionMsg}
        </div>
      )}

      {INDICATOR_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>{group.label}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {group.fields.map((field) => {
              const val = edits[field] ?? "";
              const isNull = val === "";
              return (
                <div key={field} style={{
                  background: isNull ? "var(--bg)" : "var(--bg-surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 8, padding: "8px 12px",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap", minWidth: 72 }}>
                    {FIELD_LABELS[field] || field}
                  </span>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => handleIndicatorChange(field, e.target.value)}
                    placeholder="—"
                    style={{
                      flex: 1, background: "transparent", border: "none",
                      outline: "none", fontSize: 13, color: isNull ? "var(--text-hint)" : "var(--text)",
                      fontFamily: "var(--font-mono)", textAlign: "right",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
