// app/admin/page.tsx — Stripe-Adapted Dashboard Overview
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function AdminOverview() {
  const [stats, setStats] = useState([
    { label: "资产总数", value: "—", href: "/admin/data-review", accent: "#533afd" },
    { label: "覆盖城市", value: "—", href: "/admin/data-review", accent: "#15be53" },
    { label: "注册用户", value: "—", href: "/admin/data-review", accent: "#533afd" },
    { label: "管线条目", value: "—", href: "/admin/pipeline-log", accent: "#dc2626" },
  ]);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        setStats([
          { label: "资产总数", value: String(d.propertyCount ?? "—"), href: "/admin/data-review", accent: "#533afd" },
          { label: "覆盖城市", value: String(d.cityCount ?? "—"), href: "/admin/data-review", accent: "#15be53" },
          { label: "注册用户", value: String(d.userCount ?? "—"), href: "/admin/data-review", accent: "#533afd" },
          { label: "管线条目", value: "—", href: "/admin/pipeline-log", accent: "#dc2626" },
        ]);
      })
      .catch(() => {});
  }, []);

  const quickCards = [
    {
      href: "/admin/data-review",
      title: "审核队列",
      desc: "查看 Agent 管线产出的待审资产，逐项审核或批量操作，确保数据质量",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#533afd" strokeWidth="1.5">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      href: "/admin/crawl-schedule",
      title: "爬取计划",
      desc: "创建和管理定时抓取任务，按城市与业态自动化调度数据采集",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#533afd" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      ),
    },
    {
      href: "/admin/pipeline-log",
      title: "管线日志",
      desc: "查看每次管线运行的结果、产量和异常信息，监控数据健康",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#533afd" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-content-inner">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">管理概览</h1>
        <p className="admin-page-desc">
          Data Governance Center — 审核队列、爬取计划、管线运行状态
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 40,
        }}
      >
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="str-stat-card"
            style={{ textDecoration: "none" }}
          >
            <p className="str-stat-label">{s.label}</p>
            <p className="str-stat-value">{s.value}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 12 }}>
        <h2
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 16,
            fontWeight: 300,
            color: "#061b31",
            margin: "0 0 4px",
          }}
        >
          快速入口
        </h2>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 300,
            color: "#64748d",
            margin: 0,
          }}
        >
          常用管理功能直达
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
        }}
      >
        {quickCards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="str-quick-card"
          >
            <div style={{ marginBottom: 10 }}>{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
          </Link>
        ))}
      </div>

      {/* Responsive: 2-col stats on tablet */}
      <style>{`
        @media (max-width: 1023px) {
          .str-stat-card { --cols: 2; }
        }
        @media (max-width: 639px) {
          .str-stat-card { --cols: 1; }
        }
      `}</style>
    </div>
  );
}
