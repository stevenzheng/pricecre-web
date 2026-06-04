// app/admin/page.tsx — DESIGN.md Blue-Adapted Dashboard Overview
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminOverview() {
  const [stats, setStats] = useState([
    { label: "资产总数", value: "—", href: "/admin/data-review", accent: "#059669" },
    { label: "覆盖城市", value: "—", href: "/admin/data-review", accent: "#2563EB" },
    { label: "注册用户", value: "—", href: "/admin/data-review", accent: "#2563EB" },
    { label: "待审核", value: "—", href: "/admin/data-review", accent: "#D97706" },
  ]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats([
          { label: "资产总数", value: String(d.propertyCount ?? "—"), href: "/admin/data-review", accent: "#059669" },
          { label: "覆盖城市", value: String(d.cityCount ?? "—"), href: "/admin/data-review", accent: "#2563EB" },
          { label: "注册用户", value: String(d.userCount ?? "—"), href: "/admin/data-review", accent: "#2563EB" },
          { label: "待审核", value: String(d.pendingCount ?? "—"), href: "/admin/data-review", accent: "#D97706" },
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">管理概览</h1>
        <p className="admin-page-desc">数据治理中心 &mdash; 审核队列、爬取计划、管线运行状态</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12, marginBottom: 32 }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} style={{ textDecoration: "none" }}>
            <div
              style={{
                background: "#ffffff", border: "1px solid #e5edf5", borderRadius: 6,
                padding: "20px", boxShadow: "rgba(23,23,23,0.06) 0px 3px 6px",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93c5fd")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5edf5")}
            >
              <p style={{ fontSize: 11, fontWeight: 400, color: "#64748d", letterSpacing: "0.1px", margin: 0 }}>{s.label}</p>
              <p style={{
                fontSize: 24, fontWeight: 500, color: "#1A1A2E", margin: "4px 0 0",
                fontFamily: '"Geist Mono", SF Mono, ui-monospace, monospace',
                fontFeatureSettings: '"tnum"', letterSpacing: "-0.36px",
              }}>
                {s.value}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Entries */}
      <h2 style={{ fontSize: 18, fontWeight: 500, color: "#1A1A2E", letterSpacing: "-0.18px", margin: "0 0 16px" }}>快速入口</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        <QuickCard href="/admin/data-review" title="审核队列" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>} desc="查看管线产出的待审资产，逐项审核、编辑47项指标" />
        <QuickCard href="/admin/crawl-schedule" title="爬取计划" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>} desc="管理四大平台爬取目标，一键全量抓取13个站点" />
        <QuickCard href="/admin/pipeline-log" title="管线日志" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>} desc="查看每次管线运行结果、产出的资产数量和异常信息" />
      </div>
    </div>
  );
}

function QuickCard({ href, title, icon, desc }: { href: string; title: string; icon: React.ReactNode; desc: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{
          background: "#ffffff", border: "1px solid #e5edf5", borderRadius: 6, padding: 16,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93c5fd")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e5edf5")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {icon}
          <div>
            <p style={{ fontSize: 16, fontWeight: 500, color: "#1A1A2E", margin: 0 }}>{title}</p>
            <p style={{ fontSize: 14, fontWeight: 400, color: "#64748d", margin: "2px 0 0", lineHeight: 1.5 }}>{desc}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
