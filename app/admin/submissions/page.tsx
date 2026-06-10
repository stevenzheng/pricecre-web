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

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING_REVIEW");
  const [msg, setMsg] = useState("");

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

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header">
        <h1 className="vl-page-title">租金核验队列</h1>
        <p className="vl-page-desc">用户提报 + 抓取入队数据统一审核 · {submissions.length} 条 · 待审 {submissions.filter(s => s.status === "PENDING_REVIEW").length} 条</p>
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
        <button onClick={fetchData} className="vl-btn-ghost">刷新</button>
      </div>

      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : filtered.length === 0 ? (
        <div className="vl-empty">
          <p className="vl-empty-title">暂无提交</p>
          <p className="vl-empty-desc">还没有用户提交租金数据</p>
        </div>
      ) : (
        <div className="vl-table-wrap">
          <table className="vl-table">
            <thead>
              <tr>
                <th>来源</th><th>项目名称</th><th>城市</th>
                <th style={{ textAlign: "right" }}>租金(元/㎡/天)</th><th>业态</th>
                <th>提交人/数据源</th><th>时间</th><th>状态</th>
                <th style={{ width: 130 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className={`vl-badge ${s.isUserSubmission ? "vl-badge-warning" : "vl-badge-neutral"}`}>
                      {s.isUserSubmission ? "用户提报" : "抓取"}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{s.projectName}</td>
                  <td className="vl-td-muted">{s.city || "—"}{s.district ? ` · ${s.district}` : ""}</td>
                  <td className="vl-td-mono" style={{ textAlign: "right" }}>¥{Number(s.netRent).toFixed(1)}</td>
                  <td><span className="vl-badge vl-badge-neutral">{s.propertyType === "OFFICE" ? "写字楼" : s.propertyType === "SHOPS" ? "商业" : s.propertyType === "INDUSTRIAL" ? "产业园" : s.propertyType || "—"}</span></td>
                  <td className="vl-td-hint" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.isUserSubmission ? s.email : (s.dataSource || "—")}</td>
                  <td className="vl-td-hint">{s.createdAt ? new Date(s.createdAt).toLocaleString("zh-CN") : "—"}</td>
                  <td><span className={`vl-badge ${STATUS_CN[s.status]?.badge || "vl-badge-neutral"}`}>{STATUS_CN[s.status]?.label || s.status}</span></td>
                  <td>
                    {s.status === "PENDING_REVIEW" ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleAction(s.id, "APPROVED")} className="vl-btn-primary vl-btn-sm">通过</button>
                        <button onClick={() => handleAction(s.id, "REJECTED")} className="vl-btn-danger vl-btn-sm">驳回</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--bw-hint)" }}>{s.status === "APPROVED" ? (s.isUserSubmission ? "已发码" : "已并入主表") : "已驳回"}</span>
                    )}
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
