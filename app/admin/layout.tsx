// app/admin/layout.tsx — DESIGN.md Blue-Adapted Admin Shell
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "概览", href: "/admin", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: "审核队列", href: "/admin/data-review", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { label: "爬取计划", href: "/admin/crawl-schedule", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  { label: "管线日志", href: "/admin/pipeline-log", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { label: "字段管理", href: "/admin/field-settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { label: "用户管理", href: "/admin/users", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8f9fb" }}>
      {/* Mobile toggle */}
      <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`admin-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="admin-sidebar-brand">
          <Link href="/admin" style={{ color: "#ffffff", textDecoration: "none" }}>
            PriceCRE Admin
          </Link>
          <p className="admin-sidebar-caption">数据管理中心</p>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-nav-item${isActive ? " active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 12 }}>
            ← 返回前台
          </Link>
          <form action="/api/auth/signout" method="POST">
            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", padding: 0, marginTop: 4 }}>
              退出登录
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-content">{children}</main>

      {/* Sidebar CSS-in-JS to match DESIGN.md */}
      <style jsx global>{`
        .admin-mobile-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 100; background: #fff; border: 1px solid #e5edf5; border-radius: 4px; padding: 6px 8px; cursor: pointer; }
        .admin-sidebar {
          width: 220px; min-height: 100vh; background: #0f2b4a; display: flex; flex-direction: column; flex-shrink: 0;
          font-family: MiSans, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
        }
        .admin-sidebar-brand { padding: 24px 20px 16px; border-bottom: 1px solid rgba(255,255,255,0.08); }
        .admin-sidebar-brand a { font-size: 16px; font-weight: 500; }
        .admin-sidebar-caption { font-size: 10px; font-weight: 400; color: rgba(255,255,255,0.4); margin-top: 2px; letter-spacing: 0.1px; }
        .admin-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 2px; }
        .admin-nav-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 6px;
          font-size: 14px; font-weight: 400; color: rgba(255,255,255,0.7); text-decoration: none;
          transition: background 0.15s;
        }
        .admin-nav-item:hover { background: rgba(255,255,255,0.06); }
        .admin-nav-item.active { background: rgba(37,99,235,0.25); font-weight: 500; color: #ffffff; }
        .admin-nav-icon { display: flex; align-items: center; width: 20px; height: 20px; color: inherit; }
        .admin-nav-item.active .admin-nav-icon { color: #60a5fa; }
        .admin-sidebar-footer { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.08); }
        .admin-content { flex: 1; padding: 32px; overflow: auto; min-width: 0; }
        .admin-content-inner { max-width: 1200px; }
        .admin-page-header { margin-bottom: 24px; }
        .admin-page-title { font-size: 22px; font-weight: 500; color: #1A1A2E; line-height: 1.1; letter-spacing: -0.22px; margin: 0 0 4px; }
        .admin-page-desc { font-size: 14px; font-weight: 400; color: #64748d; margin: 0; }
        .str-table { width: 100%; border-collapse: collapse; font-family: MiSans, sans-serif; }
        .str-table thead th {
          background: #f8f9fb; font-size: 11px; font-weight: 500; color: #374151; text-align: left;
          padding: 10px 16px; border-bottom: 1px solid #e5edf5;
        }
        .str-table tbody td {
          font-size: 14px; font-weight: 400; color: #1A1A2E; padding: 12px 16px;
          border-bottom: 1px solid #e5edf5;
        }
        .str-table tbody tr:hover { background: #f8f9fb; }
        .str-td-mono { font-family: "Geist Mono", SF Mono, ui-monospace, monospace; font-weight: 500; font-feature-settings: "tnum"; }
        .str-td-hint { font-size: 12px; color: #64748d; }
        .btn-primary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 500;
          background: #2563EB; color: #ffffff; border: none; cursor: pointer;
          font-family: MiSans, sans-serif; transition: background 0.15s;
        }
        .btn-primary:hover { background: #1d4ed8; }
        .btn-secondary {
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          padding: 8px 16px; border-radius: 4px; font-size: 14px; font-weight: 500;
          background: transparent; color: #2563EB; border: 1px solid #93c5fd; cursor: pointer;
          font-family: MiSans, sans-serif; transition: background 0.15s;
        }
        .btn-secondary:hover { background: rgba(37,99,235,0.05); }
        .btn-danger {
          display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px;
          border-radius: 4px; font-size: 12px; font-weight: 500; background: transparent;
          color: #dc2626; border: none; cursor: pointer; font-family: MiSans, sans-serif;
        }
        .btn-danger:hover { background: rgba(220,38,38,0.05); }
        .btn-ghost {
          display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px;
          border-radius: 4px; font-size: 12px; font-weight: 500; background: transparent;
          color: #64748d; border: none; cursor: pointer; font-family: MiSans, sans-serif;
        }
        .btn-ghost:hover { background: rgba(0,0,0,0.04); }

        @media (max-width: 1024px) {
          .admin-sidebar { position: fixed; left: -220px; top: 0; bottom: 0; z-index: 99; transition: left 0.2s; }
          .admin-sidebar.open { left: 0; }
          .admin-mobile-toggle { display: block; }
          .admin-content { padding: 20px; }
        }
        @media (max-width: 640px) {
          .admin-content { padding: 16px; }
          .admin-page-title { font-size: 18px; }
        }
      `}</style>
    </div>
  );
}
