"use client";
import { useState, useEffect, useCallback } from "react";

interface Job { id: string; label: string; targetUrl: string; propertyType: string; city: string; district: string; isActive: boolean; lastRunAt: string | null; lastRunStatus: string; lastPipelineCount: number; }

const typeLabel: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };
const cityLabel: Record<string, string> = {
  shanghai: "上海", beijing: "北京", shenzhen: "深圳", suzhou: "苏州",
  chengdu: "成都", guangzhou: "广州", hangzhou: "杭州", changsha: "长沙", xian: "西安",
};
const statusLabel: Record<string, string> = { SUCCESS: "成功", FAILED: "失败", PENDING: "等待中", RUNNING: "运行中" };
const statusColor: Record<string, string> = { SUCCESS: "#0D9488", FAILED: "#E91E63", PENDING: "#F59E0B", RUNNING: "#0070F3" };

export default function CrawlSchedulePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Partial<Job>>({});
  const [showForm, setShowForm] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [filter, setFilter] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const fetchJobs = useCallback(async () => { setLoading(true); try { const res = await fetch("/api/agent/schedule"); setJobs(Array.isArray(await res.json()) ? await res.json() : []); } catch { setJobs([]); } setLoading(false); }, []);
  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); const url = edit.id ? `/api/agent/schedule/${edit.id}` : "/api/agent/schedule"; await fetch(url, { method: edit.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edit) }); setShowForm(false); setEdit({}); fetchJobs(); };
  const toggleActive = async (j: Job) => { await fetch(`/api/agent/schedule/${j.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !j.isActive }) }); fetchJobs(); };
  const deleteJob = async (j: Job) => { if (!confirm(`确定删除「${j.label}」？此操作不可撤销。`)) return; await fetch(`/api/agent/schedule/${j.id}`, { method: "DELETE" }); fetchJobs(); };
  const runSingle = async (j: Job) => { setActionMsg(`正在抓取：${j.label}...`); try { const res = await fetch("/api/agent/crawl-all", { method: "POST" }); const data = await res.json(); setActionMsg(data.success ? `${j.label}：获取 ${data.totalListings || 0} 条房源` : "抓取失败"); } catch { setActionMsg("网络请求失败"); } fetchJobs(); };

  const activeJobs = jobs.filter(j => j.isActive);
  const crawlAll = async () => { setCrawling(true); setActionMsg("全量数据抓取已启动，正在请求各数据源..."); try { const res = await fetch("/api/agent/crawl-all", { method: "POST" }); const data = await res.json(); setActionMsg(data.success ? `抓取完成：共获取 ${data.totalListings || 0} 条房源数据` : "抓取过程出现错误，请检查数据源配置"); } catch { setActionMsg("网络请求失败，请检查后端服务状态"); } setCrawling(false); fetchJobs(); };

  const filtered = jobs.filter(j => {
    if (filter !== "all" && (filter === "active" ? !j.isActive : j.isActive)) return false;
    if (filterType !== "all" && j.propertyType !== filterType) return false;
    return true;
  });

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="vl-page-title">数据爬取计划</h1>
          <p className="vl-page-desc">
            {jobs.length} 个抓取目标 · {activeJobs.length} 个活跃 · {jobs.filter(j => j.lastRunStatus === "SUCCESS").length} 个最新成功
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => { setEdit({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", isActive: true }); setShowForm(true); }} className="vl-btn-outline" style={{ fontSize: 13, padding: "6px 14px" }}>+ 新建目标</button>
          <button onClick={crawlAll} disabled={crawling || activeJobs.length === 0} className="vl-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>
            {crawling ? "正在抓取..." : `全量抓取 (${activeJobs.length})`}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ marginBottom: 16, padding: "10px 16px", borderRadius: 6, background: "#F0F7FF", border: "1px solid #B8D8FF", color: "#0070F3", fontSize: 13, fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }} onClick={() => setActionMsg("")}>
          <span>{actionMsg}</span><span style={{ fontSize: 11, opacity: 0.6 }}>点击关闭</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSave} className="vl-card" style={{ marginBottom: 20, padding: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>{edit.id ? "编辑抓取目标" : "新建抓取目标"}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="vl-label">目标名称</label>
              <input className="vl-input" value={edit.label || ""} onChange={e => setEdit({...edit, label: e.target.value})} placeholder="例如：贝壳商办-上海浦东" required />
            </div>
            <div>
              <label className="vl-label">抓取网址</label>
              <input className="vl-input" style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12 }} value={edit.targetUrl || ""} onChange={e => setEdit({...edit, targetUrl: e.target.value})} placeholder="https://..." required />
            </div>
            <div>
              <label className="vl-label">业态类型</label>
              <select className="vl-select" style={{ width: "100%" }} value={edit.propertyType} onChange={e => setEdit({...edit, propertyType: e.target.value})}>
                <option value="OFFICE">写字楼</option>
                <option value="SHOPS">商业零售</option>
                <option value="INDUSTRIAL">产业园</option>
              </select>
            </div>
            <div>
              <label className="vl-label">城市 / 区域</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input className="vl-input" value={edit.city || ""} onChange={e => setEdit({...edit, city: e.target.value})} placeholder="如 shanghai" />
                <input className="vl-input" value={edit.district || ""} onChange={e => setEdit({...edit, district: e.target.value})} placeholder="如 pudong" />
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button type="submit" className="vl-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>{edit.id ? "保存修改" : "添加目标"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEdit({}); }} className="vl-btn-ghost">取消</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="vl-filter-tabs" style={{ borderBottom: "none" }}>
          {(["all", "active", "inactive"] as const).map(s => (
            <button key={s} className={`vl-filter-tab${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}
              style={{ borderBottom: filter === s ? "2px solid #171717" : "2px solid transparent", padding: "6px 12px", fontSize: 12 }}>
              {s === "all" ? "全部状态" : s === "active" ? "活跃中" : "已停用"}
            </button>
          ))}
        </div>
        <span style={{ color: "#E5E5E5", fontSize: 16, margin: "0 4px" }}>|</span>
        <div className="vl-filter-tabs" style={{ borderBottom: "none" }}>
          {(["all", "OFFICE", "SHOPS", "INDUSTRIAL"] as const).map(t => (
            <button key={t} className={`vl-filter-tab${filterType === t ? " active" : ""}`} onClick={() => setFilterType(t)}
              style={{ borderBottom: filterType === t ? "2px solid #171717" : "2px solid transparent", padding: "6px 12px", fontSize: 12 }}>
              {t === "all" ? "全部业态" : typeLabel[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards */}
      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">正在加载抓取计划...</p></div>
      ) : filtered.length === 0 ? (
        <div className="vl-empty">
          <div className="vl-empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/></svg>
          </div>
          <p className="vl-empty-title">暂无抓取目标</p>
          <p className="vl-empty-desc">点击「新建目标」添加数据源，配置后即可自动抓取商业地产数据</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(j => (
            <div key={j.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFFFFF",
              opacity: j.isActive ? 1 : 0.45, transition: "opacity 0.15s",
            }}>
              {/* Status dot + Name */}
              <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: j.isActive ? "#0D9488" : "#A3A3A3", flexShrink: 0 }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>{j.label}</span>
                  <span className="vl-badge vl-badge-accent" style={{ fontSize: 10, padding: "1px 6px" }}>{typeLabel[j.propertyType]}</span>
                </div>
                <div style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-geist-mono), monospace", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 320 }}>{j.targetUrl}</div>
              </div>

              {/* City */}
              <div style={{ flex: "0 0 auto", fontSize: 12, color: "#737373", whiteSpace: "nowrap" }}>
                {cityLabel[j.city] || j.city} · {j.district || "—"}
              </div>

              {/* Last Run */}
              <div style={{ flex: "0 0 auto", textAlign: "center", minWidth: 80 }}>
                {j.lastRunAt ? (
                  <div>
                    <div style={{ fontSize: 12, color: "#171717", fontWeight: 500 }}>{new Date(j.lastRunAt).toLocaleDateString("zh-CN")}</div>
                    <div style={{ fontSize: 10, color: statusColor[j.lastRunStatus] || "#A3A3A3", fontWeight: 500 }}>
                      {statusLabel[j.lastRunStatus] || j.lastRunStatus}
                      {j.lastPipelineCount > 0 && <span style={{ marginLeft: 3, color: "#A3A3A3" }}>· {j.lastPipelineCount}条</span>}
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: "#D4D4D4" }}>从未运行</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ flex: "0 0 auto", display: "flex", gap: 4 }}>
                <button onClick={() => runSingle(j)} className="vl-btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }} title="单独运行此目标">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </button>
                <button onClick={() => toggleActive(j)} className="vl-btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }}>{j.isActive ? "停用" : "启用"}</button>
                <button onClick={() => { setEdit({...j}); setShowForm(true); }} className="vl-btn-ghost" style={{ fontSize: 12, padding: "4px 8px" }}>编辑</button>
                <button onClick={() => deleteJob(j)} className="vl-btn-danger" style={{ fontSize: 12, padding: "4px 8px" }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
