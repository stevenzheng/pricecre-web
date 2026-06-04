"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Row { id: string; projectName: string; city: string; district: string; propertyType: string; faceRent: number; dataSource?: string; updatedAt?: string; createdAt?: string; status?: string; confidenceScore?: number; }
const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function DataReviewPage() {
  const [tab, setTab] = useState<"production"|"review">("production");
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search.trim()) params.set("search", search.trim());
    const url = tab === "production" ? `/api/admin/properties?${params}` : `/api/admin/review-queue?${params}&status=PENDING_REVIEW`;
    try { const d = await fetch(url).then(r => r.json()); setItems(d.items || []); setTotal(d.total || 0); } catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [tab, page, typeFilter]);

  const toggleAll = () => setSelected(s => s.size === items.length ? new Set() : new Set(items.map(i => i.id)));
  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const batchAction = async (action: string) => {
    if (selected.size === 0) return;
    const reason = action === "reject" ? prompt("驳回原因：") || "" : "";
    if (action === "approve" && !confirm(`批准 ${selected.size} 项？`)) return;
    await fetch("/api/admin/review-queue/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], action, rejectReason: reason }) });
    setSelected(new Set()); fetchData();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1 className="gh-page-title">资产数据</h1><p className="gh-page-desc">{tab === "production" ? "生产数据" : "审核队列"} · {total} 条</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "review" && selected.size > 0 && (<><button onClick={() => batchAction("approve")} className="gh-btn-primary" style={{ fontSize: 13, padding: "6px 14px" }}>批准 ({selected.size})</button><button onClick={() => batchAction("reject")} className="gh-btn-danger" style={{ fontSize: 13, padding: "6px 14px" }}>驳回</button></>)}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
        {["production", "review"].map(t => (
          <button key={t} onClick={() => { setTab(t as any); setPage(1); }} className="gh-filter-tab" style={{ borderBottom: tab === t ? "2px solid #3EB0EF" : "2px solid transparent", padding: "8px 16px", borderRadius: 0, fontSize: 14 }}>{t === "production" ? "生产数据" : "审核队列"}</button>
        ))}
      </div>

      {/* Search + Filter */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input className="gh-input" style={{ width: 260 }} placeholder="搜索项目名称..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && (setPage(1), fetchData())} />
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "OFFICE", "SHOPS", "INDUSTRIAL"].map(t => <button key={t} className={`gh-filter-tab${typeFilter === t ? " active" : ""}`} onClick={() => { setTypeFilter(t); setPage(1); }}>{t === "all" ? "全部" : typeLabel[t]}</button>)}
        </div>
      </div>

      {loading ? <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div> : items.length === 0 ? <div className="gh-empty"><p className="gh-empty-title">暂无数据</p><p className="gh-empty-desc">{tab === "production" ? "无生产数据" : "暂无待审资产"}</p></div> : (
        <>
          <table className="gh-table">
            <thead><tr>
              {tab === "review" && <th style={{ width: 40 }}><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} /></th>}
              <th>项目名称</th><th>城市</th><th>区域</th><th>业态</th><th style={{ textAlign: "right" }}>面价</th><th style={{ textAlign: "center" }}>置信度</th><th>时间</th>
            </tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id}>
                  {tab === "review" && <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} /></td>}
                  <td style={{ fontWeight: 600 }}><Link href={`/admin/data-review/${p.id}?source=${tab}`} style={{ color: "#3EB0EF", textDecoration: "none" }}>{p.projectName}</Link></td>
                  <td>{p.city}</td><td>{p.district}</td>
                  <td><span className="gh-badge gh-badge-accent">{typeLabel[p.propertyType]}</span></td>
                  <td className="gh-mono" style={{ textAlign: "right" }}>¥{Number(p.faceRent).toFixed(1)}</td>
                  <td style={{ textAlign: "center" }}><span style={{ fontSize: 13, color: (p.confidenceScore ?? 1) >= 0.8 ? "#30CF43" : "#F0A830" }}>{((p.confidenceScore ?? 1) * 100).toFixed(0)}%</span></td>
                  <td className="gh-hint">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("zh-CN") : p.createdAt ? new Date(p.createdAt).toLocaleDateString("zh-CN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 4 }}>
              <button disabled={page <= 1} onClick={() => setPage(1)} className="gh-btn-ghost">«</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="gh-btn-ghost">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, page - 2) + i; if (n > totalPages) return null;
                return <button key={n} onClick={() => setPage(n)} style={{ minWidth: 32, height: 32, border: "1px solid", borderRadius: 6, borderColor: n === page ? "#3EB0EF" : "#E5E7EB", background: n === page ? "#3EB0EF" : "#fff", color: n === page ? "#fff" : "#15171A", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{n}</button>;
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="gh-btn-ghost">›</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="gh-btn-ghost">»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
