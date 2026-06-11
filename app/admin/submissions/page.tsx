// app/admin/submissions/page.tsx — Ghost Admin Submissions Review
"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string; projectName: string; email: string; city: string; district?: string;
  netRent: number; propertyType: string; status: string; createdAt: string;
  dataSource?: string; isUserSubmission?: boolean; confidenceScore?: number;
}

const STATUS_CN: Record<string, { label: string; badge: string }> = {
  PENDING_REVIEW: { label: "待审核", badge: "vl-badge-warning" },
  APPROVED: { label: "已通过", badge: "vl-badge-success" },
  REJECTED: { label: "已驳回", badge: "vl-badge-danger" },
  CRITICAL_MISSING: { label: "数据缺损", badge: "vl-badge-danger" },
};

const TYPE_OPTIONS = [
  { value: "OFFICE", label: "写字楼" },
  { value: "SHOPS", label: "商业零售" },
  { value: "INDUSTRIAL", label: "产业园" },
];

// 字段键与前台 PropertyCard / 资产编辑器完全一致
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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_REVIEW");
  const [view, setView] = useState<"table" | "card">("table");
  const [msg, setMsg] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  // 批量选择（仅待审核条目可选）
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batching, setBatching] = useState(false);
  const toggleSelect = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const batchAction = async (action: "APPROVED" | "REJECTED") => {
    if (selected.size === 0) return;
    if (!confirm(`确认批量${action === "APPROVED" ? "通过" : "驳回"} ${selected.size} 条？`)) return;
    setBatching(true);
    let ok = 0, fail = 0;
    for (const id of Array.from(selected)) {
      try {
        const res = await fetch("/api/admin/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: id, action }) });
        const d = await res.json();
        if (d.success) ok++; else fail++;
      } catch { fail++; }
    }
    setBatching(false);
    setSelected(new Set());
    setMsg(`批量${action === "APPROVED" ? "通过" : "驳回"}完成：成功 ${ok} 条${fail > 0 ? ` · 失败 ${fail} 条` : ""}`);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch("/api/admin/submissions"); const data = await res.json(); setSubmissions(data.submissions || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    setMsg("");
    try {
      const res = await fetch("/api/admin/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: id, action }) });
      const d = await res.json();
      if (d.success) {
        setMsg(action === "APPROVED" ? (d.emailSent ? "已通过，兑换码邮件已发送" : "已通过") : "已驳回");
      } else { setMsg(d.error || "操作失败"); }
    } catch { setMsg("网络错误"); }
    fetchData();
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);
  const typeLabel = (t: string) => t === "OFFICE" ? "写字楼" : t === "SHOPS" ? "商业" : t === "INDUSTRIAL" ? "产业园" : t || "—";

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header">
        <h1 className="vl-page-title">租金核验队列</h1>
        <p className="vl-page-desc">用户提报 + 抓取入队数据统一审核 · 点击任意条目可打开全部指标审核编辑 · {submissions.length} 条 · 待审 {submissions.filter(s => s.status === "PENDING_REVIEW").length} 条</p>
      </div>

      {msg && <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, fontSize: 13, background: msg.includes("失败") || msg.includes("错误") ? "rgba(238,0,0,0.06)" : "rgba(16,185,129,0.08)", color: msg.includes("失败") || msg.includes("错误") ? "#EE0000" : "#059669" }}>{msg}</div>}

      <div className="vl-action-bar">
        <div className="vl-filter-tabs">
          {(["all", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const).map((s) => (
            <button key={s} className={`vl-filter-tab${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? "全部" : STATUS_CN[s]?.label || s}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 视图切换：表格 / 卡片 */}
          <div style={{ display: "inline-flex", border: "1px solid var(--bw-line)", borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setView("table")} title="表格视图"
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)", background: view === "table" ? "#0070F3" : "var(--bw-surface)", color: view === "table" ? "#FFF" : "var(--bw-muted)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              表格
            </button>
            <button onClick={() => setView("card")} title="卡片视图"
              style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", border: "none", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-sans)", background: view === "card" ? "#0070F3" : "var(--bw-surface)", color: view === "card" ? "#FFF" : "var(--bw-muted)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              卡片
            </button>
          </div>
          <button onClick={fetchData} className="vl-btn-ghost">刷新</button>
        </div>
      </div>

      {/* 批量操作条 */}
      {selected.size > 0 && (
        <div style={{ marginBottom: 10, padding: "8px 14px", borderRadius: 8, background: "rgba(0,112,243,0.06)", border: "1px solid rgba(0,112,243,0.25)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#0070F3", fontFamily: "var(--font-sans)" }}>已选 {selected.size} 条</span>
          <button onClick={() => batchAction("APPROVED")} disabled={batching} className="vl-btn-primary vl-btn-sm">批量通过</button>
          <button onClick={() => batchAction("REJECTED")} disabled={batching} className="vl-btn-danger vl-btn-sm">批量驳回</button>
          <button onClick={() => setSelected(new Set())} className="vl-btn-ghost vl-btn-sm">取消选择</button>
          {batching && <span style={{ fontSize: 11, color: "var(--bw-hint)" }}>处理中...</span>}
        </div>
      )}

      {loading ? (
        <div className="bw-loading"><div className="bw-spin" /><span>加载中</span></div>
      ) : filtered.length === 0 ? (
        <div className="vl-empty">
          <p className="vl-empty-title">暂无提交</p>
          <p className="vl-empty-desc">还没有用户提交租金数据</p>
        </div>
      ) : view === "card" ? (
        /* ============ 卡片视图 ============ */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {filtered.map((s) => (
            <div key={s.id} onClick={() => setEditId(s.id)}
              style={{ position: "relative", background: "var(--bw-surface)", border: `1px solid ${selected.has(s.id) ? "#0070F3" : "var(--bw-line)"}`, borderRadius: 12, padding: 14, cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                  {s.status === "PENDING_REVIEW" && (
                    <input type="checkbox" checked={selected.has(s.id)} onClick={e => e.stopPropagation()} onChange={() => toggleSelect(s.id)} style={{ cursor: "pointer", flexShrink: 0 }} />
                  )}
                  <span className={`vl-badge ${s.isUserSubmission ? "vl-badge-warning" : "vl-badge-neutral"}`}>{s.isUserSubmission ? "用户提报" : "抓取"}</span>
                </div>
                <span className={`vl-badge ${STATUS_CN[s.status]?.badge || "vl-badge-neutral"}`}>{STATUS_CN[s.status]?.label || s.status}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.projectName}</div>
              <div style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", marginBottom: 10 }}>{s.city || "—"}{s.district ? ` · ${s.district}` : ""} · {typeLabel(s.propertyType)}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: "var(--bw-text)", fontFamily: "var(--font-mono)" }}>¥{Number(s.netRent).toFixed(1)}</span>
                <span style={{ fontSize: 11, color: "var(--bw-hint)" }}>元/㎡/天</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.isUserSubmission ? s.email : (s.dataSource || "—")} · {s.createdAt ? new Date(s.createdAt).toLocaleDateString("zh-CN") : "—"}
              </div>
              <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => setEditId(s.id)} className="vl-btn-ghost vl-btn-sm" style={{ flex: 1 }}>审核编辑</button>
                {s.status === "PENDING_REVIEW" && (
                  <>
                    <button onClick={() => handleAction(s.id, "APPROVED")} className="vl-btn-primary vl-btn-sm">通过</button>
                    <button onClick={() => handleAction(s.id, "REJECTED")} className="vl-btn-danger vl-btn-sm">驳回</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ============ 表格视图 ============ */
        <div className="vl-table-wrap">
          <table className="vl-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" style={{ cursor: "pointer" }}
                    checked={(() => { const p = filtered.filter(s => s.status === "PENDING_REVIEW"); return p.length > 0 && p.every(s => selected.has(s.id)); })()}
                    onChange={() => {
                      const pending = filtered.filter(s => s.status === "PENDING_REVIEW");
                      setSelected(prev => pending.every(s => prev.has(s.id)) ? new Set() : new Set(pending.map(s => s.id)));
                    }} />
                </th>
                <th>来源</th><th>项目名称</th><th>城市</th>
                <th style={{ textAlign: "right" }}>租金(元/㎡/天)</th><th>业态</th>
                <th>提交人/数据源</th><th>时间</th><th>状态</th>
                <th style={{ width: 170 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ ...(selected.has(s.id) ? { background: "rgba(0,112,243,0.04)" } : {}), cursor: "pointer" }} onClick={() => setEditId(s.id)}>
                  <td onClick={e => e.stopPropagation()}>
                    {s.status === "PENDING_REVIEW" ? (
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: "pointer" }} />
                    ) : null}
                  </td>
                  <td>
                    <span className={`vl-badge ${s.isUserSubmission ? "vl-badge-warning" : "vl-badge-neutral"}`}>
                      {s.isUserSubmission ? "用户提报" : "抓取"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.projectName}</td>
                  <td className="vl-td-muted">{s.city || "—"}{s.district ? ` · ${s.district}` : ""}</td>
                  <td className="vl-td-mono" style={{ textAlign: "right" }}>¥{Number(s.netRent).toFixed(1)}</td>
                  <td><span className="vl-badge vl-badge-neutral">{typeLabel(s.propertyType)}</span></td>
                  <td className="vl-td-hint" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.isUserSubmission ? s.email : (s.dataSource || "—")}</td>
                  <td className="vl-td-hint">{s.createdAt ? new Date(s.createdAt).toLocaleString("zh-CN") : "—"}</td>
                  <td><span className={`vl-badge ${STATUS_CN[s.status]?.badge || "vl-badge-neutral"}`}>{STATUS_CN[s.status]?.label || s.status}</span></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setEditId(s.id)} className="vl-btn-ghost vl-btn-sm">编辑</button>
                      {s.status === "PENDING_REVIEW" && (
                        <>
                          <button onClick={() => handleAction(s.id, "APPROVED")} className="vl-btn-primary vl-btn-sm">通过</button>
                          <button onClick={() => handleAction(s.id, "REJECTED")} className="vl-btn-danger vl-btn-sm">驳回</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editId && (
        <ReviewEditModal
          id={editId}
          onClose={() => setEditId(null)}
          onSaved={() => { fetchData(); }}
          onAction={(action) => { handleAction(editId, action); setEditId(null); }}
        />
      )}
    </div>
  );
}

// ============ 审核编辑弹窗：拉取全部指标，可编辑并保存，可直接通过/驳回 ============
function ReviewEditModal({ id, onClose, onSaved, onAction }: { id: string; onClose: () => void; onSaved: () => void; onAction: (action: "APPROVED" | "REJECTED") => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [status, setStatus] = useState("");
  const [isUserSub, setIsUserSub] = useState(false);
  const [meta, setMeta] = useState({ projectName: "", city: "", district: "", propertyType: "OFFICE", faceRent: 0, dataSource: "", confidenceScore: 0 });
  const [indicators, setIndicators] = useState<Record<string, any>>({});

  useEffect(() => {
    setLoading(true); setErr("");
    fetch(`/api/admin/review-queue/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setErr("未找到该记录，可能已被处理"); setLoading(false); return; }
        setMeta({
          projectName: d.projectName || "",
          city: d.city || "",
          district: d.district || "",
          propertyType: d.propertyType || "OFFICE",
          faceRent: Number(d.faceRent) || 0,
          dataSource: d.dataSource || "",
          confidenceScore: Number(d.confidenceScore) || 0,
        });
        setIndicators((d.dynamicIndicators as any) || {});
        setStatus(d.status || "");
        setIsUserSub(d.dataSource === "USER_SUBMISSION");
        setLoading(false);
      })
      .catch(() => { setErr("加载失败，请检查网络后重试"); setLoading(false); });
  }, [id]);

  const handleSave = async () => {
    setSaving(true); setSavedMsg("");
    try {
      const res = await fetch(`/api/admin/review-queue/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...meta, dynamicIndicators: indicators }),
      });
      const d = await res.json();
      if (d.error) { setSavedMsg("保存失败：" + d.error); }
      else { setSavedMsg("保存成功！"); onSaved(); }
    } catch { setSavedMsg("网络错误"); }
    setSaving(false);
  };

  // 元数据键（下划线前缀，如 _submittedBy）保留只读展示
  const metaEntries = Object.entries(indicators).filter(([k]) => k.startsWith("_"));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      <div onClick={e => e.stopPropagation()}
        style={{ position: "relative", width: "100%", maxWidth: 760, maxHeight: "88vh", overflowY: "auto", background: "var(--bw-surface)", border: "1px solid var(--bw-line)", borderRadius: 14, boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}>
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--bw-surface)", borderBottom: "1px solid var(--bw-line)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 16, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.projectName || "审核编辑"}</p>
            <p style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: "2px 0 0" }}>
              {isUserSub ? "用户提报" : "抓取入队"} · {STATUS_CN[status]?.label || status}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {savedMsg && <span style={{ fontSize: 12, color: savedMsg.includes("成功") ? "#10B981" : "#EE0000", fontFamily: "var(--font-sans)" }}>{savedMsg}</span>}
            <button onClick={onClose} style={{ width: 30, height: 30, border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", color: "var(--bw-muted)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bw-loading" style={{ padding: 48 }}><div className="bw-spin" /><span>加载中</span></div>
        ) : err ? (
          <div style={{ padding: 32, textAlign: "center" }}>
            <p style={{ fontSize: 14, color: "#EE0000", fontFamily: "var(--font-sans)" }}>{err}</p>
          </div>
        ) : (
          <div style={{ padding: 20 }}>
            {/* 基本信息 */}
            <div style={{ background: "var(--bw-bg, transparent)", borderRadius: 10, border: "1px solid var(--bw-line)", padding: 16, marginBottom: 14 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>基本信息</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <Field label="项目名称" value={meta.projectName} onChange={v => setMeta({ ...meta, projectName: v })} />
                <Field label="城市" value={meta.city} onChange={v => setMeta({ ...meta, city: v })} />
                <Field label="区域" value={meta.district} onChange={v => setMeta({ ...meta, district: v })} />
                <div>
                  <label style={lblStyle}>业态</label>
                  <select value={meta.propertyType} onChange={e => setMeta({ ...meta, propertyType: e.target.value })}
                    style={{ ...inputStyle(false), appearance: "auto" }}>
                    {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <Field label="挂牌面价 (元/㎡/天)" mono value={String(meta.faceRent)} onChange={v => setMeta({ ...meta, faceRent: parseFloat(v) || 0 })} />
                <Field label="数据来源" value={meta.dataSource} onChange={v => setMeta({ ...meta, dataSource: v })} />
                <Field label="可信度 (0~1)" mono value={String(meta.confidenceScore)} onChange={v => setMeta({ ...meta, confidenceScore: parseFloat(v) || 0 })} />
              </div>
              {metaEntries.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)" }}>
                  {metaEntries.map(([k, v]) => <span key={k} style={{ marginRight: 12 }}>{k}: {String(v)}</span>)}
                </div>
              )}
            </div>

            {/* 全部指标分组 */}
            {SECTIONS.map(section => (
              <div key={section.key} style={{ borderRadius: 10, border: "1px solid var(--bw-line)", padding: 16, marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>{section.label}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {section.fields.map(f => {
                    const raw = indicators[f.key];
                    const displayVal = raw === undefined || raw === null ? "" : String(raw);
                    return (
                      <div key={f.key}>
                        <label style={lblStyle}>{f.label}{f.unit ? ` (${f.unit})` : ""}</label>
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
                          placeholder="— 留空则不展示"
                          style={inputStyle(!f.text)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer 操作 */}
        {!loading && !err && (
          <div style={{ position: "sticky", bottom: 0, background: "var(--bw-surface)", borderTop: "1px solid var(--bw-line)", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {status === "PENDING_REVIEW" && (
                <>
                  <button onClick={() => onAction("APPROVED")} className="vl-btn-primary vl-btn-sm">通过</button>
                  <button onClick={() => onAction("REJECTED")} className="vl-btn-danger vl-btn-sm">驳回</button>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={onClose} className="vl-btn-ghost vl-btn-sm">关闭</button>
              <button onClick={handleSave} disabled={saving}
                style={{ padding: "7px 18px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                {saving ? "保存中..." : "保存修改"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const lblStyle: React.CSSProperties = { fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" };
const inputStyle = (mono: boolean): React.CSSProperties => ({ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: mono ? "var(--font-mono)" : "var(--font-sans)", outline: "none", boxSizing: "border-box", background: "var(--bw-surface)", color: "var(--bw-text)" });

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (v: string) => void; mono?: boolean }) {
  return (
    <div>
      <label style={lblStyle}>{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} style={inputStyle(!!mono)} />
    </div>
  );
}
