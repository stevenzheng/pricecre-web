"use client";
import { useState, useEffect } from "react";

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "待审核" },
  APPROVED: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已采纳" },
  REJECTED: { bg: "#F7F7F7", text: "#737373", label: "已驳回" },
};

export default function CorrectionsPage() {
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/corrections");
      const d = await res.json();
      setCorrections(d.corrections || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/corrections", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) { setMsg(action === "approve" ? "已采纳" : "已驳回"); fetchData(); }
    } catch { setMsg("操作失败"); }
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header">
        <h1 className="vl-page-title">字段纠错管理</h1>
        <p className="vl-page-desc">{corrections.length} 条纠错记录</p>
      </div>
      {msg && <div style={{ marginBottom: 12, padding: "8px 16px", borderRadius: 6, background: "rgba(0,112,243,0.08)", color: "#0070F3", fontSize: 13, cursor: "pointer" }} onClick={() => setMsg("")}>{msg}</div>}

      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : corrections.length === 0 ? (
        <div className="vl-empty"><p className="vl-empty-title">暂无纠错记录</p></div>
      ) : (
        <div className="vl-table-wrap">
          <table className="vl-table">
            <thead>
              <tr>
                <th style={{ minWidth: 100 }}>资产/字段</th>
                <th>原值</th>
                <th>建议值</th>
                <th>提报人</th>
                <th>时间</th>
                <th>状态</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {corrections.map(c => {
                const sc = statusColors[c.status] || statusColors.PENDING;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>{c.fieldLabel || c.fieldKey}</div>
                      <div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-mono)" }}>{c.propertyId?.substring(0, 8)}</div>
                    </td>
                    <td><span style={{ color: "#EE0000", textDecoration: "line-through", fontSize: 12 }}>{c.oldValue}</span></td>
                    <td><span style={{ color: "#0D9488", fontWeight: 600, fontSize: 12 }}>{c.newValue}</span></td>
                    <td style={{ fontSize: 11, color: "#737373" }}>{c.submittedBy || "—"}</td>
                    <td style={{ fontSize: 11, color: "#A3A3A3", whiteSpace: "nowrap" }}>{new Date(c.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 500, background: sc.bg, color: sc.text }}>{sc.label}</span></td>
                    <td>
                      {c.status === "PENDING" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => handleAction(c.id, "approve")} style={{ padding: "3px 10px", borderRadius: 4, border: "none", background: "#0070F3", color: "#FFF", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>采纳</button>
                          <button onClick={() => handleAction(c.id, "reject")} style={{ padding: "3px 10px", borderRadius: 4, border: "1px solid #E5E5E5", background: "#FFF", color: "#737373", fontSize: 11, cursor: "pointer" }}>驳回</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
