// app/admin/page.tsx — Business Dashboard (null-safe)
"use client";
import { useState, useEffect } from "react";

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

export default function DashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      setData(d?.summary ? d : noopStats());
    }).catch(() => setData(noopStats())).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="vl-content-inner"><div className="vl-empty"><p className="vl-empty-title">加载中...</p></div></div>;
  const s = data || noopStats();
  const reviewBacklog = s.pipeline.pendingReviews;
  const dataFreshness = timeAgo(s.pipeline.lastCrawlAt);
  const qScore = s.quality.avgConfidence;

  const StatIcon = ({ d }: { d: string }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.5" style={{ marginRight: 4, flexShrink: 0 }}>
      <path d={d} />
    </svg>
  );

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header">
        <h1 className="vl-page-title">仪表盘</h1>
        <p className="vl-page-desc">数据治理全景 · 最近更新 {dataFreshness}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 20 }}>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />资产总量</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{s.summary.totalAssets}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>{s.summary.cities} 座城市</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm1 5h-2v5h2V7zm0 7h-2v2h2v-2z" />本周新增</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#0D9488", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>+{s.summary.newAssetsThisWeek}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>资产</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />待审核</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: reviewBacklog > 10 ? "#EE0000" : reviewBacklog > 0 ? "#F5A623" : "#0070F3", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{reviewBacklog}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>{reviewBacklog > 0 ? "待处理" : "已清空"}</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm-1 14h2v2h-2zm0-8h2v6h-2z" />数据质量</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: qScore >= 80 ? "#0070F3" : qScore >= 60 ? "#F5A623" : "#EE0000", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{qScore}%</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>{qScore >= 80 ? "良好" : qScore >= 60 ? "一般" : "需关注"}</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0zm14 14v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />注册用户</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{s.summary.totalUsers}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>+{s.summary.newUsersThisWeek} 本周</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z" />资产浏览量</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{s.summary.totalViews}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>{s.summary.viewsThisWeek} 本周</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M6 2l3 6-1.5 1.5L9 12l3 2.5L15 12l1.5-2.5L15 8l3-6H6zM3 22h18v-2H3v2z" />购买订单</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#0070F3", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{s.growth.totalOrdersPaid}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>+{s.growth.totalOrdersThisWeek} 本周</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M12 2l10 5-10 5-10-5 10-5zm0 7.5L2 12l10 5 10-5-10-4.5z" />已解锁资产</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#0D9488", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{s.growth.totalUnlockedAssets}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>卡片总数</div>
        </div>
        <div className="vl-card-static" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4, display: "flex", alignItems: "center" }}><StatIcon d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />总对话量</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.04em" }}>{s.growth.totalConversations}</div>
          <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>{s.growth.conversationsThisWeek} 本周</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="vl-card-static" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", margin: 0 }}>数据管线</h3>
            <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "2px 6px", borderRadius: 4, color: s.pipeline.crawlSuccessPct >= 90 ? "#0070F3" : "#F5A623", background: s.pipeline.crawlSuccessPct >= 90 ? "rgba(0,112,243,0.06)" : "rgba(245,166,35,0.08)" }}>
              {s.pipeline.crawlSuccessPct}% 成功率
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { l: "活跃爬虫", v: `${s.pipeline.activeCrawlJobs}/${s.pipeline.totalCrawlJobs}` },
              { l: "活跃数据源", v: `${s.pipeline.activeDataSources}/${s.pipeline.totalDataSources}` },
              { l: "本周审核通过", v: String(s.pipeline.approvedThisWeek) },
              { l: "上次爬取", v: dataFreshness },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#525252", fontFamily: "var(--font-sans)" }}>{r.l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="vl-card-static" style={{ padding: "18px 20px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", margin: "0 0 12px" }}>资产构成</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(s.byType).map(([k, v]) => {
              const pct = s.summary.totalAssets > 0 ? Math.round((v / s.summary.totalAssets) * 100) : 0;
              return (
                <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#525252", fontFamily: "var(--font-sans)", width: 40 }}>{typeLabels[k]}</span>
                  <div style={{ flex: 1, height: 3, background: "#F7F7F7", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: "#171717", width: `${pct}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)", width: 24, textAlign: "right" }}>{v}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", borderTop: "1px solid #E5E5E5", paddingTop: 10 }}>
            <span style={{ fontSize: 11, color: "#525252", fontFamily: "var(--font-sans)" }}>高置信度(≥80%)</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#0070F3", fontFamily: "var(--font-geist-mono)" }}>{s.quality.highConfidenceCount} 项</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: "#525252", fontFamily: "var(--font-sans)" }}>需关注(&lt;60%)</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: s.quality.lowConfidenceCount > 0 ? "#EE0000" : "#A3A3A3", fontFamily: "var(--font-geist-mono)" }}>{s.quality.lowConfidenceCount} 项</span>
          </div>
        </div>

        <div className="vl-card-static" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em", margin: 0 }}>浏览趋势</h3>
            <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>近 7 天</span>
          </div>
          {s.dailyViews.length > 0 && (
            <>
              <svg width="100" height="24" style={{ display: "block" }}>
                {(() => {
                  const max = Math.max(...s.dailyViews.map(d => d.count), 1);
                  const pts = s.dailyViews.map((d, i) => `${(i / (s.dailyViews.length - 1)) * 100},${24 - (d.count / max) * 24}`).join(" ");
                  return <polyline points={pts} fill="none" stroke="#0070F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />;
                })()}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                {s.dailyViews.map((d, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>{d.count}</div>
                    <div style={{ fontSize: 9, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 1 }}>{d.date}</div>
                  </div>
                ))}
              </div>
            </>
          )}
          {s.dailyViews.length === 0 && <div style={{ fontSize: 12, color: "#A3A3A3", fontFamily: "var(--font-sans)", padding: "20px 0", textAlign: "center" }}>暂无数据</div>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div className="vl-card-static" style={{ padding: "16px 20px", background: "#FAFAFA" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)", margin: "0 0 8px" }}>增长指标</h3>
          <div style={{ display: "flex", gap: 24 }}>
            <div><div style={{ fontSize: 20, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>{s.growth.totalOrdersPaid}</div><div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>已支付订单</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>¥{Number(s.growth.totalOrdersAmount).toLocaleString()}</div><div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>订单总额</div></div>
            <div><div style={{ fontSize: 20, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>{s.growth.totalConversations}</div><div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>AI 对话</div></div>
          </div>
        </div>
        <div className="vl-card-static" style={{ padding: "16px 20px", background: "#FAFAFA" }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)", margin: "0 0 8px" }}>系统状态</h3>
          <div style={{ fontSize: 12, color: "#404040", fontFamily: "var(--font-sans)", lineHeight: 1.8 }}>
            <div>爬虫调度 · <span style={{ fontWeight: 600, color: s.pipeline.activeCrawlJobs > 0 ? "#0070F3" : "#EE0000" }}>{s.pipeline.activeCrawlJobs > 0 ? "运行中" : "已停用"}</span></div>
            <div>审核队列 · {reviewBacklog > 10 ? <span style={{ fontWeight: 600, color: "#EE0000" }}>{reviewBacklog} 项积压</span> : <span style={{ fontWeight: 600, color: "#0070F3" }}>健康</span>}</div>
            <div>数据质量 · {qScore >= 80 ? <span style={{ fontWeight: 600, color: "#0070F3" }}>{qScore}% 良好</span> : <span style={{ fontWeight: 600, color: "#F5A623" }}>需提升</span>}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
