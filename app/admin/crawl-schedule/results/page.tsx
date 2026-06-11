// app/admin/crawl-schedule/results/page.tsx — 单个爬取格子结果
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PropertyRow {
  id: string; projectName: string; city: string; district: string;
  propertyType: string; faceRent: number; dataSource: string;
  confidenceScore: number; status?: string; createdAt?: string;
}

const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };
const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING_REVIEW: { label: "待审核", color: "#F5A623" },
  APPROVED: { label: "已通过", color: "#10B981" },
  REJECTED: { label: "已驳回", color: "#EF4444" },
  CRITICAL_MISSING: { label: "数据缺损", color: "#EE0000" },
};
const cityMap: Record<string, string> = { shanghai: "上海", beijing: "北京", shenzhen: "深圳", guangzhou: "广州", hangzhou: "杭州", chengdu: "成都", suzhou: "苏州", changsha: "长沙", xian: "西安" };

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const city = searchParams.get("city") || "";
  const type = searchParams.get("type") || "";
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!city || !type) { setLoading(false); return; }
    setLoading(true);
    // 读取真实抓取数据（agent_review_queue 审核队列），本地 Agent 与在线抓取写入的都在这里
    const cityZh = cityMap[city] || city;
    fetch(`/api/admin/review-queue?city=${encodeURIComponent(cityZh)}&type=${encodeURIComponent(type)}&status=all&limit=200`)
      .then(r => r.json())
      .then(data => {
        setProperties(Array.isArray(data.items) ? data.items : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [city, type]);

  if (loading) return <div className="bw-loading"><div className="bw-spin" /><span>加载中</span></div>;
  if (!city || !type) return <div style={{ padding: 24, color: "var(--bw-muted)" }}>缺少城市或业态参数</div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <button onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--bw-muted)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: 0 }}>
              {cityMap[city] || city} · {typeLabels[type] || type}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>
            抓取结果（审核队列）：{properties.length} 条 · 待审核 {properties.filter(p => p.status === "PENDING_REVIEW").length} 条
          </p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>暂无抓取数据</p>
          <p style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>该城市×业态尚未有抓取入队的数据。在爬取计划页点击对应格子触发抓取，或运行本地 Agent（npx tsx agent/run-pipeline.ts）后数据会出现在这里</p>
        </div>
      ) : (
        <div style={{ background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bw-line)", background: "var(--bw-panel)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>项目名称</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>区域</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>面价</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>可信度</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>数据源</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>状态</th>
                  <th style={{ padding: "10px 14px" }}></th>
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--bw-line-soft)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--bw-text)", fontFamily: "var(--font-sans)" }}>{p.projectName}</td>
                    <td style={{ padding: "10px 14px", color: "var(--bw-text-2)", fontFamily: "var(--font-sans)" }}>{p.district}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--bw-text)" }}>¥{(p.faceRent||0).toFixed(1)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: (p.confidenceScore||0) >= 0.8 ? "#10B981" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EF4444" }}>
                      {((p.confidenceScore||0)*100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--bw-muted)", fontSize: 12, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.dataSource}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 4, fontFamily: "var(--font-sans)", background: `${statusLabels[p.status || ""]?.color || "var(--bw-hint)"}15`, color: statusLabels[p.status || ""]?.color || "var(--bw-hint)" }}>
                        {statusLabels[p.status || ""]?.label || p.status || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => router.push(`/admin/submissions`)}
                        style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                        去审核
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrap in Suspense boundary for useSearchParams
export default function CrawlResultsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, color: "var(--bw-muted)" }}>加载中...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
