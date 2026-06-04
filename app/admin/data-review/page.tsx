"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface AssetRow {
  id: string; projectName: string; city: string; district: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  faceRent: number; dataSource: string; updatedAt?: string; createdAt?: string;
  status?: string; confidenceScore?: number;
}

const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function DataReviewPage() {
  // Tabs: production (CommercialProperty) / review (AgentReviewQueue)
  const [tab, setTab] = useState<"production" | "review">("production");
  const [items, setItems] = useState<AssetRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 20;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (search.trim()) params.set("search", search.trim());

      let url: string;
      if (tab === "production") {
        params.set("sort", sortCol); params.set("order", sortOrder);
        url = `/api/admin/properties?${params}`;
      } else {
        params.set("status", "PENDING_REVIEW");
        url = `/api/admin/review-queue?${params}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch { setItems([]); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [tab, page, typeFilter, sortCol, sortOrder]);

  // Search: submit on enter
  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { setPage(1); fetchData(); }
  };

  const handleSort = (col: string) => {
    if (sortCol === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortOrder("asc"); }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortCol !== col) return <span style={{ opacity: 0.3 }}> ⇅</span>;
    return <span style={{ color: "#2563EB" }}> {sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  // Batch actions (review tab only)
  const batchApprove = async () => {
    if (selected.size === 0) return;
    if (!confirm(`批准 ${selected.size} 项？`)) return;
    await fetch("/api/admin/review-queue/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], action: "approve" }) });
    setSelected(new Set()); fetchData();
  };

  const toggleSelect = (id: string) => setSelected(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.id)));

  const totalPages = Math.ceil(total / limit);
  const pageNumbers: number[] = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pageNumbers.push(i);

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="admin-page-title">资产数据</h1>
          <p className="admin-page-desc">生产数据 + 审核队列 · 共 {total} 条</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "review" && selected.size > 0 && (
            <button onClick={batchApprove} className="btn-primary" style={{ fontSize: 12, padding: "6px 12px" }}>批量批准 ({selected.size})</button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, border: "1px solid #e5edf5", borderRadius: 6, overflow: "hidden", width: "fit-content" }}>
        <button onClick={() => { setTab("production"); setPage(1); }} style={{
          padding: "7px 16px", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: tab === "production" ? "#2563EB" : "#fff", color: tab === "production" ? "#fff" : "#64748d",
        }}>生产数据</button>
        <button onClick={() => { setTab("review"); setPage(1); }} style={{
          padding: "7px 16px", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
          background: tab === "review" ? "#2563EB" : "#fff", color: tab === "review" ? "#fff" : "#64748d",
        }}>审核队列</button>
      </div>

      {/* Toolbar: search + filter */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <input
          type="text" placeholder="搜索项目名称..." value={search}
          onChange={e => setSearch(e.target.value)} onKeyDown={handleSearch}
          style={{ padding: "7px 12px", border: "1px solid #e5edf5", borderRadius: 4, fontSize: 13, color: "#1A1A2E", width: 240, outline: "none", fontFamily: "MiSans, sans-serif" }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {["all", "OFFICE", "SHOPS", "INDUSTRIAL"].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }} style={{
              padding: "5px 12px", borderRadius: 4, border: "1px solid", fontSize: 11, fontWeight: 500, cursor: "pointer",
              borderColor: typeFilter === t ? "#2563EB" : "#e5edf5",
              background: typeFilter === t ? "rgba(37,99,235,0.08)" : "#fff",
              color: typeFilter === t ? "#2563EB" : "#64748d",
            }}>{t === "all" ? "全部" : typeLabel[t]}</button>
          ))}
        </div>
        <span style={{ fontSize: 11, color: "#64748d", marginLeft: "auto" }}>共 {total} 条</span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>
          <div style={{ width: 24, height: 24, border: "2px solid #e5edf5", borderTopColor: "#2563EB", borderRadius: "50%", animation: "spin 0.6s linear infinite", margin: "0 auto 12px" }} />
          加载中...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", border: "1px solid #e5edf5", borderRadius: 6 }}>
          <p style={{ fontSize: 16, color: "#64748d" }}>暂无数据</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="str-table">
              <thead>
                <tr>
                  {tab === "review" && <th style={{ width: 40 }}><input type="checkbox" checked={selected.size === items.length && items.length > 0} onChange={toggleAll} /></th>}
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("projectName")}>项目名称<SortIcon col="projectName" /></th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("city")}>城市<SortIcon col="city" /></th>
                  <th>区域</th>
                  <th>业态</th>
                  <th style={{ textAlign: "right", cursor: "pointer" }} onClick={() => handleSort("faceRent")}>面价<SortIcon col="faceRent" /></th>
                  <th style={{ textAlign: "center" }}>置信度</th>
                  {tab === "review" && <th style={{ textAlign: "center" }}>状态</th>}
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("updatedAt")}>更新时间<SortIcon col="updatedAt" /></th>
                </tr>
              </thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    {tab === "review" && <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>}
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/admin/data-review/${p.id}?source=${tab}`} style={{ color: "#2563EB", textDecoration: "none" }}>{p.projectName}</Link>
                    </td>
                    <td>{p.city}</td>
                    <td>{p.district}</td>
                    <td><span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10, background: "rgba(37,99,235,0.08)", color: "#2563EB" }}>{typeLabel[p.propertyType]}</span></td>
                    <td className="str-td-mono" style={{ textAlign: "right" }}>¥{Number(p.faceRent).toFixed(1)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 11, color: (p.confidenceScore ?? 1) >= 0.8 ? "#059669" : "#D97706" }}>{((p.confidenceScore ?? 1) * 100).toFixed(0)}%</span>
                    </td>
                    {tab === "review" && (
                      <td style={{ textAlign: "center" }}>
                        <span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 4, fontSize: 10, background: "#fef3c7", color: "#d97706" }}>{p.status || "PENDING"}</span>
                      </td>
                    )}
                    <td className="str-td-hint">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("zh-CN") : p.createdAt ? new Date(p.createdAt).toLocaleDateString("zh-CN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 4 }}>
              <button disabled={page <= 1} onClick={() => setPage(1)} className="btn-ghost">«</button>
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn-ghost">‹</button>
              {pageNumbers.map(n => (
                <button key={n} onClick={() => setPage(n)} style={{
                  minWidth: 32, height: 32, border: "1px solid", borderRadius: 4, fontSize: 13, cursor: "pointer",
                  borderColor: n === page ? "#2563EB" : "#e5edf5", background: n === page ? "#2563EB" : "#fff", color: n === page ? "#fff" : "#1A1A2E",
                }}>{n}</button>
              ))}
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn-ghost">›</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="btn-ghost">»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
