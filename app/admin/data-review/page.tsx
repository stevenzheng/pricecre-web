"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ReviewItem {
  id: string; projectName: string; city: string; district: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number; dataSource: string; status: string;
  confidenceScore: number; createdAt: string;
}

const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function DataReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchData = async (p: number, t: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20", status: "PENDING_REVIEW" });
      if (t !== "all") params.set("type", t);
      const res = await fetch(`/api/admin/review-queue?${params}`);
      const data = await res.json();
      setItems(data.items || []); setTotal(data.total || 0);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(page, typeFilter); }, [page, typeFilter]);

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  const batchApprove = async () => {
    if (selected.size === 0) return;
    if (!confirm(`批准 ${selected.size} 项资产？`)) return;
    await fetch("/api/admin/review-queue/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], action: "approve" }) });
    setSelected(new Set()); fetchData(page, typeFilter);
  };

  const batchReject = async () => {
    if (selected.size === 0) return;
    const reason = prompt("批量驳回原因：") || "";
    if (!reason) return;
    await fetch("/api/admin/review-queue/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], action: "reject", rejectReason: reason }) });
    setSelected(new Set()); fetchData(page, typeFilter);
  };

  const statusColor = (s: string) => {
    switch (s) { case "APPROVED": return { bg: "#dcfce7", text: "#16a34a" }; case "REJECTED": return { bg: "#fee2e2", text: "#dc2626" }; default: return { bg: "#fef3c7", text: "#d97706" }; }
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="admin-page-title">审核队列</h1>
          <p className="admin-page-desc">Agent 管线待审资产 — {total} 条</p>
        </div>
        {selected.size > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748d", padding: "6px 0" }}>已选 {selected.size} 项</span>
            <button onClick={batchApprove} className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>批量批准</button>
            <button onClick={batchReject} className="btn-danger" style={{ fontSize: 12, padding: "6px 12px" }}>批量驳回</button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        {["all", "OFFICE", "SHOPS", "INDUSTRIAL"].map((t) => (
          <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} style={{
            padding: "6px 14px", borderRadius: 4, border: "1px solid",
            borderColor: typeFilter === t ? "#2563EB" : "#e5edf5",
            background: typeFilter === t ? "rgba(37,99,235,0.08)" : "#fff",
            color: typeFilter === t ? "#2563EB" : "#64748d",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>{t === "all" ? "全部" : typeLabel[t]}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>
          <div style={{ width: 24, height: 24, border: "2px solid #e5edf5", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }} />
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", border: "1px solid #e5edf5", borderRadius: 6 }}>
          <p style={{ fontSize: 16, color: "#64748d" }}>暂无待审资产</p>
          <p style={{ fontSize: 13, color: "#64748d" }}>触发全量抓取后，Agent 产出将自动进入此队列</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="str-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} /></th>
                  <th>项目名称</th>
                  <th>城市</th>
                  <th>区域</th>
                  <th>业态</th>
                  <th style={{ textAlign: "right" }}>面价</th>
                  <th style={{ textAlign: "center" }}>置信度</th>
                  <th>提交时间</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/admin/data-review/${p.id}`} style={{ color: "#2563EB", textDecoration: "none" }}>{p.projectName}</Link>
                    </td>
                    <td>{p.city}</td>
                    <td>{p.district}</td>
                    <td><span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10, background: "rgba(37,99,235,0.08)", color: "#2563EB" }}>{typeLabel[p.propertyType]}</span></td>
                    <td className="str-td-mono" style={{ textAlign: "right" }}>¥{Number(p.faceRent).toFixed(1)}</td>
                    <td style={{ textAlign: "center" }}><span style={{ fontSize: 11, color: p.confidenceScore >= 0.8 ? "#059669" : "#D97706" }}>{(p.confidenceScore * 100).toFixed(0)}%</span></td>
                    <td className="str-td-hint">{new Date(p.createdAt).toLocaleDateString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 12, color: "#64748d", margin: 0 }}>第 {page} 页 / 共 {Math.ceil(total / 20)} 页 · {total} 条</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #e5edf5", background: page <= 1 ? "#f1f3f5" : "#fff", color: page <= 1 ? "#ccc" : "#333", fontSize: 12, cursor: page <= 1 ? "default" : "pointer" }}>上一页</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(page + 1)} style={{ padding: "6px 12px", borderRadius: 4, border: "1px solid #e5edf5", background: page * 20 >= total ? "#f1f3f5" : "#fff", color: page * 20 >= total ? "#ccc" : "#333", fontSize: 12, cursor: page * 20 >= total ? "default" : "pointer" }}>下一页</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
