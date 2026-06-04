// app/admin/pipeline-log/page.tsx — DESIGN.md with real data
"use client";

import { useState, useEffect } from "react";

interface LogEntry {
  id: string; label: string; targetUrl: string;
  lastRunAt: string | null; lastRunStatus: string;
  lastRunError: string | null; lastPipelineCount: number;
}

export default function PipelineLogPage() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/agent/schedule").then(r => r.json()).then(data => {
      setEntries(Array.isArray(data) ? data.filter((d: any) => d.lastRunAt) : []);
    }).finally(() => setLoading(false));
  }, []);

  const successCount = entries.filter(e => e.lastRunStatus === "SUCCESS").length;
  const failCount = entries.filter(e => e.lastRunStatus === "FAILED").length;
  const totalListings = entries.reduce((s, e) => s + (e.lastPipelineCount || 0), 0);

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">管线日志</h1>
        <p className="admin-page-desc">
          Agent 爬取管线运行历史 · 成功 {successCount} / 失败 {failCount} · 累计 {totalListings} 条房源
        </p>
      </div>

      {loading ? (
        <p style={{ fontSize: 14, color: "#64748d" }}>加载中...</p>
      ) : entries.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", border: "1px solid #e5edf5", borderRadius: 6 }}>
          <p style={{ fontSize: 16, color: "#64748d" }}>暂无运行记录</p>
          <p style={{ fontSize: 13, color: "#64748d" }}>触发全量抓取后，运行记录将显示在此处</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>站点</th>
                <th style={{ textAlign: "center" }}>状态</th>
                <th style={{ textAlign: "right" }}>产量(条)</th>
                <th>运行时间</th>
                <th>错误信息</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(e => (
                <tr key={e.id}>
                  <td style={{ fontWeight: 500 }}>{e.label}</td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{
                      display: "inline-block", padding: "1px 8px", borderRadius: 4, fontSize: 10,
                      background: e.lastRunStatus === "SUCCESS" ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.08)",
                      color: e.lastRunStatus === "SUCCESS" ? "#059669" : "#dc2626",
                    }}>{e.lastRunStatus}</span>
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{e.lastPipelineCount || 0}</td>
                  <td className="str-td-hint">{e.lastRunAt ? new Date(e.lastRunAt).toLocaleString("zh-CN") : "—"}</td>
                  <td className="str-td-hint" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.lastRunError || "—"}
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
