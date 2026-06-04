// app/admin/pipeline-log/page.tsx — Ghost Admin Pipeline Log
"use client";

import useSWR from "swr";
import { useState } from "react";

interface PipelineRun {
  id: string;
  jobLabel: string;
  status: "SUCCESS" | "FAILED" | "RUNNING";
  startTime: string;
  endTime: string | null;
  duration: string | null;
  recordsProcessed: number;
  recordsNew: number;
  error: string | null;
}

const STATUS_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "成功", value: "SUCCESS" },
  { label: "失败", value: "FAILED" },
  { label: "运行中", value: "RUNNING" },
] as const;

type FilterStatus = (typeof STATUS_OPTIONS)[number]["value"];

export default function PipelineLogPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const { data: runs = [], isLoading } = useSWR<PipelineRun[]>("/api/agent/schedule", { fallbackData: [] });

  const filtered = filter === "all" ? runs : runs.filter((r) => r.status === filter);

  const statusBadge = (s: PipelineRun["status"]) => {
    switch (s) {
      case "SUCCESS": return <span className="gh-badge gh-badge-success">Success</span>;
      case "FAILED": return <span className="gh-badge gh-badge-danger">Failed</span>;
      case "RUNNING": return <span className="gh-badge gh-badge-accent">Running</span>;
    }
  };

  const statusDot = (s: PipelineRun["status"]) => {
    switch (s) {
      case "SUCCESS": return <span className="gh-dot gh-dot-success" />;
      case "FAILED": return <span className="gh-dot gh-dot-error" />;
      case "RUNNING": return <span className="gh-dot gh-dot-accent" style={{ animation: "gh-pulse 1.5s ease-in-out infinite" }} />;
    }
  };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header">
        <h1 className="gh-page-title">管线运行日志</h1>
        <p className="gh-page-desc">ScheduledCrawlJob 执行记录 — 监控运行结果与产出数量</p>
      </div>

      {/* Summary (when data exists) */}
      {runs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <div className="gh-stat-card">
            <p className="gh-stat-value">{runs.length}</p>
            <p className="gh-stat-label">总运行次数</p>
          </div>
          <div className="gh-stat-card">
            <p className="gh-stat-value" style={{ color: "#30CF43" }}>
              {runs.filter((r) => r.status === "SUCCESS").length > 0
                ? `${Math.round((runs.filter((r) => r.status === "SUCCESS").length / runs.length) * 100)}%`
                : "—"}
            </p>
            <p className="gh-stat-label">成功率</p>
          </div>
          <div className="gh-stat-card">
            <p className="gh-stat-value">{runs.reduce((s, r) => s + r.recordsProcessed, 0) || "—"}</p>
            <p className="gh-stat-label">处理记录</p>
          </div>
          <div className="gh-stat-card">
            <p className="gh-stat-value" style={{ color: "#3EB0EF" }}>{runs.reduce((s, r) => s + r.recordsNew, 0) || "—"}</p>
            <p className="gh-stat-label">新增资产</p>
          </div>
        </div>
      )}

      {/* Filter */}
      <div style={{ marginBottom: 20 }}>
        <div className="gh-filter-tabs">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`gh-filter-tab${filter === opt.value ? " active" : ""}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="gh-card-static" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="gh-skeleton" style={{ height: 48, borderRadius: 6 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="gh-empty">
          <svg className="gh-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
          </svg>
          <p className="gh-empty-title">暂无运行记录</p>
          <p className="gh-empty-desc">创建爬取计划并触发后，运行记录将显示在此处</p>
        </div>
      ) : (
        <div className="gh-table-wrap">
          <table className="gh-table">
            <thead>
              <tr>
                <th style={{ width: 24 }} />
                <th>任务</th>
                <th>状态</th>
                <th>开始</th>
                <th style={{ textAlign: "right" }}>处理</th>
                <th style={{ textAlign: "right" }}>新增</th>
                <th style={{ textAlign: "right" }}>耗时</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr key={run.id}>
                  <td>{statusDot(run.status)}</td>
                  <td style={{ fontWeight: 600 }}>{run.jobLabel}</td>
                  <td>{statusBadge(run.status)}</td>
                  <td className="gh-td-hint">{run.startTime}</td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>{run.recordsProcessed.toLocaleString()}</td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>{run.recordsNew.toLocaleString()}</td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>{run.duration || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@keyframes gh-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
