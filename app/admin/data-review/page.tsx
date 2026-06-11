// app/admin/data-review/page.tsx — Asset Data Manager
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ViewMode = "list" | "card";

const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };
const cities = ["上海","北京","广州","成都","杭州","深圳","苏州","西安","长沙"];

interface PropertyRow {
  id: string; projectName: string; city: string; district: string;
  propertyType: string; faceRent: number; dataSource: string;
  confidenceScore: number; createdAt: string; isMock?: boolean;
  vacancy: number | null; capRate: number | null;
  netEffectiveRent: number | null; salesEfficiency: number | null;
}

// 排序键（从客户视角挑选的核心精算指标；坪效仅商业零售业态有值）
type SortKey = "faceRent" | "vacancy" | "capRate" | "netEffectiveRent" | "salesEfficiency" | "confidenceScore";
const SORT_OPTIONS: { key: SortKey; label: string; hint?: string }[] = [
  { key: "faceRent", label: "租金" },
  { key: "vacancy", label: "空置率" },
  { key: "capRate", label: "资本化率" },
  { key: "netEffectiveRent", label: "净有效租金" },
  { key: "salesEfficiency", label: "坪效", hint: "商业零售" },
  { key: "confidenceScore", label: "可信度" },
];

export default function DataReviewPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    projectName: "", city: "上海", district: "浦东", propertyType: "OFFICE",
    faceRent: "", dataSource: "manual", confidenceScore: "0.9",
  });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  // 筛选：分城市、分业态、关键词
  const [filterCity, setFilterCity] = useState("全部");
  const [filterType, setFilterType] = useState("全部");
  const [search, setSearch] = useState("");
  // 排序：点击选中指标，再次点击切换升/降序
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDesc, setSortDesc] = useState(true);
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDesc(d => !d);
    else { setSortKey(key); setSortDesc(true); }
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/properties");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProperties((data.properties || []).map((p: any) => ({
        id: String(p.id || ""),
        projectName: String(p.projectName || ""),
        city: String(p.city || ""),
        district: String(p.district || ""),
        propertyType: String(p.propertyType || "OFFICE"),
        faceRent: Number(p.faceRent) || 0,
        dataSource: String(p.dataSource || ""),
        confidenceScore: Number(p.confidenceScore) || 0,
        createdAt: String(p.createdAt || ""),
        isMock: !!p.isMock,
        vacancy: p.vacancy ?? null,
        capRate: p.capRate ?? null,
        netEffectiveRent: p.netEffectiveRent ?? null,
        salesEfficiency: p.salesEfficiency ?? null,
      })));
    } catch (e: any) {
      setError("数据加载失败，请刷新重试");
      setProperties([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName) { setMsg("项目名称必填"); return; }
    setAdding(true); setMsg("");
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, faceRent: parseFloat(form.faceRent) || 0, confidenceScore: parseFloat(form.confidenceScore) || 0.9 }),
      });
      const d = await res.json();
      if (d.success) { setMsg("添加成功！"); setShowAddForm(false); fetchData(); }
      else { setMsg(d.error || "添加失败"); }
    } catch { setMsg("网络错误"); }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除该资产？删除后不可恢复。")) return;
    try {
      const res = await fetch(`/api/admin/properties?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) { setMsg("删除成功"); fetchData(); }
      else { setMsg(d.error || "删除失败"); }
    } catch { setMsg("网络错误，删除失败"); }
  };

  // 应用筛选（数据已全量加载，切换即时生效）
  let filtered = properties.filter(p => {
    if (filterCity !== "全部" && p.city !== filterCity) return false;
    if (filterType !== "全部" && p.propertyType !== filterType) return false;
    if (search && !p.projectName.toLowerCase().includes(search.toLowerCase()) && !p.district.includes(search)) return false;
    return true;
  });

  // 应用排序（无该指标值的排在末尾）
  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey];
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      return sortDesc ? Number(bv) - Number(av) : Number(av) - Number(bv);
    });
  }

  if (loading) return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 13, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>加载中...</p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>资产数据管理</p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>
            {filterCity === "全部" && filterType === "全部" && !search ? `共 ${properties.length} 条资产` : `筛选结果 ${filtered.length} 条 / 共 ${properties.length} 条`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ display: "inline-flex", borderRadius: 6, border: "1px solid var(--bw-line)", overflow: "hidden" }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "5px 10px", border: "none", background: viewMode === "list" ? "#0070F3" : "var(--bw-surface)", color: viewMode === "list" ? "#FFF" : "var(--bw-muted)", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>列表</button>
            <button onClick={() => setViewMode("card")} style={{ padding: "5px 10px", border: "none", borderLeft: "1px solid var(--bw-line)", background: viewMode === "card" ? "#0070F3" : "var(--bw-surface)", color: viewMode === "card" ? "#FFF" : "var(--bw-muted)", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>卡片</button>
          </div>
          <button onClick={fetchData} className="vl-btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>刷新</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="vl-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
            {showAddForm ? "取消" : "+ 手动添加"}
          </button>
          <button onClick={() => router.push('/admin/corrections')} className="vl-btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>纠错审核</button>
        </div>
      </div>

      {/* 筛选栏：分城市 / 分业态 / 搜索 */}
      <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)", width: 32, flexShrink: 0 }}>城市</span>
          {["全部", ...cities].map(c => {
            const active = filterCity === c;
            const count = c === "全部" ? properties.length : properties.filter(p => p.city === c).length;
            return (
              <button key={c} onClick={() => setFilterCity(c)}
                style={{ padding: "4px 10px", borderRadius: 6, border: active ? "1px solid #0070F3" : "1px solid var(--bw-line)", background: active ? "rgba(0,112,243,0.06)" : "var(--bw-surface)", color: active ? "#0070F3" : "var(--bw-text-2)", fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>
                {c} <span style={{ fontSize: 10, color: active ? "#0070F3" : "var(--bw-hint)" }}>{count}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)", width: 32, flexShrink: 0 }}>业态</span>
          {[["全部","全部"], ...Object.entries(typeLabels)].map(([k, v]) => {
            const active = filterType === k;
            const count = k === "全部" ? properties.length : properties.filter(p => p.propertyType === k).length;
            return (
              <button key={k} onClick={() => setFilterType(k)}
                style={{ padding: "4px 10px", borderRadius: 6, border: active ? "1px solid #0070F3" : "1px solid var(--bw-line)", background: active ? "rgba(0,112,243,0.06)" : "var(--bw-surface)", color: active ? "#0070F3" : "var(--bw-text-2)", fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}>
                {v} <span style={{ fontSize: 10, color: active ? "#0070F3" : "var(--bw-hint)" }}>{count}</span>
              </button>
            );
          })}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索项目名称 / 区域..."
            style={{ marginLeft: "auto", width: 200, padding: "5px 10px", border: "1px solid var(--bw-line)", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", outline: "none" }} />
          {(filterCity !== "全部" || filterType !== "全部" || search) && (
            <button onClick={() => { setFilterCity("全部"); setFilterType("全部"); setSearch(""); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "none", color: "var(--bw-muted)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer", textDecoration: "underline" }}>清除筛选</button>
          )}
        </div>
        {/* 排序：点击选中指标，再次点击切换升/降序 */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)", width: 32, flexShrink: 0 }}>排序</span>
          {SORT_OPTIONS.map(o => {
            const active = sortKey === o.key;
            return (
              <button key={o.key} onClick={() => handleSort(o.key)}
                title={active ? `再次点击切换为${sortDesc ? "升序" : "降序"}` : `按${o.label}排序`}
                style={{ padding: "4px 10px", borderRadius: 6, border: active ? "1px solid #0D9488" : "1px solid var(--bw-line)", background: active ? "rgba(13,148,136,0.08)" : "var(--bw-surface)", color: active ? "#0D9488" : "var(--bw-text-2)", fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 3 }}>
                {o.label}{o.hint && <span style={{ fontSize: 9, color: "var(--bw-hint)" }}>({o.hint})</span>}
                {active && <span style={{ fontSize: 10 }}>{sortDesc ? "↓" : "↑"}</span>}
              </button>
            );
          })}
          {sortKey && (
            <button onClick={() => setSortKey(null)}
              style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "none", color: "var(--bw-muted)", fontSize: 12, fontFamily: "var(--font-sans)", cursor: "pointer", textDecoration: "underline" }}>取消排序</button>
          )}
        </div>
      </div>

      {msg && <div style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", background: msg.includes("成功") ? "rgba(0,112,243,0.06)" : "rgba(238,0,0,0.06)", color: msg.includes("成功") ? "#0070F3" : "#EE0000" }}>{msg}</div>}
      {error && <div style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", background: "rgba(238,0,0,0.06)", color: "#EE0000" }}>{error}</div>}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: 16, padding: 16, background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>项目名称 *</label><input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} required /></div>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>城市</label><select value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }}>{cities.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>区域</label><input value={form.district} onChange={e => setForm({...form, district: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} /></div>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>业态</label><select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }}>{Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>面价 (元/㎡/天)</label><input type="number" step="0.1" value={form.faceRent} onChange={e => setForm({...form, faceRent: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} /></div>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>可信度 (0~1)</label><input type="number" step="0.05" min="0" max="1" value={form.confidenceScore} onChange={e => setForm({...form, confidenceScore: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} /></div>
          <div><label style={{ fontSize: 11, color: "var(--bw-muted)", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>数据来源</label><input value={form.dataSource} onChange={e => setForm({...form, dataSource: e.target.value})} placeholder="如：manual / 点点租" style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--bw-line-strong)", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} /></div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={adding} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#10B981", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              {adding ? "添加中..." : "确认添加"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !loading && !error && (
        <div style={{ padding: 40, textAlign: "center", background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>
            {properties.length === 0 ? "暂无资产数据" : "当前筛选条件下无资产"}
          </p>
          <p style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>
            {properties.length === 0 ? "数据库中没有资产记录，点击\"+ 手动添加\"开始录入" : "调整城市/业态筛选或清除筛选条件"}
          </p>
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filtered.length > 0 && (
        <div style={{ background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--bw-line)", background: "var(--bw-panel)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>项目名称</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>城市</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>区域</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>业态</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>面价</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>可信度</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>数据源</th>
                  <th style={{ padding: "10px 14px", width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--bw-line-soft)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--bw-text)", fontFamily: "var(--font-sans)" }}>{p.projectName}</td>
                    <td style={{ padding: "10px 14px", color: "var(--bw-text-2)", fontFamily: "var(--font-sans)" }}>{p.city}</td>
                    <td style={{ padding: "10px 14px", color: "var(--bw-text-2)", fontFamily: "var(--font-sans)" }}>{p.district}</td>
                    <td style={{ padding: "10px 14px", color: "var(--bw-text-2)", fontFamily: "var(--font-sans)" }}>{typeLabels[p.propertyType]||p.propertyType}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--bw-text)" }}>¥{Number(p.faceRent||0).toFixed(1)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: (p.confidenceScore||0) >= 0.8 ? "#0070F3" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EE0000" }}>
                      {((p.confidenceScore||0)*100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--bw-muted)", fontSize: 12, fontFamily: "var(--font-sans)" }}>{p.dataSource}</td>
                    <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                      <button onClick={() => router.push(`/admin/data-review/${p.id}`)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>编辑</button>
                      <button onClick={()=>handleDelete(p.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #EE0000", background: "rgba(238,0,0,0.04)", color: "#EE0000", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && filtered.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {filtered.map(p => (
            <div key={p.id} style={{ background: "var(--bw-surface)", borderRadius: 10, border: "1px solid var(--bw-line)", overflow: "hidden" }}>
              {/* Card Header */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--bw-line-soft)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.projectName}</p>
                  <p style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>{p.city} · {p.district}</p>
                </div>
                <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {p.isMock && <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "2px 6px", borderRadius: 4, background: "rgba(245,166,35,0.1)", color: "#F5A623", whiteSpace: "nowrap" }}>演示</span>}
                  <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "2px 6px", borderRadius: 4, background: "rgba(0,112,243,0.06)", color: "#0070F3", whiteSpace: "nowrap" }}>
                    {typeLabels[p.propertyType]||p.propertyType}
                  </span>
                </span>
              </div>

              {/* Card Body */}
              <div onClick={() => router.push(`/admin/data-review/${p.id}`)} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>挂牌面价</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: "var(--bw-text)" }}>
                    ¥{Number(p.faceRent||0).toFixed(1)}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "var(--bw-hint)", fontFamily: "var(--font-sans)" }}>/㎡/天</span>
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>可信度</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 80, height: 6, borderRadius: 3, background: "var(--bw-line-soft)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((p.confidenceScore||0)*100, 100)}%`, height: "100%", borderRadius: 3, background: (p.confidenceScore||0) >= 0.8 ? "#10B981" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EE0000" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)", color: (p.confidenceScore||0) >= 0.8 ? "#10B981" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EE0000" }}>
                      {((p.confidenceScore||0)*100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {(p.vacancy !== null || p.capRate !== null || p.netEffectiveRent !== null) && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {p.vacancy !== null && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(238,0,0,0.05)", color: "#D85A30", fontFamily: "var(--font-sans)" }}>空置 {Number(p.vacancy).toFixed(1)}%</span>}
                    {p.capRate !== null && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(0,112,243,0.06)", color: "#0070F3", fontFamily: "var(--font-sans)" }}>CAP {Number(p.capRate).toFixed(1)}%</span>}
                    {p.netEffectiveRent !== null && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(13,148,136,0.08)", color: "#0D9488", fontFamily: "var(--font-sans)" }}>净租 ¥{Number(p.netEffectiveRent).toFixed(1)}</span>}
                    {p.salesEfficiency !== null && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(124,58,237,0.08)", color: "#7C3AED", fontFamily: "var(--font-sans)" }}>坪效 ¥{Number(p.salesEfficiency).toFixed(0)}</span>}
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "var(--bw-muted)", fontFamily: "var(--font-sans)" }}>数据来源</span>
                  <span style={{ fontSize: 12, color: "var(--bw-text-2)", fontFamily: "var(--font-sans)" }}>{p.dataSource}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid var(--bw-line-soft)", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => router.push(`/admin/data-review/${p.id}`)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>编辑</button>
                <button onClick={()=>handleDelete(p.id)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #EE0000", background: "rgba(238,0,0,0.04)", color: "#EE0000", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
