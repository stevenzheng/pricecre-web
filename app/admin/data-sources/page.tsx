// app/admin/data-sources/page.tsx — Ghost Admin Data Sources
"use client";

import { useState, useEffect } from "react";

interface DataSource {
  id: string; label: string; targetUrl: string;
  propertyType: string; city: string; district: string;
  isActive: boolean; lastRunAt: string | null;
  lastRunStatus: string; lastPipelineCount: number; lastRunError?: string;
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
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    fetchSources();
  };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header">
        <h1 className="gh-page-title">数据源管理</h1>
        <p className="gh-page-desc">
          {sources.length} 个数据源 · {sources.filter(s => s.isActive).length} 活跃 · 累计产出 {sources.reduce((s, x) => s + (x.lastPipelineCount || 0), 0)} 条
        </p>
      </div>

      {loading ? (
        <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div>
      ) : sources.length === 0 ? (
        <div className="gh-empty">
          <p className="gh-empty-title">暂无数据源</p>
          <p className="gh-empty-desc">前往「爬取计划」添加数据源</p>
        </div>
      ) : (
        <div className="gh-table-wrap">
          <table className="gh-table">
            <thead>
              <tr>
                <th>站点名称</th>
                <th>URL</th>
                <th>业态</th>
                <th>城市</th>
                <th>状态</th>
                <th style={{ textAlign: "right" }}>产量</th>
                <th>最近运行</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.label}</td>
                  <td className="gh-td-hint" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.targetUrl}
                  </td>
                  <td><span className="gh-badge gh-badge-neutral">{typeLabel[s.propertyType] || s.propertyType}</span></td>
                  <td className="gh-td-muted">{s.city} · {s.district}</td>
                  <td>
                    <span className={`gh-badge ${s.isActive ? "gh-badge-success" : "gh-badge-neutral"}`}>
                      {s.isActive ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>{s.lastPipelineCount || 0}</td>
                  <td className="gh-td-hint">
                    {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString("zh-CN") : "—"}
                  </td>
                  <td>
                    <button onClick={() => toggleActive(s)} className={`gh-btn-text gh-btn-sm`}
                      style={{ color: s.isActive ? "#E64C4C" : "#30CF43" }}>
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
