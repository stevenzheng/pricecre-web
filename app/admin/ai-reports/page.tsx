"use client";

import { useState, useEffect } from "react";

export default function AIReportsAdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState("");

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-reports");
      const data = await res.json();
      setReports(data.reports || []);
    } catch {}
    setLoading(false);
  };

  const showContent = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setExpandedContent(""); return; }
    try {
      const res = await fetch(`/api/ai/get-report?id=${id}`);
      const d = await res.json();
      setExpandedContent(d.content || "");
      setExpandedId(id);
    } catch {}
  };

  return (
    <div style={{ maxWidth: 960, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "#171717", margin: 0 }}>AI 分析报告管理</h2>
        <button onClick={loadReports} disabled={loading}
          style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", fontSize: 13, cursor: "pointer" }}>
          {loading ? "加载中..." : "刷新列表"}
        </button>
      </div>

      {reports.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#A3A3A3" }}>暂无报告。请在资产卡片中运行 AI 精算分析。</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {reports.map((r: any) => (
          <div key={r.id}>
            <div onClick={() => showContent(r.id)}
              style={{ padding: "12px 16px", background: expandedId === r.id ? "rgba(37,99,235,0.04)" : "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#171717" }}>{r.projectName}</div>
                <div style={{ fontSize: 12, color: "#737373", marginTop: 2 }}>
                  {r.city} · {r.email || "—"} · {new Date(r.createdAt).toLocaleString("zh-CN")}
                </div>
                {r.summary && <div style={{ fontSize: 11, color: "#2563EB", marginTop: 2 }}>{r.summary}</div>}
              </div>
              <span style={{ fontSize: 11, color: "#A3A3A3" }}>{expandedId === r.id ? "收起" : "查看"}</span>
            </div>
            {expandedId === r.id && (
              <div style={{ marginTop: 4, padding: "12px 16px", background: "#FAFAFA", borderRadius: 8, border: "1px solid #F0F0F0", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, maxHeight: 400, overflow: "auto" }}>
                {expandedContent || "加载中..."}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
