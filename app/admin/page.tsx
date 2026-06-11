// app/admin/page.tsx — Burrow-style Dashboard（毛玻璃瓦片 + 健康分主卡 + sparkline + 深浅主题）
// 主题作用域仅限本页（含侧边栏联动），其他后台页面不受影响
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface StatsData {
  summary: { totalAssets: number; cities: number; totalUsers: number; totalViews: number; newAssetsThisWeek: number; newUsersThisWeek: number; viewsThisWeek: number };
  pipeline: { pendingReviews: number; approvedThisWeek: number; activeCrawlJobs: number; totalCrawlJobs: number; activeDataSources: number; totalDataSources: number; crawlSuccessPct: number; lastCrawlAt: string | null; lastReviewAt: string | null };
  quality: { avgConfidence: number; highConfidenceCount: number; lowConfidenceCount: number };
  growth: {
    totalOrders: number; totalReferrals: number;
    totalOrdersPaid: number; totalOrdersThisWeek: number; totalOrdersAmount: number;
    totalUnlockedAssets: number; totalConversations: number; conversationsThisWeek: number;
  };
  quotaPool: { totalViewCredits: number; totalChatTokens: number };
  reports?: { total: number; thisWeek: number };
  codes?: { generated: number; redeemed: number; byType: Record<string, number> };
  trends?: { views: number[]; assets: number[]; users: number[]; orders: number[]; reports: number[]; conversations: number[] };
  byType: Record<string, number>;
  dailyViews: { date: string; count: number }[];
}
const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };

function noopStats(): StatsData {
  return {
    summary: { totalAssets: 0, cities: 0, totalUsers: 0, totalViews: 0, newAssetsThisWeek: 0, newUsersThisWeek: 0, viewsThisWeek: 0 },
    pipeline: { pendingReviews: 0, approvedThisWeek: 0, activeCrawlJobs: 0, totalCrawlJobs: 0, activeDataSources: 0, totalDataSources: 0, crawlSuccessPct: 0, lastCrawlAt: null, lastReviewAt: null },
    quality: { avgConfidence: 0, highConfidenceCount: 0, lowConfidenceCount: 0 },
    growth: { totalOrders: 0, totalReferrals: 0, totalOrdersPaid: 0, totalOrdersThisWeek: 0, totalOrdersAmount: 0, totalUnlockedAssets: 0, totalConversations: 0, conversationsThisWeek: 0 },
    quotaPool: { totalViewCredits: 0, totalChatTokens: 0 },
    byType: { OFFICE: 0, SHOPS: 0, INDUSTRIAL: 0 },
    dailyViews: [],
  };
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分钟前`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} 小时前`;
  return `${Math.floor(hrs / 24)} 天前`;
}

/* ── Sparkline（迷你走势图） ── */
function Sparkline({ data, color, w = 96, h = 26 }: { data?: number[]; color: string; w?: number; h?: number }) {
  if (!data || data.length < 2 || data.every(v => v === 0)) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 2 - (v / max) * (h - 6)] as const);
  const line = pts.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const gid = `sg-${color.replace(/[^a-z0-9]/gi, "")}-${data.join("")}`.slice(0, 24);
  return (
    <svg width={w} height={h} style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2" fill={color} />
    </svg>
  );
}

