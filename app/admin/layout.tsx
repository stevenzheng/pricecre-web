// app/admin/layout.tsx
import type { Metadata } from "next";
import "../globals.css";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "PriceCRE Admin · 数据管理中心",
  description: "数据治理管理后台 — 审核队列、爬取计划、管线监控",
  robots: "noindex, nofollow",
};

const ALLOWED_ROLES = ["ADMIN_DATA", "SUPER_ADMIN"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user && ALLOWED_ROLES.includes((session.user as any).role);

  // Login page — render clean, no sidebar
  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <aside className="w-52 shrink-0 border-r flex flex-col" style={{ background: "var(--bg-surface)", borderColor: "var(--line)" }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <Link href="/admin" className="text-sm font-semibold tracking-tight" style={{ color: "var(--text-strong)" }}>
            PriceCRE Admin
          </Link>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>数据管理中心</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <SidebarLink href="/admin" label="概览" icon={IconOverview} />
          <SidebarLink href="/admin/data-review" label="审核队列" icon={IconReview} />
          <SidebarLink href="/admin/crawl-schedule" label="爬取计划" icon={IconSchedule} />
          <SidebarLink href="/admin/pipeline-log" label="管线日志" icon={IconLog} />
        </nav>

        <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: "var(--line)" }}>
          <Link href="/" className="flex items-center gap-1.5 text-xs rounded-sm transition-colors px-2 py-1.5" style={{ color: "var(--text-muted)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            返回前台
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button className="flex items-center gap-1.5 text-xs rounded-sm transition-colors px-2 py-1.5 w-full text-left" style={{ color: "var(--text-muted)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              {session?.user?.email || "Admin"}
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-sm" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>退出</span>
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function SidebarLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors" style={{ color: "var(--text-muted)" }}>
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </Link>
  );
}

function IconOverview({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>;
}
function IconReview({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function IconSchedule({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function IconLog({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;
}
