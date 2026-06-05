// app/admin/data-sources/page.tsx — Crawl Source Manager
"use client";

import { useState, useEffect } from "react";

interface DataSource {
  id: string;
  label: string;
  targetUrl: string;
  propertyType: string;
  city: string;
  district: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string;
  lastPipelineCount: number;
  lastRunError?: string;
}

const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/schedule");
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch { setSources([]); }
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, []);

  const toggleActive = async (s: DataSource) => {
    await fetch(`/api/agent/schedule/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    fetchSources();
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">数据源管理</h1>
        <p className="admin-page-desc">
          {sources.length} 个数据源 · {sources.filter(s => s.isActive).length} 活跃 · 
          累计产出 {sources.reduce((s, x) => s + (x.lastPipelineCount || 0), 0)} 条
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>加载中...</div>
      ) : sources.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>
          <p style={{ fontSize: 16, marginBottom: 4 }}>暂无数据源</p>
          <p style={{ fontSize: 13 }}>前往「爬取计划」添加数据源</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>站点名称</th>
                <th>URL</th>
                <th>业态</th>
                <th>城市</th>
                <th>状态</th>
                <th style={{ textAlign: "right" }}>产量</th>
                <th>最近运行</th>
                <th style={{ width: 80 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 400 }}>{s.label}</td>
                  <td className="str-td-hint" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.targetUrl}
                  </td>
                  <td>{typeLabel[s.propertyType] || s.propertyType}</td>
                  <td>{s.city} · {s.district}</td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 500,
                      color: s.isActive ? "#10b981" : "#64748d",
                    }}>
                      {s.isActive ? "活跃" : "停用"}
                    </span>
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    {s.lastPipelineCount || 0}
                  </td>
                  <td className="str-td-hint">
                    {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString("zh-CN") : "未运行"}
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(s)}
                      style={{
                        padding: "4px 10px", borderRadius: 5, border: "1px solid",
                        borderColor: s.isActive ? "#ef4444" : "#10b981",
                        background: s.isActive ? "#fef2f2" : "#ecfdf5",
                        color: s.isActive ? "#ef4444" : "#10b981",
                        fontSize: 11, cursor: "pointer",
                      }}
                    >
                      {s.isActive ? "停用" : "启用"}
                    </button>
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
