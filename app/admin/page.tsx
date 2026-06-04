// app/admin/page.tsx — Ghost Dashboard Overview
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ propertyCount: "—", cityCount: "—", userCount: "—", pendingCount: "—" });
  useEffect(() => { fetch("/api/admin/stats").then(r => r.json()).then(d => setStats({ propertyCount: String(d.propertyCount ?? "—"), cityCount: String(d.cityCount ?? "—"), userCount: String(d.userCount ?? "—"), pendingCount: String(d.pendingCount ?? "—") })).catch(() => {}); }, []);

  const StatCard = ({ label, value, accent }: { label: string; value: string; accent: string }) => (
    <div className="gh-card" style={{ borderColor: "transparent" }}>
      <p style={{ fontSize: 11, fontWeight: 500, color: "#738A94", textTransform: "uppercase", letterSpacing: "0.3px", margin: "0 0 8px" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, color: "#15171A", margin: 0, fontFeatureSettings: '"tnum"', lineHeight: 1 }}>{value}</p>
    </div>
  );

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header"><h1 className="gh-page-title">概览</h1><p className="gh-page-desc">数据治理中心 &mdash; 资产、审核、爬取状态一览</p></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12, marginBottom: 32 }}>
        <StatCard label="生产资产" value={stats.propertyCount} accent="#30CF43" />
        <StatCard label="覆盖城市" value={stats.cityCount} accent="#3EB0EF" />
        <StatCard label="注册用户" value={stats.userCount} accent="#3EB0EF" />
        <StatCard label="待审核" value={stats.pendingCount} accent="#F0A830" />
      </div>

      <h2 style={{ fontSize: 15, fontWeight: 600, color: "#15171A", margin: "0 0 12px" }}>快速入口</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {[
          { href: "/admin/data-review", title: "资产数据", desc: "生产数据 & 审核队列，编辑47项指标" },
          { href: "/admin/crawl-schedule", title: "爬取计划", desc: "13个爬取目标，一键全量抓取" },
          { href: "/admin/data-sources", title: "数据源", desc: "22个数据采集源，启用/停用管理" },
        ].map(c => (
          <Link key={c.href} href={c.href} style={{ textDecoration: "none" }}>
            <div className="gh-card" style={{ transition: "border-color 0.15s", cursor: "pointer" }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#15171A", margin: 0 }}>{c.title}</p>
              <p style={{ fontSize: 13, fontWeight: 400, color: "#738A94", margin: "4px 0 0", lineHeight: 1.5 }}>{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
