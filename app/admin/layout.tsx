// app/admin/layout.tsx
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "PriceCRE Admin · 数据管理中心",
  description: "数据治理管理后台 — 审核队列、爬取计划、管线监控",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-52 shrink-0 border-r flex flex-col"
        style={{
          background: "var(--bg-surface)",
          borderColor: "var(--line)",
        }}
      >
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <a href="/admin" className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
            PriceCRE Admin
          </a>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>数据管理中心</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <SidebarLink href="/admin" label="概览" icon={IconOverview} active />
          <SidebarLink href="/admin/data-review" label="审核队列" icon={IconReview} />
          <SidebarLink href="/admin/crawl-schedule" label="爬取计划" icon={IconSchedule} />
          <SidebarLink href="/admin/pipeline-log" label="管线日志" icon={IconLog} />
        </nav>

        <div className="px-3 py-3 border-t" style={{ borderColor: "var(--line)" }}>
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs rounded transition-colors px-2 py-1.5"
            style={{ color: "var(--text-muted)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            返回前台
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
}) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
        active ? "font-medium" : ""
      }`}
      style={{
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
      }}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </a>
  );
}

function IconOverview({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}
function IconReview({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}
function IconSchedule({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconLog({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
