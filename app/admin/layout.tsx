// app/admin/layout.tsx — Ghost Admin Shell (DESIGN.md v2)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "概览", href: "/admin", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { label: "资产数据", href: "/admin/data-review", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { label: "租金核验", href: "/admin/submissions", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg> },
  { label: "爬取计划", href: "/admin/crawl-schedule", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg> },
  { label: "数据源", href: "/admin/data-sources", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
  { label: "管线日志", href: "/admin/pipeline-log", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { label: "字段管理", href: "/admin/field-settings", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
  { label: "用户管理", href: "/admin/users", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
  { label: "邀请码", href: "/admin/referrals", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h7"/><polyline points="16 2 22 8 11 19 7 19 7 15"/></svg> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F0F0F1" }}>
      <button className="gh-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15171A" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>

      <aside className={`gh-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="gh-sidebar-brand">
          <Link href="/admin" style={{ color: "#FFFFFF", textDecoration: "none", fontSize: 16, fontWeight: 600 }}>PriceCRE</Link>
          <p style={{ fontSize: 11, color: "#738A94", margin: "2px 0 0", fontWeight: 400 }}>Admin</p>
        </div>
        <nav className="gh-nav">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`gh-nav-item${active ? " active" : ""}`} onClick={() => setSidebarOpen(false)}>
                <span className="gh-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="gh-sidebar-footer">
          <Link href="/" style={{ color: "#738A94", textDecoration: "none", fontSize: 12 }}>← 返回前台</Link>
          <form action="/api/auth/signout" method="POST"><button style={{ background: "none", border: "none", color: "#738A94", fontSize: 12, cursor: "pointer", padding: 0, marginTop: 4 }}>退出登录</button></form>
        </div>
      </aside>

      <main className="gh-content">{children}</main>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif; -webkit-font-smoothing: antialiased; }
        .gh-mobile-toggle { display: none; position: fixed; top: 12px; left: 12px; z-index: 100; background: #fff; border: 1px solid #E5E7EB; border-radius: 6px; padding: 6px 8px; cursor: pointer; }
        .gh-sidebar { width: 240px; min-height: 100vh; background: #15171A; display: flex; flex-direction: column; flex-shrink: 0; }
        .gh-sidebar-brand { padding: 28px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
        .gh-nav { flex: 1; padding: 12px 8px; display: flex; flex-direction: column; gap: 1px; }
        .gh-nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500; color: #738A94; text-decoration: none; transition: background 0.1s; position: relative; }
        .gh-nav-item:hover { background: #1E2026; }
        .gh-nav-item.active { background: rgba(62,176,239,0.15); color: #FFFFFF; font-weight: 600; }
        .gh-nav-item.active::before { content: ""; position: absolute; left: 0; top: 6px; bottom: 6px; width: 3px; background: #3EB0EF; border-radius: 0 2px 2px 0; }
        .gh-nav-icon { display: flex; align-items: center; width: 20px; height: 20px; color: inherit; }
        .gh-sidebar-footer { padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06); }
        .gh-content { flex: 1; padding: 40px 48px; overflow: auto; min-width: 0; }
        .gh-content-inner { max-width: 1280px; }

        .gh-page-header { margin-bottom: 32px; }
        .gh-page-title { font-size: 22px; font-weight: 600; color: #15171A; line-height: 1.15; margin: 0 0 4px; }
        .gh-page-desc { font-size: 14px; font-weight: 400; color: #738A94; margin: 0; }

        .gh-table { width: 100%; border-collapse: collapse; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; }
        .gh-table thead th { background: transparent; font-size: 12px; font-weight: 600; color: #738A94; text-align: left; padding: 10px 16px; border-bottom: 1px solid #E5E7EB; text-transform: uppercase; letter-spacing: 0.3px; }
        .gh-table tbody td { font-size: 14px; font-weight: 400; color: #15171A; padding: 12px 16px; border-bottom: 1px solid #E5E7EB; }
        .gh-table tbody tr:last-child td { border-bottom: none; }
        .gh-table tbody tr:hover { background: #F5F6F7; }
        .gh-mono { font-family: "JetBrains Mono", "SF Mono", "Cascadia Code", ui-monospace, monospace; font-weight: 500; font-size: 13px; font-feature-settings: "tnum"; }
        .gh-hint { font-size: 13px; color: #738A94; }

        .gh-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 6px; font-size: 14px; font-weight: 500; background: #3EB0EF; color: #fff; border: none; cursor: pointer; font-family: inherit; transition: background 0.1s; }
        .gh-btn-primary:hover { background: #33A1DE; }
        .gh-btn-primary:disabled { opacity: 0.5; cursor: default; }
        .gh-btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 7px 19px; border-radius: 6px; font-size: 14px; font-weight: 500; background: transparent; color: #3EB0EF; border: 1px solid #D1D5DB; cursor: pointer; font-family: inherit; transition: all 0.1s; }
        .gh-btn-outline:hover { background: rgba(62,176,239,0.04); border-color: #3EB0EF; }
        .gh-btn-danger { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; background: transparent; color: #E64C4C; border: none; cursor: pointer; font-family: inherit; }
        .gh-btn-danger:hover { background: rgba(230,76,76,0.04); }
        .gh-btn-ghost { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500; background: transparent; color: #738A94; border: none; cursor: pointer; font-family: inherit; }
        .gh-btn-ghost:hover { background: #F5F6F7; }

        .gh-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .gh-badge-success { background: rgba(48,207,67,0.1); color: #1A9E2F; }
        .gh-badge-accent { background: rgba(62,176,239,0.08); color: #2090CC; }
        .gh-badge-neutral { background: #F0F0F1; color: #738A94; }
        .gh-badge-error { background: rgba(230,76,76,0.08); color: #E64C4C; }

        .gh-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; box-shadow: 0 0 0 1px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04); padding: 20px; }
        .gh-input { width: 100%; padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px; font-weight: 400; color: #15171A; font-family: inherit; outline: none; background: #fff; }
        .gh-input:focus { border-color: #3EB0EF; }
        .gh-input::placeholder { color: #A5B4BF; }
        .gh-label { font-size: 12px; font-weight: 600; color: #738A94; text-transform: uppercase; letter-spacing: 0.3px; }
        .gh-select { padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-size: 14px; color: #15171A; background: #fff; outline: none; font-family: inherit; }
        .gh-select:focus { border-color: #3EB0EF; }

        .gh-filter-tab { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 500; border: none; cursor: pointer; color: #738A94; background: transparent; font-family: inherit; }
        .gh-filter-tab:hover { background: #F5F6F7; }
        .gh-filter-tab.active { background: rgba(62,176,239,0.1); color: #3EB0EF; }

        .gh-empty { text-align: center; padding: 80px 24px; }
        .gh-empty-title { font-size: 16px; font-weight: 600; color: #15171A; margin: 0 0 4px; }
        .gh-empty-desc { font-size: 14px; font-weight: 400; color: #738A94; margin: 0; }

        @media (max-width: 1024px) { .gh-sidebar { position: fixed; left: -240px; top: 0; bottom: 0; z-index: 99; transition: left 0.2s; } .gh-sidebar.open { left: 0; } .gh-mobile-toggle { display: block; } .gh-content { padding: 20px; } }
        @media (max-width: 640px) { .gh-content { padding: 16px; } .gh-page-title { font-size: 18px; } }
      `}</style>
    </div>
  );
}
