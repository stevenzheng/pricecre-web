"use client";

import { useState, useEffect } from "react";

const typeZh: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };

export default function AIReportsAdminPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState("");
  const [filterCity, setFilterCity] = useState("全部");
  const [filterType, setFilterType] = useState("全部");

  const filteredReports = reports.filter((r: any) => {
    if (filterCity !== "全部" && String(r.city || "") !== filterCity) return false;
    if (filterType !== "全部" && String(r.propertyType || "") !== filterType) return false;
    return true;
  });

  useEffect(() => { loadReports(); }, []);

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-reports");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReports(Array.isArray(data.reports) ? data.reports : []);
    } catch {
      setError("报告列表加载失败，请刷新重试");
      setReports([]);
    }
    setLoading(false);
  };

  const showContent = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); setExpandedContent(""); return; }
    setExpandedId(id);
    setExpandedContent("");
    try {
      const res = await fetch(`/api/ai/get-report?id=${encodeURIComponent(id)}`);
      const d = await res.json();
      setExpandedContent(typeof d.content === "string" && d.content ? d.content : "（该报告无正文内容）");
    } catch {
      setExpandedContent("内容加载失败");
    }
  };

  const fmtDate = (v: any) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString("zh-CN");
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: "var(--bw-text)", margin: 0 }}>AI 分析报告管理</h2>
        <button onClick={loadReports} disabled={loading}
          style={{ padding: "8px 18px", borderRadius: 6, border: "1px solid var(--bw-line)", background: "var(--bw-surface)", fontSize: 13, cursor: "pointer" }}>
          {loading ? "加载中..." : "刷新列表"}
        </button>
      </div>

      {error && (
        <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, fontSize: 13, background: "rgba(238,0,0,0.06)", color: "#EE0000" }}>{error}</div>
      )}

      {/* 筛选：城市 / 业态 */}
      <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--bw-hint)", width: 30, flexShrink: 0 }}>城市</span>
          {["全部", ...Array.from(new Set(reports.map((r: any) => String(r.city || "")).filter(Boolean)))].map((c) => (
            <button key={c} onClick={() => setFilterCity(c)}
              style={{ padding: "3px 10px", borderRadius: 6, border: filterCity === c ? "1px solid #0070F3" : "1px solid var(--bw-line)", background: filterCity === c ? "rgba(0,112,243,0.06)" : "var(--bw-surface)", color: filterCity === c ? "#0070F3" : "var(--bw-text-2)", fontSize: 12, fontWeight: filterCity === c ? 600 : 400, cursor: "pointer" }}>
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--bw-hint)", width: 30, flexShrink: 0 }}>业态</span>
          {[["全部", "全部"], ["OFFICE", "写字楼"], ["SHOPS", "商业零售"], ["INDUSTRIAL", "产业园"]].map(([k, v]) => (
            <button key={k} onClick={() => setFilterType(k)}
              style={{ padding: "3px 10px", borderRadius: 6, border: filterType === k ? "1px solid #0070F3" : "1px solid var(--bw-line)", background: filterType === k ? "rgba(0,112,243,0.06)" : "var(--bw-surface)", color: filterType === k ? "#0070F3" : "var(--bw-text-2)", fontSize: 12, fontWeight: filterType === k ? 600 : 400, cursor: "pointer" }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {filteredReports.length === 0 && !loading && !error && (
        <div style={{ textAlign: "center", padding: 40, color: "var(--bw-hint)" }}>
          {reports.length === 0 ? "暂无报告。用户在前台资产卡片中生成资产全维度价值指标报告后会显示在此处。" : "当前筛选条件下无报告，调整城市/业态筛选试试。"}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredReports.map((r: any) => (
          <div key={r.id}>
            <div onClick={() => showContent(r.id)}
              style={{ padding: "12px 16px", background: expandedId === r.id ? "rgba(37,99,235,0.04)" : "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--bw-text)" }}>{String(r.projectName || "未命名报告")}</span>
                  {r.city ? <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4, background: "rgba(0,112,243,0.07)", color: "#0070F3" }}>{String(r.city)}</span> : null}
                  {r.district ? <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4, background: "rgba(13,148,136,0.09)", color: "#0D9488" }}>{String(r.district)}</span> : null}
                  {r.propertyType ? <span style={{ fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 4, background: "rgba(124,58,237,0.09)", color: "#7C3AED" }}>{typeZh[String(r.propertyType)] || String(r.propertyType)}</span> : null}
                </div>
                <div style={{ fontSize: 12, color: "var(--bw-muted)", marginTop: 2 }}>
                  {String(r.email || "—")} · {fmtDate(r.createdAt)}
                </div>
                {r.summary ? <div style={{ fontSize: 11, color: "#2563EB", marginTop: 2 }}>{String(r.summary)}</div> : null}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); window.open(`/a/${r.id}?print=1`, "_blank"); }}
                  title="打开打印版报告，在打印对话框中选择「另存为 PDF」"
                  style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, cursor: "pointer" }}>
                  导出PDF
                </button>
                <span style={{ fontSize: 11, color: "var(--bw-hint)" }}>{expandedId === r.id ? "收起" : "查看"}</span>
              </div>
            </div>
            {expandedId === r.id && (
              <div style={{ marginTop: 4, padding: "12px 16px", background: "var(--bw-panel)", borderRadius: 8, border: "1px solid var(--bw-line-soft)", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.7, maxHeight: 400, overflow: "auto" }}>
                {expandedContent || "加载中..."}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
