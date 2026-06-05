// app/admin/submissions/page.tsx — Rent Data Submission Review
"use client";

import { useState, useEffect } from "react";

interface Submission {
  id: string;
  projectName: string;
  email: string;
  city: string;
  netRent: number;
  propertyType: string;
  status: string;
  createdAt: string;
}

const STATUS_CN: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "待审核", color: "#f59e0b" },
  APPROVED: { label: "已通过", color: "#10b981" },
  REJECTED: { label: "已驳回", color: "#ef4444" },
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions");
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: id, action }),
      });
      if (res.ok) fetchData();
    } catch {}
  };

  const filtered = filter === "all"
    ? submissions
    : submissions.filter((s) => s.status === filter);

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">租金核验队列</h1>
        <p className="admin-page-desc">用户提交的租金成交数据 · {submissions.length} 条记录</p>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        {["all", "PENDING_REVIEW", "APPROVED", "REJECTED"].map((s) => (
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
            {s === "all" ? "全部" : STATUS_CN[s]?.label || s}
          </button>
        ))}
        <button
          onClick={fetchData}
          style={{
            marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e4ea",
            background: "#fff", color: "#64748d", fontSize: 12, cursor: "pointer",
          }}
        >刷新</button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>加载中...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>
          <p style={{ fontSize: 16, marginBottom: 4 }}>暂无提交</p>
          <p style={{ fontSize: 13 }}>还没有用户提交租金数据</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>城市</th>
                <th style={{ textAlign: "right" }}>租金(元/㎡)</th>
                <th>业态</th>
                <th>提交邮箱</th>
                <th>提交时间</th>
                <th>状态</th>
                <th style={{ width: 130 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 400 }}>{s.projectName}</td>
                  <td>{s.city || "—"}</td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    ¥{Number(s.netRent).toFixed(1)}
                  </td>
                  <td>{s.propertyType === "OFFICE" ? "写字楼" : s.propertyType === "SHOPS" ? "商业" : s.propertyType === "INDUSTRIAL" ? "产业园" : s.propertyType || "—"}</td>
                  <td className="str-td-hint">{s.email}</td>
                  <td className="str-td-hint">
                    {s.createdAt ? new Date(s.createdAt).toLocaleString("zh-CN") : "—"}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12, fontWeight: 500,
                      color: STATUS_CN[s.status]?.color || "#64748d",
                    }}>
                      {STATUS_CN[s.status]?.label || s.status}
                    </span>
                  </td>
                  <td>
                    {s.status === "PENDING_REVIEW" ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleAction(s.id, "APPROVED")}
                          style={{
                            padding: "4px 10px", borderRadius: 5, border: "none",
                            background: "#10b981", color: "#fff", fontSize: 11, cursor: "pointer",
                          }}
                        >通过</button>
                        <button
                          onClick={() => handleAction(s.id, "REJECTED")}
                          style={{
                            padding: "4px 10px", borderRadius: 5, border: "none",
                            background: "#ef4444", color: "#fff", fontSize: 11, cursor: "pointer",
                          }}
                        >驳回</button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>
                        {s.status === "APPROVED" ? "已发码" : "已驳回"}
                      </span>
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
