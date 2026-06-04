// app/admin/layout.tsx — 除登录页外所有管理页的侧边栏布局
import type { Metadata } from "next";
import "../globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "PriceCRE Admin · 数据管理中心",
  robots: "noindex, nofollow",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      <aside className="w-52 shrink-0 border-r flex flex-col" style={{ background: "var(--bg-surface)", borderColor: "var(--line)" }}>
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <Link href="/admin" className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>PriceCRE Admin</Link>
          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>数据管理中心</p>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          <NavLink href="/admin" label="概览" />
          <NavLink href="/admin/data-review" label="审核队列" />
          <NavLink href="/admin/crawl-schedule" label="爬取计划" />
          <NavLink href="/admin/pipeline-log" label="管线日志" />
        </nav>
        <div className="px-3 py-3 border-t space-y-1" style={{ borderColor: "var(--line)" }}>
          <Link href="/" className="block text-xs px-2 py-1.5 rounded-sm" style={{ color: "var(--text-muted)" }}>← 返回前台</Link>
          <form action="/api/auth/signout" method="POST">
            <button className="block w-full text-left text-xs px-2 py-1.5 rounded-sm" style={{ color: "var(--text-muted)" }}>退出登录</button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md" style={{ color: "var(--text-muted)" }}>
      {label}
    </Link>
  );
}
