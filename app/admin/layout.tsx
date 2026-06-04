// app/admin/layout.tsx — Ghost Admin Shell: client-side panel switcher
"use client";

import "../globals.css";
import SWRProvider from "@/lib/swr-config";
import Link from "next/link";
import { useState, useCallback, Suspense, lazy } from "react";

/* ---------- panel component map ---------- */
type Panel = "overview" | "data-review" | "crawl-schedule" | "pipeline-log";

const PANEL_COMPONENTS: Record<Panel, React.LazyExoticComponent<React.ComponentType>> = {
  overview: lazy(() => import("./page")),
  "data-review": lazy(() => import("./data-review/page")),
  "crawl-schedule": lazy(() => import("./crawl-schedule/page")),
  "pipeline-log": lazy(() => import("./pipeline-log/page")),
};

const PANEL_LABELS: Record<Panel, string> = {
  overview: "概览",
  "data-review": "审核队列",
  "crawl-schedule": "爬取计划",
  "pipeline-log": "管线日志",
};

/* ---------- sidebar nav definition ---------- */
const NAV_ITEMS: { panel: Panel; icon: JSX.Element }[] = [
  {
    panel: "overview",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="2" /><rect x="14" y="3" width="7" height="5" rx="2" /><rect x="14" y="12" width="7" height="9" rx="2" /><rect x="3" y="16" width="7" height="5" rx="2" />
      </svg>
    ),
  },
  {
    panel: "data-review",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" /><path d="M8 4H5a2 2 0 00-2 2v12a2 2 0 002 2h3" /><path d="M16 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3" />
      </svg>
    ),
  },
  {
    panel: "crawl-schedule",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    panel: "pipeline-log",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
];

/* ---------- panel loading fallback ---------- */
const PanelSkeleton = () => (
  <div style={{ padding: "40px 48px" }}>
    <div className="gh-skeleton" style={{ width: 200, height: 24, marginBottom: 12 }} />
    <div className="gh-skeleton" style={{ width: 320, height: 16 }} />
  </div>
);

/* ---------- main layout ---------- */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  /*
   * If the React tree originated from a hard navigation (e.g. visiting
   * /admin/login directly), children will be an actual React element —
   * in that case we render them as-is so the login page still works.
   *
   * After the user logs in and the sidebar mounts for the first time,
   * this layout captures the active panel in useState and all subsequent
   * "navigations" are just local state transitions — zero network
   * requests, zero route changes, instant panel swap.
   */
  const [activePanel, setActivePanel] = useState<Panel | null>(null);

  const switchTo = useCallback((panel: Panel) => setActivePanel(panel), []);

  const PanelComponent = activePanel ? PANEL_COMPONENTS[activePanel] : null;

  return (
    <SWRProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        {/* ---- Sidebar ---- */}
        <aside className="gh-sidebar">
          {/* Brand */}
          <div className="gh-sidebar-brand">
            <Link href="/admin" onClick={() => setActivePanel("overview")} style={{ textDecoration: "none", display: "block" }}>
              <div className="gh-sidebar-logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
              </div>
              <h2 className="gh-sidebar-title">PriceCRE</h2>
              <p className="gh-sidebar-subtitle">数据管理中心</p>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="gh-sidebar-nav">
            <div className="gh-nav-label">管理</div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.panel}
                className={`gh-nav-item${activePanel === item.panel ? " active" : ""}`}
                onClick={() => switchTo(item.panel)}
                onMouseEnter={() => {
                  (PANEL_COMPONENTS[item.panel] as any).preload?.();
                }}
              >
                {item.icon}
                <span>{PANEL_LABELS[item.panel]}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="gh-sidebar-footer">
            <Link href="/" className="gh-sidebar-footer-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>返回前台</span>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="gh-sidebar-footer-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span>退出</span>
              </button>
            </form>
          </div>
        </aside>

        {/* ---- Content ---- */}
        <main className="gh-content">
          {PanelComponent ? (
            <Suspense fallback={<PanelSkeleton />}>
              <PanelComponent />
            </Suspense>
          ) : (
            children
          )}
        </main>
      </div>
    </SWRProvider>
  );
}
