"use client";
import { useState, useEffect } from "react";

const typeLabel: Record<string, string> = { SSR_HTML: "网页抓取", EXTERNAL_API: "API", JSON_LD: "结构化", RSS_FEED: "RSS", FILE_DOWNLOAD: "文件" };
const typeColor: Record<string, string> = { SSR_HTML: "#3EB0EF", EXTERNAL_API: "#30CF43", JSON_LD: "#F0A830", RSS_FEED: "#738A94", FILE_DOWNLOAD: "#738A94" };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [edit, setEdit] = useState<any>({});

  const fetchSources = async () => { setLoading(true); try { const p = filter !== "all" ? `?type=${filter}` : ""; const d = await fetch(`/api/admin/data-sources${p}`).then(r => r.json()); setSources(d.sources || []); } catch { setSources([]); } setLoading(false); };
  useEffect(() => { fetchSources(); }, [filter]);

  const toggleActive = async (s: any) => { await fetch(`/api/admin/data-sources/${s.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !s.isActive }) }); fetchSources(); };
  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); const url = edit.id ? `/api/admin/data-sources/${edit.id}` : "/api/admin/data-sources"; await fetch(url, { method: edit.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) }); setShowForm(false); setEdit({}); fetchSources(); };
  const handleDelete = async (s: any) => { if (!confirm(`删除「${s.name}」？`)) return; await fetch(`/api/admin/data-sources/${s.id}`, { method: "DELETE" }); fetchSources(); };
  const activeCount = sources.filter((s: any) => s.isActive).length;
  const types = ["all", "SSR_HTML", "EXTERNAL_API", "JSON_LD"];

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1 className="gh-page-title">数据源</h1><p className="gh-page-desc">{sources.length} 个数据源 · {activeCount} 活跃</p></div>
        <button onClick={() => { setEdit({ name: "", url: "", sourceType: "SSR_HTML", isActive: true, priority: 0 }); setShowForm(true); }} className="gh-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>+ 添加</button>
      </div>
      {showForm && (
        <form onSubmit={handleSave} className="gh-card" style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label className="gh-label">名称</label><input className="gh-input" value={edit.name || ""} onChange={e => setEdit({...edit, name: e.target.value})} required /></div>
          <div><label className="gh-label">URL</label><input className="gh-input" style={{ fontFamily: "JetBrains Mono, monospace" }} value={edit.url || ""} onChange={e => setEdit({...edit, url: e.target.value})} required /></div>
          <div><label className="gh-label">方式</label><select className="gh-select" style={{ width: "100%" }} value={edit.sourceType} onChange={e => setEdit({...edit, sourceType: e.target.value})}>{Object.entries(typeLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <div><label className="gh-label">优先级</label><input className="gh-input" type="number" min={0} max={100} value={edit.priority ?? 0} onChange={e => setEdit({...edit, priority: parseInt(e.target.value) || 0})} /></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="gh-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>{edit.id ? "保存" : "添加"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit({}); }} className="gh-btn-ghost">取消</button>
          </div>
        </form>
      )}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {types.map(t => <button key={t} className={`gh-filter-tab${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>{t === "all" ? `全部 (${sources.length})` : `${typeLabel[t]} (${sources.filter((s:any) => s.sourceType === t).length})`}</button>)}
      </div>
      {loading ? <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div> : (
        <table className="gh-table"><thead><tr><th style={{ width: 30 }}></th><th>名称</th><th>URL</th><th style={{ textAlign: "center" }}>方式</th><th style={{ textAlign: "center" }}>优先级</th><th style={{ textAlign: "center" }}>状态</th><th style={{ textAlign: "right", width: 140 }}></th></tr></thead><tbody>
          {sources.map((s: any) => (
            <tr key={s.id} style={{ opacity: s.isActive ? 1 : 0.4 }}>
              <td><div style={{ width: 8, height: 8, borderRadius: "50%", background: s.isActive ? "#30CF43" : "#E5E7EB" }} /></td>
              <td style={{ fontWeight: 600 }}>{s.name}</td>
              <td className="gh-hint" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.url}</td>
              <td style={{ textAlign: "center" }}><span className="gh-badge" style={{ background: `${typeColor[s.sourceType]}18`, color: typeColor[s.sourceType] }}>{typeLabel[s.sourceType]}</span></td>
              <td className="gh-mono" style={{ textAlign: "center" }}>{s.priority}</td>
              <td style={{ textAlign: "center", fontSize: 13, color: s.lastStatus === "SUCCESS" ? "#30CF43" : "#738A94" }}>{s.lastStatus || "—"}</td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => toggleActive(s)} className="gh-btn-ghost">{s.isActive ? "停用" : "启用"}</button>
                <button onClick={() => { setEdit({...s}); setShowForm(true); }} className="gh-btn-ghost">编辑</button>
                <button onClick={() => handleDelete(s)} className="gh-btn-danger">删除</button>
              </td>
            </tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}
