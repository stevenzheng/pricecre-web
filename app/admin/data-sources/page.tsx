// app/admin/data-sources/page.tsx — 数据源管理（增删改 + 中文城市 + AI 自动发现）
"use client";

import { useState, useEffect } from "react";

interface DataSource {
  id: string; label: string; targetUrl: string;
  propertyType: string; city: string; district: string;
  isActive: boolean; lastRunAt: string | null;
  lastRunStatus: string; lastPipelineCount: number; lastRunError?: string;
}

const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };
const CITY_ZH: Record<string, string> = {
  shanghai: "上海", beijing: "北京", shenzhen: "深圳", guangzhou: "广州",
  hangzhou: "杭州", chengdu: "成都", suzhou: "苏州", changsha: "长沙", xian: "西安",
};
const cityZh = (key: string) => CITY_ZH[key] || key;

const emptyForm = { label: "", targetUrl: "", city: "shanghai", district: "all", propertyType: "OFFICE" };

export default function DataSourcesPage() {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [discoverCity, setDiscoverCity] = useState("shanghai");

  const fetchSources = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/schedule");
      const data = await res.json();
      setSources(Array.isArray(data) ? data : []);
    } catch { setSources([]); }
    setLoading(false);
  };

  useEffect(() => { fetchSources(); }, []);

  const showMsg = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 6000); };

  const toggleActive = async (s: DataSource) => {
    await fetch(`/api/agent/schedule/${s.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !s.isActive }),
    });
    fetchSources();
  };

  const handleDelete = async (s: DataSource) => {
    if (!confirm(`确认删除数据源「${s.label}」？`)) return;
    try {
      const res = await fetch(`/api/agent/schedule/${s.id}`, { method: "DELETE" });
      const d = await res.json();
      showMsg(d.success ? "删除成功" : (d.error || "删除失败"));
    } catch { showMsg("网络错误"); }
    fetchSources();
  };

  const startEdit = (s: DataSource) => {
    setEditingId(s.id);
    setForm({ label: s.label, targetUrl: s.targetUrl, city: s.city, district: s.district, propertyType: s.propertyType });
    setShowForm(true);
  };

  const startAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.label || !form.targetUrl) { showMsg("站点名称与 URL 必填"); return; }
    setSaving(true);
    try {
      const res = editingId
        ? await fetch(`/api/agent/schedule/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
        : await fetch("/api/agent/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.error) showMsg(d.error);
      else { showMsg(editingId ? "已保存" : "已添加"); setShowForm(false); }
    } catch { showMsg("网络错误"); }
    setSaving(false);
    fetchSources();
  };

  const handleDiscover = async () => {
    setDiscovering(true);
    showMsg(`AI 正在搜索 ${cityZh(discoverCity)} 的商办数据源站点...`);
    try {
      const res = await fetch("/api/agent/discover-sources", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: discoverCity }),
      });
      const d = await res.json();
      showMsg(d.msg || d.error || "完成");
    } catch { showMsg("网络错误"); }
    setDiscovering(false);
    fetchSources();
  };

  const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" as const };
  const labelStyle = { fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" };

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="vl-page-title">数据源管理</h1>
          <p className="vl-page-desc">
            {sources.length} 个数据源 · {sources.filter(s => s.isActive).length} 活跃 · 累计产出 {sources.reduce((s, x) => s + (x.lastPipelineCount || 0), 0)} 条
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={discoverCity} onChange={e => setDiscoverCity(e.target.value)}
            style={{ padding: "7px 10px", border: "1px solid #E5E5E5", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", outline: "none", background: "#FFF" }}>
            {Object.entries(CITY_ZH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={handleDiscover} disabled={discovering} className="vl-btn-secondary" style={{ fontSize: 12 }}>
            {discovering ? "AI 搜索中..." : "✦ AI 发现数据源"}
          </button>
          <button onClick={startAdd} className="vl-btn-primary" style={{ fontSize: 12 }}>+ 添加数据源</button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 12, padding: "8px 14px", borderRadius: 8, fontSize: 13, background: "rgba(0,112,243,0.06)", color: "#0070F3", fontFamily: "var(--font-sans)" }}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleSave} style={{ marginBottom: 16, padding: 16, background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
          <div><label style={labelStyle}>站点名称 *</label><input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} style={inputStyle} /></div>
          <div style={{ gridColumn: "span 2" }}><label style={labelStyle}>URL *</label><input value={form.targetUrl} onChange={e => setForm({ ...form, targetUrl: e.target.value })} placeholder="https://..." style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>城市</label>
            <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ ...inputStyle, background: "#FFF" }}>
              {Object.entries(CITY_ZH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>区域</label><input value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} placeholder="all" style={inputStyle} /></div>
          <div>
            <label style={labelStyle}>业态</label>
            <select value={form.propertyType} onChange={e => setForm({ ...form, propertyType: e.target.value })} style={{ ...inputStyle, background: "#FFF" }}>
              {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <button type="submit" disabled={saving} className="vl-btn-primary" style={{ fontSize: 12, flex: 1 }}>{saving ? "保存中..." : editingId ? "保存修改" : "确认添加"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="vl-btn-ghost" style={{ fontSize: 12 }}>取消</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : sources.length === 0 ? (
        <div className="vl-empty">
          <p className="vl-empty-title">暂无数据源</p>
          <p className="vl-empty-desc">点击「+ 添加数据源」手动录入，或用「AI 发现数据源」自动搜索</p>
        </div>
      ) : (
        <div className="vl-table-wrap">
          <table className="vl-table">
            <thead>
              <tr>
                <th>站点名称</th>
                <th>URL</th>
                <th>业态</th>
                <th>城市</th>
                <th>状态</th>
                <th style={{ textAlign: "right" }}>产量</th>
                <th>最近运行</th>
                <th style={{ width: 150 }} />
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.label}</td>
                  <td className="vl-td-hint" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.targetUrl}
                  </td>
                  <td><span className="vl-badge vl-badge-neutral">{typeLabel[s.propertyType] || s.propertyType}</span></td>
                  <td className="vl-td-muted">{cityZh(s.city)}{s.district && s.district !== "all" ? ` · ${s.district}` : ""}</td>
                  <td>
                    <span className={`vl-badge ${s.isActive ? "vl-badge-success" : "vl-badge-neutral"}`}>
                      {s.isActive ? "活跃" : "停用"}
                    </span>
                  </td>
                  <td className="vl-td-mono" style={{ textAlign: "right" }}>{s.lastPipelineCount || 0}</td>
                  <td className="vl-td-hint">
                    {s.lastRunAt ? new Date(s.lastRunAt).toLocaleString("zh-CN") : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 2 }}>
                      <button onClick={() => startEdit(s)} className="vl-btn-ghost vl-btn-sm" style={{ color: "#0070F3" }}>编辑</button>
                      <button onClick={() => toggleActive(s)} className="vl-btn-ghost vl-btn-sm" style={{ color: s.isActive ? "#F5A623" : "#10B981" }}>
                        {s.isActive ? "停用" : "启用"}
                      </button>
                      <button onClick={() => handleDelete(s)} className="vl-btn-ghost vl-btn-sm" style={{ color: "#EE0000" }}>删除</button>
                    </div>
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
