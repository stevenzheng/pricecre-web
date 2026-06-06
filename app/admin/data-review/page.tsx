// app/admin/data-review/page.tsx — Card Layout
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Row { id: string; projectName: string; city: string; district: string; propertyType: string; faceRent: number; dataSource?: string; updatedAt?: string; createdAt?: string; status?: string; confidenceScore?: number; }
const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };
const typeColor: Record<string, string> = { OFFICE: "#0070F3", SHOPS: "#F5A623", INDUSTRIAL: "#0070F3" };

export default function DataReviewPage() {
  const [tab, setTab] = useState<"production"|"review">("production");
  const [items, setItems] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 24;

  const fetchData = async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (cityFilter !== "all") params.set("city", cityFilter);
    if (search.trim()) params.set("search", search.trim());
    const url = tab === "production" ? `/api/admin/properties?${params}` : `/api/admin/review-queue?${params}&status=PENDING_REVIEW`;
    try { const d = await fetch(url).then(r => r.json()); setItems(d.items || []); setTotal(d.total || 0); } catch { setItems([]); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [tab, page, typeFilter, cityFilter]);

  // Fetch available cities
  useEffect(() => {
    fetch("/api/admin/properties?limit=500&sort=city").then(r => r.json()).then(d => {
      const c = [...new Set((d.items || []).map((p: any) => p.city))].filter(Boolean).sort() as string[];
      setCities(c);
    }).catch(() => {});
  }, [tab]);

  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const batchAction = async (action: string) => {
    if (selected.size === 0) return;
    const reason = action === "reject" ? prompt("驳回原因：") || "" : "";
    if (action === "approve" && !confirm(`批准 ${selected.size} 项？`)) return;
    await fetch("/api/admin/review-queue/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], action, rejectReason: reason }) });
    setSelected(new Set()); fetchData();
  };

  const deleteProperty = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation(); e.preventDefault();
    if (!confirm(`确定永久删除「${name}」？此操作不可撤销。`)) return;
    await fetch(`/api/admin/properties/${id}`, { method: "DELETE" });
    fetchData();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div><h1 className="vl-page-title">资产数据</h1><p className="vl-page-desc">{tab === "production" ? "生产数据" : "审核队列"} · {total} 条</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          {tab === "review" && selected.size > 0 && (
            <><button onClick={() => batchAction("approve")} className="vl-btn-primary" style={{ fontSize: 13 }}>批准 ({selected.size})</button>
            <button onClick={() => batchAction("reject")} className="vl-btn-danger" style={{ fontSize: 13 }}>驳回</button></>
          )}
        </div>
      </div>

      {/* Tab + Search + Filter */}
      <div style={{ display: "flex", gap: 0, marginBottom: 12, flexWrap: "wrap" }}>
        {["production", "review"].map(t => (
          <button key={t} onClick={() => { setTab(t as any); setPage(1); setSelected(new Set()); }}
            style={{ padding: "7px 14px", border: "none", borderBottom: tab === t ? "2px solid #0070F3" : "2px solid transparent", background: "transparent", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", color: tab === t ? "#0070F3" : "#737373", cursor: "pointer" }}>
            {t === "production" ? "生产数据" : "审核队列"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input className="vl-input" style={{ width: 200, fontSize: 13, padding: "6px 10px" }} placeholder="搜索项目名称..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && (setPage(1), fetchData())} />
        <select className="vl-select" style={{ width: 120, fontSize: 13, padding: "6px 10px" }} value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}>
          <option value="all">全部城市</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4 }}>
          {["all", "OFFICE", "SHOPS", "INDUSTRIAL"].map(t => (
            <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
              style={{ padding: "5px 12px", borderRadius: 4, border: `1px solid ${typeFilter === t ? "#0070F3" : "#D4D4D4"}`, background: typeFilter === t ? "rgba(0,112,243,0.06)" : "transparent", color: typeFilter === t ? "#0070F3" : "#525252", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              {t === "all" ? "全部" : typeLabel[t]}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginLeft: "auto" }}>
          {page}/{totalPages || 1} 页
        </span>
      </div>

      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : items.length === 0 ? (
        <div className="vl-empty"><p className="vl-empty-title">暂无数据</p></div>
      ) : (
        <>
          {/* Card Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
            {items.map(item => {
              const isSelected = selected.has(item.id);
              return (
                <div key={item.id}
                  style={{
                    background: isSelected ? "rgba(0,112,243,0.03)" : "#FFFFFF",
                    border: `1px solid ${isSelected ? "rgba(0,112,243,0.3)" : "#E5E5E5"}`,
                    borderRadius: 6, padding: "14px 16px",
                    transition: "border-color 0.12s, background 0.12s",
                    cursor: tab === "review" ? "pointer" : "default",
                    position: "relative",
                  }}
                  onClick={() => { if (tab === "review") toggleOne(item.id); }}
                >
                  {/* Top row: type badge + delete + checkbox */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, fontFamily: "var(--font-sans)",
                      padding: "2px 6px", borderRadius: 3,
                      background: "rgba(0,112,243,0.06)", color: typeColor[item.propertyType] || "#0070F3",
                    }}>
                      {typeLabel[item.propertyType]}
                    </span>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button onClick={(e) => deleteProperty(e, item.id, item.projectName)}
                        title="删除" style={{ width: 22, height: 22, border: "none", borderRadius: 4, background: "transparent", cursor: "pointer", color: "#A3A3A3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}
                        onMouseEnter={e => (e.currentTarget.style.color = "#E91E63")} onMouseLeave={e => (e.currentTarget.style.color = "#A3A3A3")}>
                        ✕
                      </button>
                      {tab === "review" && (
                        <input type="checkbox" checked={isSelected} onChange={() => toggleOne(item.id)}
                          style={{ width: 16, height: 16, accentColor: "#0070F3", cursor: "pointer", margin: 0 }}
                          onClick={e => e.stopPropagation()} />
                      )}
                    </div>
                  </div>

                  {/* Project name */}
                  <Link href={`/admin/data-review/${item.id}?source=${tab}`} style={{ textDecoration: "none" }}
                    onClick={e => { if (tab === "review") e.stopPropagation(); }}>
                    <h3 style={{
                      fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)",
                      letterSpacing: "-0.02em", margin: "0 0 6px", lineHeight: 1.3,
                    }}>
                      {item.projectName}
                    </h3>
                  </Link>

                  {/* Meta row */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#525252", fontFamily: "var(--font-sans)" }}>{item.city}</span>
                    <span style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>·</span>
                    <span style={{ fontSize: 11, color: "#525252", fontFamily: "var(--font-sans)" }}>{item.district}</span>
                  </div>

                  {/* Bottom row: rent + date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace",
                      color: "#171717"
                    }}>
                      ¥{Number(item.faceRent).toFixed(1)}
                      <span style={{ fontSize: 10, fontWeight: 400, color: "#A3A3A3", marginLeft: 2 }}>/㎡/天</span>
                    </span>
                    <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("zh-CN") : "—"}
                    </span>
                  </div>

                  {/* Confidence (review mode) */}
                  {tab === "review" && (
                    <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "#F7F7F7", overflow: "hidden" }}>
                      <div style={{ height: "100%", borderRadius: 2, background: (item.confidenceScore ?? 1) >= 0.7 ? "#0070F3" : "#F5A623", width: `${((item.confidenceScore ?? 1) * 100).toFixed(0)}%`, transition: "width 0.3s ease" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 4 }}>
              <button disabled={page <= 1} onClick={() => setPage(1)} className="vl-btn-ghost">«</button>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="vl-btn-ghost">‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const n = Math.max(1, page - 2) + i; if (n > totalPages) return null;
                return <button key={n} onClick={() => setPage(n)}
                  style={{ minWidth: 32, height: 32, border: "1px solid", borderRadius: 6, borderColor: n === page ? "#0070F3" : "#E5E5E5", background: n === page ? "#0070F3" : "#fff", color: n === page ? "#fff" : "#171717", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{n}</button>;
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="vl-btn-ghost">›</button>
              <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="vl-btn-ghost">»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
