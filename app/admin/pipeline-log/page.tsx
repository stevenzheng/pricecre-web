// app/admin/pipeline-log/page.tsx — DESIGN.md Blue-Adapted
"use client";

import { useState, useEffect } from "react";

export default function PipelineLogPage() {
  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">管线日志</h1>
        <p className="admin-page-desc">ScheduledCrawlJob 执行记录</p>
      </div>
      <div style={{ textAlign: "center", padding: 60, background: "#ffffff", border: "1px solid #e5edf5", borderRadius: 6 }}>
        <p style={{ fontSize: 16, color: "#64748d", margin: 0 }}>暂无运行记录</p>
        <p style={{ fontSize: 13, color: "#64748d", margin: "4px 0 0" }}>创建爬取计划并触发后，运行记录将显示在此处</p>
      </div>
    </div>
  );
}
