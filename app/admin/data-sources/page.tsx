"use client";
import { useState, useEffect } from "react";

interface DataSource { id: string; name: string; url: string; sourceType: string; isActive: boolean; priority: number; lastStatus: string; }
const typeLabel: Record<string, string> = { SSR_HTML: "网页抓取", EXTERNAL_API: "API接口", JSON_LD: "结构化", RSS_FEED: "RSS", FILE_DOWNLOAD: "文件" };
const typeColor: Record<string, string> = { SSR_HTML: "#2563EB", EXTERNAL_API: "#059669", JSON_LD: "#D97706", RSS_FEED: "#64748d", FILE_DOWNLOAD: "#64748d" };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<Partial<DataSource>>({});

  const fetchSources = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?type=${filter}` : "";
      const res = await fetch(`/api/admin/data-sources${params}`);
      const data = await res.json();
      setSources(data.sources || []);
    } catch { setSources([]); }
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, [filter]);

  const toggleActive = async (s: DataSource) => {
    await fetch(`/api/admin/data-sources/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) });
    fetchSources();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = edit.id ? `/api/admin/data-sources/${edit.id}` : "/api/admin/data-sources";
    await fetch(url, { method: edit.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) });
    setShowForm(false); setEdit({}); fetchSources();
  };

  const handleDelete = async (s: DataSource) => {
    if (!confirm(`删除「${s.name}」？`)) return;
    await fetch(`/api/admin/data-sources/${s.id}`, { method: "DELETE" });
    fetchSources();
  };

  const activeCount = sources.filter(s => s.isActive).length;
  const types = ["all", "SSR_HTML", "EXTERNAL_API", "JSON_LD"];

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1 className="admin-page-title">数据源</h1><p className="admin-page-desc">{sources.length} 个数据源 · {activeCount} 活跃</p></div>
        <button onClick={() => { setEdit({ name: "", url: "", sourceType: "SSR_HTML", isActive: true, priority: 0 }); setShowForm(true); }} className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>+ 添加</button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} style={{ background: "#fff", border: "1px solid #e5edf5", borderRadius: 6, padding: 16, marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>名称</label><input style={{ width: "100%", padding: "7px 12px", border: "1px solid #e5edf5", borderRadius: 4, fontSize: 13, color: "#1A1A2E" }} value={edit.name || ""} onChange={e => setEdit({ ...edit, name: e.target.value })} required /></div>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>URL</label><input style={{ width: "100%", padding: "7px 12px", border: "1px solid #e5edf5", borderRadius: 4, fontSize: 13, fontFamily: "monospace", color: "#1A1A2E" }} value={edit.url || ""} onChange={e => setEdit({ ...edit, url: e.target.value })} required /></div>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>方式</label><select style={{ width: "100%", padding: "7px 12px", border: "1px solid #e5edf5", borderRadius: 4, fontSize: 13, color: "#1A1A2E" }} value={edit.sourceType} onChange={e => setEdit({ ...edit, sourceType: e.target.value })}>{Object.entries(typeLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>优先级</label><input style={{ width: "100%", padding: "7px 12px", border: "1px solid #e5edf5", borderRadius: 4, fontSize: 13, color: "#1A1A2E" }} type="number" min={0} max={100} value={edit.priority ?? 0} onChange={e => setEdit({ ...edit, priority: parseInt(e.target.value) || 0 })} /></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: "6px 16px" }}>{edit.id ? "保存" : "添加"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit({}); }} className="btn-ghost">取消</button>
          </div>
        </form>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding: "4px 12px", borderRadius: 4, border: "1px solid", fontSize: 11, cursor: "pointer", borderColor: filter === t ? (typeColor[t] || "#2563EB") : "#e5edf5", background: filter === t ? `${typeColor[t] || "#2563EB"}15` : "#fff", color: filter === t ? (typeColor[t] || "#2563EB") : "#64748d" }}>
            {t === "all" ? `全部 (${sources.length})` : `${typeLabel[t] || t} (${sources.filter(s => s.sourceType === t).length})`}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: "#64748d", fontSize: 14 }}>加载中...</p> : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead><tr><th style={{ width: 30 }}></th><th>名称</th><th>URL</th><th style={{ textAlign: "center" }}>方式</th><th style={{ textAlign: "center" }}>优先级</th><th style={{ textAlign: "center" }}>状态</th><th style={{ textAlign: "right", width: 140 }}></th></tr></thead>
            <tbody>
              {sources.map(s => (
                <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.5 }}>
                  <td><div style={{ width: 8, height: 8, borderRadius: "50%", background: s.isActive ? "#059669" : "#e5edf5" }} /></td>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td className="str-td-hint" style={{ fontFamily: "Geist Mono, monospace", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</td>
                  <td style={{ textAlign: "center" }}><span style={{ display: "inline-block", padding: "1px 8px", borderRadius: 4, fontSize: 10, background: `${typeColor[s.sourceType]}18`, color: typeColor[s.sourceType] }}>{typeLabel[s.sourceType]}</span></td>
                  <td className="str-td-mono" style={{ textAlign: "center" }}>{s.priority}</td>
                  <td style={{ textAlign: "center", fontSize: 11, color: s.lastStatus === "SUCCESS" ? "#059669" : "#64748d" }}>{s.lastStatus || "—"}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => toggleActive(s)} className="btn-ghost">{s.isActive ? "停用" : "启用"}</button>
                    <button onClick={() => { setEdit({ ...s }); setShowForm(true); }} className="btn-ghost">编辑</button>
                    <button onClick={() => handleDelete(s)} className="btn-danger">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
