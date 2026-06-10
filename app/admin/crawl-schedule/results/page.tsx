// app/admin/crawl-schedule/results/page.tsx — 单个爬取格子结果
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface PropertyRow {
  id: string; projectName: string; city: string; district: string;
  propertyType: string; faceRent: number; dataSource: string;
  confidenceScore: number; updatedAt: string;
}

const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };

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
    fetch("/api/admin/mock-properties").then(r => r.json()).then(data => {
      const filtered = (data.properties || []).filter((p: any) => 
        p.city === city && p.propertyType === type
      );
      setProperties(filtered);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [city, type]);

  if (loading) return <div style={{ padding: 24, color: "#737373" }}>加载中...</div>;
  if (!city || !type) return <div style={{ padding: 24, color: "#737373" }}>缺少城市或业态参数</div>;

  const cityMap: Record<string, string> = { shanghai: "上海", beijing: "北京", shenzhen: "深圳", guangzhou: "广州", hangzhou: "杭州", chengdu: "成都", suzhou: "苏州", changsha: "长沙", xian: "西安" };

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <button onClick={() => router.back()} style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "#737373" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            </button>
            <p style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: 0 }}>
              {cityMap[city] || city} · {typeLabels[type] || type}
            </p>
          </div>
          <p style={{ fontSize: 13, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>
            本次爬取结果：{properties.length} 条资产
          </p>
        </div>
      </div>

      {properties.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>暂无数据</p>
          <p style={{ fontSize: 12, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>该网格的数据尚未爬取或结果为空</p>
        </div>
      ) : (
        <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5E5", background: "#FAFAFA" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>项目名称</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>区域</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>面价</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>可信度</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>数据源</th>
                  <th style={{ padding: "10px 14px" }}></th>
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>{p.projectName}</td>
                    <td style={{ padding: "10px 14px", color: "#404040", fontFamily: "var(--font-sans)" }}>{p.district}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#171717" }}>¥{(p.faceRent||0).toFixed(1)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: (p.confidenceScore||0) >= 0.8 ? "#10B981" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EF4444" }}>
                      {((p.confidenceScore||0)*100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "10px 14px", color: "#737373", fontSize: 12 }}>{p.dataSource}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => router.push(`/admin/data-review/${p.id}`)}
                        style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                        编辑
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
    <Suspense fallback={<div style={{ padding: 24, color: "#737373" }}>加载中...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
