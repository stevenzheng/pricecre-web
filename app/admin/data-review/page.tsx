// app/admin/data-review/page.tsx — Agent Review Queue
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReviewItem {
  id: string;
  projectName: string;
  city: string;
  district: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number;
  dataSource: string;
  status: string;
  confidenceScore: number;
  createdAt: string;
}

const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };

export default function DataReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter] = useState("PENDING_REVIEW");

  const fetchData = async (p: number, t: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (t !== "all") params.set("type", t);
      params.set("status", statusFilter);
      const res = await fetch(`/api/admin/review-queue?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(page, typeFilter); }, [page, typeFilter]);

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED": return { bg: "#dcfce7", text: "#16a34a" };
      case "REJECTED": return { bg: "#fee2e2", text: "#dc2626" };
      default: return { bg: "#fef3c7", text: "#d97706" };
    }
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">审核队列</h1>
        <p className="admin-page-desc">
          Agent 管线产出待审资产 — {total} 条记录
        </p>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        {["all", "OFFICE", "SHOPS", "INDUSTRIAL"].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} style={{
            padding: "6px 14px", borderRadius: 6, border: "1px solid",
            borderColor: typeFilter === t ? "#533afd" : "#e2e4ea",
            background: typeFilter === t ? "rgba(83,58,253,0.08)" : "#fff",
            color: typeFilter === t ? "#533afd" : "#64748d",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>
            {t === "all" ? "全部" : typeLabel[t]}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d", fontSize: 14 }}>
          <div style={{ width: 24, height: 24, border: "2px solid #e2e4ea", borderTopColor: "#533afd", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }} />
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>
          <p style={{ fontSize: 16, marginBottom: 4 }}>暂无待审资产</p>
          <p style={{ fontSize: 13 }}>Agent 管线尚未产出数据，或所有资产已处理完毕</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="str-table">
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>城市</th>
                  <th>区域</th>
                  <th>业态</th>
                  <th style={{ textAlign: "right" }}>面价</th>
                  <th style={{ textAlign: "center" }}>置信度</th>
                  <th style={{ textAlign: "center" }}>状态</th>
                  <th>提交时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => window.location.href = `/admin/data-review/${p.id}`}>
                    <td style={{ fontWeight: 500, color: "#533afd" }}>{p.projectName}</td>
                    <td>{p.city}</td>
                    <td>{p.district}</td>
                    <td>{typeLabel[p.propertyType] || p.propertyType}</td>
                    <td className="str-td-mono" style={{ textAlign: "right" }}>¥{Number(p.faceRent).toFixed(1)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: p.confidenceScore >= 0.8 ? "#16a34a" : "#d97706" }}>
                        {(p.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block", padding: "1px 8px", borderRadius: 4, fontSize: 11,
                        background: statusColor(p.status).bg, color: statusColor(p.status).text,
                      }}>{p.status}</span>
                    </td>
                    <td className="str-td-hint">{new Date(p.createdAt).toLocaleDateString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: "#64748d", margin: 0 }}>第 {page} 页 / 共 {Math.ceil(total / 20)} 页 · {total} 条</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e4ea",
                background: page <= 1 ? "#f1f3f5" : "#fff", color: page <= 1 ? "#ccc" : "#333", fontSize: 12, cursor: page <= 1 ? "default" : "pointer",
              }}>上一页</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} style={{
                padding: "6px 12px", borderRadius: 6, border: "1px solid #e2e4ea",
                background: page * 20 >= total ? "#f1f3f5" : "#fff", color: page * 20 >= total ? "#ccc" : "#333", fontSize: 12, cursor: page * 20 >= total ? "default" : "pointer",
              }}>下一页</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
