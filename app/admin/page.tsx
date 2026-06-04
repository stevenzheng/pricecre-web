// app/admin/page.tsx — Ghost Admin Dashboard
"use client";

import useSWR from "swr";
import Link from "next/link";

interface DashboardStats {
  propertyCount?: number;
  pendingReview?: number;
  activeCrawlJobs?: number;
  pipelineRuns?: number;
  userCount?: number;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useSWR<DashboardStats>("/api/agent/schedule", {
    fallbackData: {},
    revalidateOnMount: true,
  });

  const s = stats || {};

  const cards = [
    { label: "资产总数", value: s.propertyCount ?? "—", desc: "Assets" },
    { label: "待审核", value: s.pendingReview ?? "—", desc: "Pending Review", accent: s.pendingReview ? true : false },
    { label: "爬取计划", value: s.activeCrawlJobs ?? "—", desc: "Active Jobs" },
    { label: "管线运行", value: s.pipelineRuns ?? "—", desc: "Pipeline Runs" },
  ];

  const quickLinks = [
    {
      title: "审核队列",
      desc: "审核管线产出的待审资产数据",
      panel: "data-review",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 12l2 2 4-4"/><path d="M8 4H5a2 2 0 00-2 2v12a2 2 0 002 2h3"/><path d="M16 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3"/></svg>,
    },
    {
      title: "爬取计划",
      desc: "管理目标站点与数据采集调度",
      panel: "crawl-schedule",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42"/></svg>,
    },
    {
      title: "管线日志",
      desc: "查看每次管线执行的运行记录",
      panel: "pipeline-log",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    },
  ];

  return (
    <div className="gh-content-inner">
      {/* Header */}
      <div className="gh-page-header">
        <h1 className="gh-page-title">管理概览</h1>
        <p className="gh-page-desc">PriceCRE 数据治理中心 — 监控资产、审核、爬取与管线运行状态</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
        {cards.map((card) => (
          <div key={card.label} className="gh-stat-card" style={card.accent ? { borderColor: "rgba(62,176,239,0.3)" } : undefined}>
            {isLoading ? (
              <>
                <div className="gh-skeleton" style={{ width: 60, height: 28 }} />
                <div className="gh-skeleton" style={{ width: 80, height: 11, marginTop: 8 }} />
              </>
            ) : (
              <>
                <p className="gh-stat-value">{card.value}</p>
                <p className="gh-stat-label">{card.label}</p>
                <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 400, color: "#A5B4BF", margin: "2px 0 0" }}>{card.desc}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "#15171A", margin: "0 0 16px" }}>快速入口</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={`/admin`}
              onClick={(e) => {
                e.preventDefault();
                const btn = document.querySelector(`.gh-nav-item[data-panel="${link.panel}"]`) as HTMLButtonElement;
                btn?.click();
              }}
              className="gh-quick-card"
            >
              <div className="gh-quick-card-icon">{link.icon}</div>
              <div>
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
