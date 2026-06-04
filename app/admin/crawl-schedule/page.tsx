"use client";
import { useState, useEffect, useCallback } from "react";

interface Job { id: string; label: string; targetUrl: string; propertyType: string; city: string; district: string; isActive: boolean; lastRunAt: string | null; lastRunStatus: string; lastPipelineCount: number; }
const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function CrawlSchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Job>>({});
  const [showForm, setShowForm] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [crawling, setCrawling] = useState(false);

  const fetchJobs = useCallback(async () => { setLoading(true); try { const res = await fetch("/api/agent/schedule"); setJobs(Array.isArray(await res.json()) ? await res.json() : []); } catch { setJobs([]); } setLoading(false); }, []);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); const url = edit.id ? `/api/agent/schedule/${edit.id}` : "/api/agent/schedule"; await fetch(url, { method: edit.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) }); setShowForm(false); setEdit({}); fetchJobs(); };
  const toggleActive = async (j: Job) => { await fetch(`/api/agent/schedule/${j.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !j.isActive }) }); fetchJobs(); };
  const deleteJob = async (j: Job) => { if (!confirm(`删除「${j.label}」？`)) return; await fetch(`/api/agent/schedule/${j.id}`, { method: "DELETE" }); fetchJobs(); };

  const activeJobs = jobs.filter(j => j.isActive);
  const crawlAll = async () => { setCrawling(true); setActionMsg("全量抓取已启动..."); try { const res = await fetch("/api/agent/crawl-all", { method: "POST" }); const data = await res.json(); setActionMsg(data.success ? `完成: ${data.totalListings || 0} 条房源` : "抓取失败"); } catch { setActionMsg("请求失败"); } setCrawling(false); fetchJobs(); };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1 className="gh-page-title">爬取计划</h1><p className="gh-page-desc">{jobs.length} 个目标 · {activeJobs.length} 活跃</p></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setEdit({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", isActive: true }); setShowForm(true); }} className="gh-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>+ 添加</button>
          <button onClick={crawlAll} disabled={crawling || activeJobs.length === 0} className="gh-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>{crawling ? "抓取中..." : `全量抓取 (${activeJobs.length})`}</button>
        </div>
      </div>
      {actionMsg && <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(62,176,239,0.08)", color: "#3EB0EF", fontSize: 13, cursor: "pointer" }} onClick={() => setActionMsg("")}>{actionMsg}</div>}

      {showForm && (
        <form onSubmit={handleSave} className="gh-card" style={{ marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label className="gh-label">站点名称</label><input className="gh-input" value={edit.label || ""} onChange={e => setEdit({...edit, label: e.target.value})} required /></div>
          <div><label className="gh-label">URL</label><input className="gh-input" style={{ fontFamily: "JetBrains Mono, monospace" }} value={edit.targetUrl || ""} onChange={e => setEdit({...edit, targetUrl: e.target.value})} required /></div>
          <div><label className="gh-label">业态</label><select className="gh-select" style={{ width: "100%" }} value={edit.propertyType} onChange={e => setEdit({...edit, propertyType: e.target.value})}><option value="OFFICE">办公</option><option value="SHOPS">商业</option><option value="INDUSTRIAL">产业园</option></select></div>
          <div><label className="gh-label">城市 / 区域</label><div style={{ display: "flex", gap: 8 }}><input className="gh-input" value={edit.city || ""} onChange={e => setEdit({...edit, city: e.target.value})} placeholder="shanghai" /><input className="gh-input" value={edit.district || ""} onChange={e => setEdit({...edit, district: e.target.value})} placeholder="jing_an" /></div></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="gh-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>{edit.id ? "保存" : "添加"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit({}); }} className="gh-btn-ghost">取消</button>
          </div>
        </form>
      )}

      {loading ? <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div> : jobs.length === 0 ? <div className="gh-empty"><p className="gh-empty-title">暂无爬取目标</p><p className="gh-empty-desc">点击「+ 添加」创建第一个</p></div> : (
        <table className="gh-table">
          <thead><tr><th style={{ width: 30 }}></th><th>站点</th><th>URL</th><th>业态</th><th>城市</th><th style={{ textAlign: "center" }}>上次运行</th><th style={{ textAlign: "right", width: 180 }}></th></tr></thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.id} style={{ opacity: j.isActive ? 1 : 0.4 }}>
                <td><div style={{ width: 8, height: 8, borderRadius: "50%", background: j.isActive ? "#30CF43" : "#E5E7EB" }} /></td>
                <td style={{ fontWeight: 600 }}>{j.label}</td>
                <td className="gh-hint" style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.targetUrl}</td>
                <td><span className="gh-badge gh-badge-accent">{typeLabel[j.propertyType]}</span></td>
                <td style={{ fontSize: 13, color: "#738A94" }}>{j.city} / {j.district}</td>
                <td style={{ textAlign: "center" }}>{j.lastRunAt ? <><span style={{ fontSize: 12 }}>{new Date(j.lastRunAt).toLocaleDateString("zh-CN")}</span> <span className={`gh-badge ${j.lastRunStatus === "SUCCESS" ? "gh-badge-success" : "gh-badge-error"}`}>{j.lastRunStatus}</span>{j.lastPipelineCount > 0 && <span style={{ marginLeft: 4, color: "#738A94", fontSize: 12 }}>({j.lastPipelineCount}条)</span>}</> : <span className="gh-hint">—</span>}</td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={() => toggleActive(j)} className="gh-btn-ghost">{j.isActive ? "停用" : "启用"}</button>
                  <button onClick={() => { setEdit({...j}); setShowForm(true); }} className="gh-btn-ghost">编辑</button>
                  <button onClick={() => deleteJob(j)} className="gh-btn-danger">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