/* ── 健康分计算 ── */
function healthScore(s: StatsData): { score: number; reason: string } {
  let score = 100;
  const issues: [number, string][] = [];
  const backlog = s.pipeline.pendingReviews;
  if (backlog > 10) { score -= 15; issues.push([15, `审核队列积压 ${backlog} 项，需要尽快处理`]); }
  else if (backlog > 0) { score -= 4; issues.push([4, `${backlog} 项待审核`]); }
  const q = s.quality.avgConfidence;
  if (q < 80) { const d = Math.round((80 - q) * 0.5); score -= d; issues.push([d, `数据质量 ${q}%，低于 80% 基线`]); }
  if (s.pipeline.activeCrawlJobs === 0) { score -= 15; issues.push([15, "没有活跃的抓取任务，数据停止更新"]); }
  if (s.pipeline.crawlSuccessPct < 90) { score -= 10; issues.push([10, `抓取成功率 ${s.pipeline.crawlSuccessPct}%`]); }
  if (s.pipeline.lastCrawlAt && Date.now() - new Date(s.pipeline.lastCrawlAt).getTime() > 3 * 86400000) {
    score -= 10; issues.push([10, "超过 3 天未抓取新数据"]);
  }
  if (s.summary.newUsersThisWeek === 0 && s.summary.totalUsers > 0) { score -= 5; issues.push([5, "本周没有新用户注册"]); }
  score = Math.max(0, Math.min(100, score));
  issues.sort((a, b) => b[0] - a[0]);
  return { score, reason: issues.length > 0 ? issues[0][1] : "所有系统运行正常，数据管线健康" };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  // 主题由 app/admin/layout.tsx 统一管理（html[data-bw-admin]），本页只消费 CSS 变量

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      setData(d?.summary ? d : noopStats());
    }).catch(() => setData(noopStats())).finally(() => setLoading(false));
  }, []);

  const s = data || noopStats();
  const reviewBacklog = s.pipeline.pendingReviews;
  const dataFreshness = timeAgo(s.pipeline.lastCrawlAt);
  const qScore = s.quality.avgConfidence;
  const { score, reason } = healthScore(s);
  const scoreColor = score >= 85 ? "var(--bw-positive)" : score >= 60 ? "var(--bw-warning)" : "var(--bw-negative)";
  const ring = 2 * Math.PI * 34;

  const tiles: { icon: string; label: string; value: string; color?: string; sub: string; href: string; spark?: number[]; sparkColor: string }[] = [
    { icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z", label: "资产总量", value: String(s.summary.totalAssets), sub: `${s.summary.cities} 座城市`, href: "/admin/data-review", spark: s.trends?.assets, sparkColor: "#0070F3" },
    { icon: "M12 2v20M2 12h20", label: "本周新增", value: `+${s.summary.newAssetsThisWeek}`, color: "var(--bw-positive)", sub: "资产", href: "/admin/data-review", spark: s.trends?.assets, sparkColor: "#0D9488" },
    { icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11", label: "待审核", value: String(reviewBacklog), color: reviewBacklog > 10 ? "var(--bw-negative)" : reviewBacklog > 0 ? "var(--bw-warning)" : "var(--bw-accent)", sub: reviewBacklog > 0 ? "待处理" : "已清空", href: "/admin/submissions", sparkColor: "#F5A623" },
    { icon: "M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1 14h2v2h-2zm0-8h2v6h-2z", label: "数据质量", value: `${qScore}%`, color: qScore >= 80 ? "var(--bw-accent)" : "var(--bw-warning)", sub: qScore >= 80 ? "良好" : "需关注", href: "/admin/data-review", sparkColor: "#0070F3" },
    { icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0z", label: "注册用户", value: String(s.summary.totalUsers), sub: `+${s.summary.newUsersThisWeek} 本周`, href: "/admin/users", spark: s.trends?.users, sparkColor: "#7C3AED" },
    { icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z", label: "资产浏览量", value: String(s.summary.totalViews), sub: `${s.summary.viewsThisWeek} 本周`, href: "/admin/users", spark: s.trends?.views, sparkColor: "#0070F3" },
    { icon: "M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2zM1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6", label: "购买订单", value: String(s.growth.totalOrdersPaid), color: "var(--bw-accent)", sub: `+${s.growth.totalOrdersThisWeek} 本周 · ¥${Number(s.growth.totalOrdersAmount).toLocaleString()}`, href: "/admin/orders", spark: s.trends?.orders, sparkColor: "#0070F3" },
    { icon: "M12 2l10 5-10 5-10-5 10-5zm0 7.5L2 12l10 5 10-5-10-4.5z", label: "已解锁资产", value: String(s.growth.totalUnlockedAssets), color: "var(--bw-positive)", sub: "解锁记录", href: "/admin/users", spark: s.trends?.views, sparkColor: "#0D9488" },
    { icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z", label: "总对话量", value: String(s.growth.totalConversations), sub: `${s.growth.conversationsThisWeek} 本周`, href: "/admin/users", spark: s.trends?.conversations, sparkColor: "#0D9488" },
    { icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8", label: "生成报告量", value: String(s.reports?.total ?? 0), color: "#7C3AED", sub: `+${s.reports?.thisWeek ?? 0} 本周`, href: "/admin/ai-reports", spark: s.trends?.reports, sparkColor: "#7C3AED" },
    { icon: "M2 4h20v16H2zM10 9h4M10 13h4M10 17h2", label: "兑换码", value: String(s.codes?.generated ?? 0), color: "var(--bw-warning)", sub: (() => {
        const t = s.codes?.byType || {};
        const parts = Object.entries(t).slice(0, 2).map(([k, v]) => `${k}×${v}`);
        return parts.length > 0 ? `${parts.join(" ")} · 已兑${s.codes?.redeemed ?? 0}` : `已兑换 ${s.codes?.redeemed ?? 0}`;
      })(), href: "/admin/exchange-codes", sparkColor: "#F5A623" },
  ];

  if (loading) return (
    <div className="vl-content-inner"><div className="bw-loading"><div className="bw-spin" /><span>加载中</span></div></div>
  );

  return (
    <div className="bw-root">
      <style>{BW_CSS}</style>

      {/* Header */}
      <div className="bw-header">
        <div>
          <h1 className="bw-title">仪表盘</h1>
          <p className="bw-desc">数据治理全景 · 最近更新 {dataFreshness}</p>
        </div>
      </div>

      {/* Hero：平台健康分 */}
      <div className="bw-hero bw-card">
        <div className="bw-hero-left">
          <svg width="84" height="84" viewBox="0 0 84 84">
            <circle cx="42" cy="42" r="34" fill="none" stroke="var(--bw-track)" strokeWidth="7" />
            <circle cx="42" cy="42" r="34" fill="none" stroke={scoreColor} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${(score / 100) * ring} ${ring}`} transform="rotate(-90 42 42)"
              style={{ transition: "stroke-dasharray 0.8s ease" }} />
            <text x="42" y="47" textAnchor="middle" fill={scoreColor} style={{ fontSize: 24, fontWeight: 700, fontFamily: "var(--font-geist-mono)" }}>{score}</text>
          </svg>
          <div>
            <div className="bw-hero-label">平台健康分</div>
            <div className="bw-hero-reason">{reason}</div>
            <div className="bw-hero-hint">由抓取状态 · 审核积压 · 数据质量 · 增长活跃综合评定</div>
          </div>
        </div>
        <div className="bw-hero-chips">
          <div className="bw-chip"><span className="bw-chip-label">活跃爬虫</span><span className="bw-chip-val" style={{ color: s.pipeline.activeCrawlJobs > 0 ? "var(--bw-positive)" : "var(--bw-negative)" }}>{s.pipeline.activeCrawlJobs}/{s.pipeline.totalCrawlJobs}</span></div>
          <div className="bw-chip"><span className="bw-chip-label">审核队列</span><span className="bw-chip-val" style={{ color: reviewBacklog > 10 ? "var(--bw-negative)" : "var(--bw-text)" }}>{reviewBacklog}</span></div>
          <div className="bw-chip"><span className="bw-chip-label">数据质量</span><span className="bw-chip-val">{qScore}%</span></div>
          <div className="bw-chip"><span className="bw-chip-label">额度池</span><span className="bw-chip-val">{s.quotaPool.totalViewCredits}</span></div>
        </div>
      </div>

      {/* Metric tiles */}
      <div className="bw-grid">
        {tiles.map((t) => (
          <div key={t.label} className="bw-card bw-tile" onClick={() => router.push(t.href)} title={`查看 ${t.label}`}>
            <div className="bw-tile-head">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--bw-hint)" strokeWidth="1.6"><path d={t.icon} /></svg>
              <span>{t.label}</span>
            </div>
            <div className="bw-tile-body">
              <div className="bw-tile-num" style={{ color: t.color || "var(--bw-text)" }}>{t.value}</div>
              <Sparkline data={t.spark} color={t.sparkColor} />
            </div>
            <div className="bw-tile-sub">{t.sub}</div>
          </div>
        ))}
      </div>

      {/* Lower cards */}
      <div className="bw-lower">
        <div className="bw-card bw-panel">
          <div className="bw-panel-head">
            <h3>数据管线</h3>
            <span className="bw-badge" style={{ color: s.pipeline.crawlSuccessPct >= 90 ? "var(--bw-accent)" : "var(--bw-warning)" }}>{s.pipeline.crawlSuccessPct}% 成功率</span>
          </div>
          {[
            { l: "活跃爬虫", v: `${s.pipeline.activeCrawlJobs}/${s.pipeline.totalCrawlJobs}` },
            { l: "活跃数据源", v: `${s.pipeline.activeDataSources}/${s.pipeline.totalDataSources}` },
            { l: "本周审核通过", v: String(s.pipeline.approvedThisWeek) },
            { l: "上次爬取", v: dataFreshness },
          ].map((r, i) => (
            <div key={i} className="bw-row"><span>{r.l}</span><b>{r.v}</b></div>
          ))}
        </div>

        <div className="bw-card bw-panel">
          <div className="bw-panel-head"><h3>资产构成</h3></div>
          {(() => {
            const TYPE_COLORS: Record<string, string> = { OFFICE: "#0070F3", SHOPS: "#0D9488", INDUSTRIAL: "#F5A623" };
            const entries = Object.entries(s.byType);
            const total = entries.reduce((sum, [, v]) => sum + v, 0);
            const R = 34; const C = 2 * Math.PI * R;
            let offset = 0;
            return (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <svg width="96" height="96" viewBox="0 0 96 96" style={{ flexShrink: 0 }}>
                  <circle cx="48" cy="48" r={R} fill="none" stroke="var(--bw-track)" strokeWidth="13" />
                  {total > 0 && entries.map(([k, v]) => {
                    const frac = v / total;
                    const seg = (
                      <circle key={k} cx="48" cy="48" r={R} fill="none" stroke={TYPE_COLORS[k] || "#888"} strokeWidth="13"
                        strokeDasharray={`${Math.max(frac * C - 1.5, 0)} ${C}`} strokeDashoffset={-offset * C}
                        transform="rotate(-90 48 48)" style={{ transition: "stroke-dasharray 0.6s ease" }} />
                    );
                    offset += frac;
                    return seg;
                  })}
                  <text x="48" y="45" textAnchor="middle" fill="var(--bw-text)" style={{ fontSize: 16, fontWeight: 650, fontFamily: "var(--font-geist-mono)" }}>{total}</text>
                  <text x="48" y="59" textAnchor="middle" fill="var(--bw-hint)" style={{ fontSize: 9 }}>总资产</text>
                </svg>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                  {entries.map(([k, v]) => {
                    const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                    return (
                      <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[k] || "#888", flexShrink: 0 }} />
                        <span style={{ color: "var(--bw-muted)" }}>{typeLabels[k]}</span>
                        <span style={{ marginLeft: "auto", color: "var(--bw-text)", fontWeight: 600, fontFamily: "var(--font-geist-mono)" }}>{v}</span>
                        <span style={{ color: "var(--bw-hint)", width: 32, textAlign: "right" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
          <div className="bw-row" style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--bw-border)" }}>
            <span>高置信度(≥80%)</span><b style={{ color: "var(--bw-accent)" }}>{s.quality.highConfidenceCount} 项</b>
          </div>
          <div className="bw-row">
            <span>需关注(&lt;60%)</span><b style={{ color: s.quality.lowConfidenceCount > 0 ? "var(--bw-negative)" : "var(--bw-hint)" }}>{s.quality.lowConfidenceCount} 项</b>
          </div>
        </div>

        <div className="bw-card bw-panel">
          <div className="bw-panel-head"><h3>浏览趋势</h3><span className="bw-badge" style={{ color: "var(--bw-hint)" }}>近 7 天</span></div>
          {s.dailyViews.length > 0 ? (
            <>
              <div style={{ padding: "4px 0 8px" }}>
                <Sparkline data={s.dailyViews.map(d => d.count)} color="#0070F3" w={260} h={56} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {s.dailyViews.map((d, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-geist-mono)" }}>{d.count}</div>
                    <div style={{ fontSize: 9, color: "var(--bw-hint)", marginTop: 1 }}>{d.date}</div>
                  </div>
                ))}
              </div>
            </>
          ) : <div style={{ fontSize: 12, color: "var(--bw-hint)", padding: "20px 0", textAlign: "center" }}>暂无数据</div>}
        </div>

        <div className="bw-card bw-panel">
          <div className="bw-panel-head"><h3>系统状态</h3></div>
          <div className="bw-row"><span>爬虫调度</span><b style={{ color: s.pipeline.activeCrawlJobs > 0 ? "var(--bw-accent)" : "var(--bw-negative)" }}>{s.pipeline.activeCrawlJobs > 0 ? "运行中" : "已停用"}</b></div>
          <div className="bw-row"><span>审核队列</span><b style={{ color: reviewBacklog > 10 ? "var(--bw-negative)" : "var(--bw-accent)" }}>{reviewBacklog > 10 ? `${reviewBacklog} 项积压` : "健康"}</b></div>
          <div className="bw-row"><span>数据质量</span><b style={{ color: qScore >= 80 ? "var(--bw-accent)" : "var(--bw-warning)" }}>{qScore >= 80 ? `${qScore}% 良好` : "需提升"}</b></div>
          <div className="bw-row"><span>AI 对话额度池</span><b>{s.quotaPool.totalChatTokens}</b></div>
          <div className="bw-row"><span>邀请关系</span><b>{s.growth.totalReferrals}</b></div>
        </div>
      </div>
    </div>
  );
}

/* ── Burrow 风格 CSS（变量双主题，作用域 .bw-root + 本页挂载时联动侧边栏） ── */
const BW_CSS = `
.bw-root {
  --bw-bg: linear-gradient(160deg, #F6F8FB 0%, #EEF1F6 100%);
  --bw-card: rgba(255,255,255,0.72);
  --bw-card-hover: rgba(255,255,255,0.92);
  --bw-border: rgba(17,24,39,0.08);
  --bw-text: #171717;
  --bw-muted: #525252;
  --bw-hint: #9CA3AF;
  --bw-accent: #0070F3;
  --bw-positive: #0D9488;
  --bw-warning: #D97706;
  --bw-negative: #DC2626;
  --bw-track: rgba(17,24,39,0.07);
  --bw-shadow: 0 1px 3px rgba(16,24,40,0.06), 0 8px 24px rgba(16,24,40,0.05);
  padding: 28px 36px 40px;
  min-height: calc(100vh - 0px);
  background: var(--bw-bg);
  font-family: var(--font-sans);
}
html[data-bw-admin="dark"] .bw-root {
  --bw-bg: linear-gradient(160deg, #0C0E12 0%, #12151C 55%, #0E1116 100%);
  --bw-card: rgba(255,255,255,0.045);
  --bw-card-hover: rgba(255,255,255,0.085);
  --bw-border: rgba(255,255,255,0.09);
  --bw-text: #F4F4F5;
  --bw-muted: #A1A1AA;
  --bw-hint: #62656E;
  --bw-accent: #3B9DFF;
  --bw-positive: #2DD4A8;
  --bw-warning: #F5A623;
  --bw-negative: #F87171;
  --bw-track: rgba(255,255,255,0.08);
  --bw-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.35);
}
/* 本页内容底色（侧边栏/全局组件的暗色覆盖在 globals.css 中统一定义） */
html[data-bw-admin="light"] .vl-content { background: #F6F8FB; }

.bw-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 12px; flex-wrap: wrap; }
.bw-title { font-size: 19px; font-weight: 650; color: var(--bw-text); letter-spacing: -0.03em; margin: 0; }
.bw-desc { font-size: 13px; color: var(--bw-muted); margin: 4px 0 0; }
.bw-theme-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border-radius: 999px;
  border: 1px solid var(--bw-border); background: var(--bw-card); color: var(--bw-muted);
  font-size: 12px; font-weight: 500; cursor: pointer; backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%); transition: all 0.15s ease; font-family: var(--font-sans);
}
.bw-theme-btn:hover { background: var(--bw-card-hover); color: var(--bw-text); }

.bw-card {
  background: var(--bw-card); border: 1px solid var(--bw-border); border-radius: 14px;
  backdrop-filter: blur(16px) saturate(160%); -webkit-backdrop-filter: blur(16px) saturate(160%);
  box-shadow: var(--bw-shadow);
}

.bw-hero { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 18px 22px; margin-bottom: 14px; flex-wrap: wrap; }
.bw-hero-left { display: flex; align-items: center; gap: 18px; min-width: 280px; }
.bw-hero-label { font-size: 11px; font-weight: 600; color: var(--bw-hint); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
.bw-hero-reason { font-size: 15px; font-weight: 600; color: var(--bw-text); letter-spacing: -0.01em; line-height: 1.4; }
.bw-hero-hint { font-size: 11px; color: var(--bw-hint); margin-top: 4px; }
.bw-hero-chips { display: flex; gap: 8px; flex-wrap: wrap; }
.bw-chip {
  display: flex; flex-direction: column; gap: 2px; padding: 8px 14px; border-radius: 10px;
  background: var(--bw-track); border: 1px solid var(--bw-border); min-width: 76px;
}
.bw-chip-label { font-size: 10px; color: var(--bw-hint); }
.bw-chip-val { font-size: 15px; font-weight: 650; color: var(--bw-text); font-family: var(--font-geist-mono); letter-spacing: -0.03em; }

.bw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(196px, 1fr)); gap: 10px; margin-bottom: 14px; }
.bw-tile { padding: 13px 15px; cursor: pointer; transition: all 0.16s ease; }
.bw-tile:hover { background: var(--bw-card-hover); transform: translateY(-1px); border-color: var(--bw-accent); }
.bw-tile-head { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 500; color: var(--bw-muted); margin-bottom: 7px; }
.bw-tile-body { display: flex; justify-content: space-between; align-items: flex-end; gap: 8px; min-height: 28px; }
.bw-tile-num { font-size: 22px; font-weight: 650; font-family: var(--font-geist-mono); letter-spacing: -0.04em; line-height: 1; }
.bw-tile-sub { font-size: 10.5px; color: var(--bw-hint); margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.bw-lower { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
.bw-panel { padding: 16px 18px; }
.bw-panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bw-panel-head h3 { font-size: 12px; font-weight: 650; color: var(--bw-text); letter-spacing: -0.01em; margin: 0; }
.bw-badge { font-size: 10px; font-weight: 600; }
.bw-row { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 12px; }
.bw-row span { color: var(--bw-muted); }
.bw-row b { color: var(--bw-text); font-weight: 600; font-family: var(--font-geist-mono); font-size: 12px; }

.bw-bar-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; }
.bw-bar-label { font-size: 11px; font-weight: 500; color: var(--bw-muted); width: 42px; flex-shrink: 0; }
.bw-bar-track { flex: 1; height: 4px; background: var(--bw-track); border-radius: 2px; overflow: hidden; }
.bw-bar-fill { height: 100%; border-radius: 2px; background: var(--bw-accent); transition: width 0.5s ease; }
.bw-bar-val { font-size: 11px; font-weight: 600; color: var(--bw-text); font-family: var(--font-geist-mono); width: 28px; text-align: right; }

@media (max-width: 768px) {
  .bw-root { padding: 16px 14px 32px; }
  .bw-hero { flex-direction: column; align-items: flex-start; }
}
`;
