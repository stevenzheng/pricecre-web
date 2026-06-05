// app/admin/submissions/page.tsx — Ghost Admin Submissions Review
"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string; projectName: string; email: string; city: string;
  netRent: number; propertyType: string; status: string; createdAt: string;
}

const STATUS_CN: Record<string, { label: string; badge: string }> = {
  PENDING_REVIEW: { label: "待审核", badge: "gh-badge-warning" },
  APPROVED: { label: "已通过", badge: "gh-badge-success" },
  REJECTED: { label: "已驳回", badge: "gh-badge-danger" },
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch("/api/admin/submissions"); const data = await res.json(); setSubmissions(data.submissions || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    await fetch("/api/admin/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ submissionId: id, action }) });
    fetchData();
  };

  const filtered = filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header">
        <h1 className="gh-page-title">租金核验队列</h1>
        <p className="gh-page-desc">用户提交的租金成交数据 · {submissions.length} 条记录</p>
      </div>

      <div className="gh-action-bar">
        <div className="gh-filter-tabs">
          {(["all", "PENDING_REVIEW", "APPROVED", "REJECTED"] as const).map((s) => (
            <button key={s} className={`gh-filter-tab${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? "全部" : STATUS_CN[s]?.label || s}
            </button>
          ))}
        </div>
        <button onClick={fetchData} className="gh-btn-text">刷新</button>
      </div>

      {loading ? (
        <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div>
      ) : filtered.length === 0 ? (
        <div className="gh-empty">
          <p className="gh-empty-title">暂无提交</p>
          <p className="gh-empty-desc">还没有用户提交租金数据</p>
        </div>
      ) : (
        <div className="gh-table-wrap">
          <table className="gh-table">
            <thead>
              <tr>
                <th>项目名称</th><th>城市</th>
                <th style={{ textAlign: "right" }}>租金(元/㎡)</th><th>业态</th>
                <th>提交邮箱</th><th>提交时间</th><th>状态</th>
                <th style={{ width: 130 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.projectName}</td>
                  <td className="gh-td-muted">{s.city || "—"}</td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>¥{Number(s.netRent).toFixed(1)}</td>
                  <td><span className="gh-badge gh-badge-neutral">{s.propertyType === "OFFICE" ? "写字楼" : s.propertyType === "SHOPS" ? "商业" : s.propertyType === "INDUSTRIAL" ? "产业园" : s.propertyType || "—"}</span></td>
                  <td className="gh-td-hint">{s.email}</td>
                  <td className="gh-td-hint">{s.createdAt ? new Date(s.createdAt).toLocaleString("zh-CN") : "—"}</td>
                  <td><span className={`gh-badge ${STATUS_CN[s.status]?.badge || "gh-badge-neutral"}`}>{STATUS_CN[s.status]?.label || s.status}</span></td>
                  <td>
                    {s.status === "PENDING_REVIEW" ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => handleAction(s.id, "APPROVED")} className="gh-btn-primary gh-btn-sm">通过</button>
                        <button onClick={() => handleAction(s.id, "REJECTED")} className="gh-btn-danger gh-btn-sm">驳回</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "#A5B4BF" }}>{s.status === "APPROVED" ? "已发码" : "已驳回"}</span>
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
