// app/admin/pipeline-log/page.tsx — Stripe-Adapted Pipeline Log
"use client";

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

const mockRuns: PipelineRun[] = [];

const statusBadge = (s: PipelineRun["status"]) => {
  switch (s) {
    case "SUCCESS":
      return <span className="str-badge str-badge-success">成功 Success</span>;
    case "FAILED":
      return <span className="str-badge str-badge-danger">失败 Failed</span>;
    case "RUNNING":
      return <span className="str-badge str-badge-accent">运行中 Running</span>;
  }
};

const statusDot = (s: PipelineRun["status"]) => {
  switch (s) {
    case "SUCCESS":
      return <span className="str-status-dot str-status-dot-active" />;
    case "FAILED":
      return <span className="str-status-dot str-status-dot-error" />;
    case "RUNNING":
      return (
        <span
          className="str-status-dot"
          style={{
            background: "#2563EB",
            animation: "str-pulse 1.5s ease-in-out infinite",
          }}
        />
      );
  }
};

type FilterStatus = PipelineRun["status"] | "all";
const filters: { label: string; value: FilterStatus }[] = [
  { label: "全部 All", value: "all" },
  { label: "成功 Success", value: "SUCCESS" },
  { label: "失败 Failed", value: "FAILED" },
  { label: "运行中 Running", value: "RUNNING" },
];

export default function PipelineLogPage() {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filtered =
    filter === "all" ? mockRuns : mockRuns.filter((r) => r.status === filter);

  return (
    <div className="admin-content-inner">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">管线运行日志</h1>
        <p className="admin-page-desc">
          ScheduledCrawlJob 执行记录 — 监控每次管线运行的结果与产量
        </p>
      </div>

      {/* Stats Summary (when data exists) */}
      {mockRuns.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <div className="str-stat-card">
            <p className="str-stat-label">总运行次数</p>
            <p className="str-stat-value">{mockRuns.length}</p>
          </div>
          <div className="str-stat-card">
            <p className="str-stat-label">成功率</p>
            <p className="str-stat-value" style={{ color: "#15be53" }}>
              {mockRuns.filter((r) => r.status === "SUCCESS").length > 0
                ? `${Math.round(
                    (mockRuns.filter((r) => r.status === "SUCCESS").length /
                      mockRuns.length) *
                      100
                  )}%`
                : "—"}
            </p>
          </div>
          <div className="str-stat-card">
            <p className="str-stat-label">处理记录</p>
            <p className="str-stat-value">
              {mockRuns.reduce((s, r) => s + r.recordsProcessed, 0) || "—"}
            </p>
          </div>
          <div className="str-stat-card">
            <p className="str-stat-label">新增资产</p>
            <p className="str-stat-value" style={{ color: "#2563EB" }}>
              {mockRuns.reduce((s, r) => s + r.recordsNew, 0) || "—"}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="str-filter-tabs">
          {filters.map((tab) => (
            <button
              key={tab.value}
              className={`str-filter-tab${filter === tab.value ? " active" : ""}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Log Table or Empty */}
      {filtered.length === 0 ? (
        <div className="str-empty">
          <svg className="str-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <p className="str-empty-title">暂无运行记录</p>
          <p className="str-empty-desc">
            创建爬取计划并触发后，运行记录将显示在此处
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th style={{ width: 32 }} />
                <th>爬取任务</th>
                <th>状态</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th style={{ textAlign: "right" }}>处理记录</th>
                <th style={{ textAlign: "right" }}>新增资产</th>
                <th style={{ textAlign: "right" }}>耗时</th>
                <th>错误信息</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((run) => (
                <tr key={run.id}>
                  <td>{statusDot(run.status)}</td>
                  <td style={{ fontWeight: 400 }}>{run.jobLabel}</td>
                  <td>{statusBadge(run.status)}</td>
                  <td className="str-td-hint">{run.startTime}</td>
                  <td className="str-td-hint">{run.endTime || "—"}</td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    {run.recordsProcessed.toLocaleString()}
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    {run.recordsNew.toLocaleString()}
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    {run.duration || "—"}
                  </td>
                  <td
                    className="str-td-hint"
                    style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {run.error || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Keyframes for running dot */}
      <style>{`
        @keyframes str-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
