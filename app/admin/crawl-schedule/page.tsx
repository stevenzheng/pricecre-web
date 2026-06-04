"use client";

import { useState, useEffect, useCallback } from "react";

interface CrawlJob {
  id: string; label: string; targetUrl: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  city: string; district: string; isActive: boolean;
  lastRunAt: string | null; lastRunStatus: string;
  lastRunError: string | null; lastPipelineCount: number;
}

type CrawlPhase = "idle" | "crawling" | "pipeline" | "done";
interface CrawlStatus {
  phase: CrawlPhase;
  current: string;
  done: number; total: number;
  results: { label: string; status: "pending" | "running" | "success" | "failed"; listings?: number; error?: string }[];
}

const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function CrawlSchedulePage() {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState<Partial<CrawlJob> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>({ phase: "idle", current: "", done: 0, total: 0, results: [] });

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/schedule");
      setJobs(Array.isArray(await res.json()) ? await res.json() : []);
    } catch { setJobs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJob) return;
    const url = editJob.id ? `/api/agent/schedule/${editJob.id}` : "/api/agent/schedule";
    await fetch(url, { method: editJob.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editJob) });
    setShowForm(false); setEditJob(null); fetchJobs();
  };

  const toggleActive = async (job: CrawlJob) => {
    await fetch(`/api/agent/schedule/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !job.isActive }) });
    fetchJobs();
  };

  const deleteJob = async (job: CrawlJob) => {
    if (!confirm(`删除「${job.label}」？`)) return;
    await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== job.id));
  };

  const activeJobs = jobs.filter(j => j.isActive);

  const crawlAll = async () => {
    if (activeJobs.length === 0) return;
    setCrawlStatus({ phase: "crawling", current: "准备中...", done: 0, total: activeJobs.length,
      results: activeJobs.map(j => ({ label: j.label, status: "pending" })) });

    setActionMsg("全量抓取已启动...");

    // Submit crawl-all
    try {
      const res = await fetch("/api/agent/crawl-all", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        let done = 0;
        const results = [...(data.results || activeJobs.map(j => ({ label: j.label, status: "success", listings: 0 })))];
        // Animate completion
        for (let i = 0; i < results.length; i++) {
          await new Promise(r => setTimeout(r, 200));
          done++;
          setCrawlStatus(prev => ({
            phase: done >= results.length ? "done" : "crawling",
            current: results[i]?.label || "",
            done, total: results.length,
            results: prev.results.map((r, idx) =>
              idx <= i ? { ...r, status: "success" as const } : r
            ),
          }));
        }
        setActionMsg(`全量抓取完成：${data.totalListings || 0} 条房源，${results.length} 个平台`);
      } else {
        setCrawlStatus(prev => ({ ...prev, phase: "done" }));
        setActionMsg("抓取失败: " + (data.msg || data.error));
      }
    } catch (e: any) {
      setCrawlStatus(prev => ({ ...prev, phase: "done" }));
      setActionMsg("请求失败");
    }

    fetchJobs();
  };

  const statusColor = (s: string) => {
    switch (s) { case "success": return "#059669"; case "failed": return "#dc2626"; case "running": return "#2563EB"; default: return "#e5edf5"; }
  };
  const statusBg = (s: string) => {
    switch (s) { case "success": return "rgba(5,150,105,0.12)"; case "failed": return "rgba(220,38,38,0.08)"; case "running": return "rgba(37,99,235,0.08)"; default: return "#f8f9fb"; }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 12px", border: "1px solid #e5edf5", borderRadius: 4,
    fontSize: 14, fontFamily: "MiSans, sans-serif", color: "#1A1A2E", background: "#fff",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="admin-page-title">爬取计划</h1>
          <p className="admin-page-desc">
            四大平台爬取目标管理 · {activeJobs.length} 活跃
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setEditJob({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", isActive: true }); setShowForm(true); }} className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>
            + 添加站点
          </button>
          <button onClick={crawlAll} disabled={crawlStatus.phase === "crawling" || activeJobs.length === 0} className="btn-primary" style={{ fontSize: 13, padding: "6px 16px", opacity: activeJobs.length === 0 ? 0.5 : 1 }}>
            {crawlStatus.phase === "crawling" ? "抓取中..." : `全量抓取 (${activeJobs.length})`}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(37,99,235,0.08)", color: "#2563EB", fontSize: 13 }}>{actionMsg}</div>
      )}

      {/* Crawl Progress */}
      {crawlStatus.phase !== "idle" && (
        <div style={{ marginBottom: 20, background: "#fff", border: "1px solid #e5edf5", borderRadius: 6, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #e5edf5", borderTopColor: "#2563EB", borderRadius: "50%", animation: crawlStatus.phase === "done" ? "none" : "spin 0.6s linear infinite" }} />
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1A1A2E" }}>
              {crawlStatus.phase === "done" ? "全量抓取完成" : `正在抓取 ${crawlStatus.current} (${crawlStatus.done}/${crawlStatus.total})`}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {crawlStatus.results.map((r, i) => (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 10px", borderRadius: 4, fontSize: 11,
                background: statusBg(r.status), color: statusColor(r.status),
                border: `1px solid ${statusColor(r.status)}33`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(r.status), animation: r.status === "running" ? "pulse-dot 1.5s infinite" : "none" }} />
                {r.label}
                {r.listings !== undefined && r.listings > 0 && <span style={{ opacity: 0.7 }}>({r.listings}条)</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && editJob && (
        <form onSubmit={handleSubmit} style={{ background: "#fff", border: "1px solid #e5edf5", borderRadius: 6, padding: 16, marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>站点名称</label><input style={inputStyle} value={editJob.label || ""} onChange={e => setEditJob({ ...editJob, label: e.target.value })} required /></div>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>URL</label><input style={{ ...inputStyle, fontFamily: "Geist Mono, monospace" }} value={editJob.targetUrl || ""} onChange={e => setEditJob({ ...editJob, targetUrl: e.target.value })} required /></div>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>业态</label><select style={inputStyle} value={editJob.propertyType} onChange={e => setEditJob({ ...editJob, propertyType: e.target.value as any })}><option value="OFFICE">办公 OFFICE</option><option value="SHOPS">商业 SHOPS</option><option value="INDUSTRIAL">产业园 INDUSTRIAL</option></select></div>
          <div><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>城市 / 区域</label><div style={{ display: "flex", gap: 8 }}><input style={inputStyle} value={editJob.city || ""} onChange={e => setEditJob({ ...editJob, city: e.target.value })} placeholder="shanghai" /><input style={inputStyle} value={editJob.district || ""} onChange={e => setEditJob({ ...editJob, district: e.target.value })} placeholder="jing_an" /></div></div>
          <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
            <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: "6px 16px" }}>{editJob.id ? "保存" : "添加"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditJob(null); }} className="btn-ghost" style={{ fontSize: 12 }}>取消</button>
          </div>
        </form>
      )}

      {loading ? (
        <p style={{ fontSize: 14, color: "#64748d" }}>加载中...</p>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "#fff", border: "1px solid #e5edf5", borderRadius: 6 }}>
          <p style={{ fontSize: 16, color: "#64748d" }}>暂无爬取目标</p>
          <p style={{ fontSize: 13, color: "#64748d" }}>点击「+ 添加站点」添加</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>站点</th>
                <th>URL</th>
                <th>业态</th>
                <th>城市/区域</th>
                <th style={{ textAlign: "center" }}>上次运行</th>
                <th style={{ textAlign: "right", width: 180 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} style={{ opacity: job.isActive ? 1 : 0.5 }}>
                  <td><div style={{ width: 8, height: 8, borderRadius: "50%", background: job.isActive ? "#059669" : "#e5edf5" }} /></td>
                  <td style={{ fontWeight: 500 }}>{job.label}</td>
                  <td className="str-td-hint" style={{ fontFamily: "Geist Mono, monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.targetUrl}</td>
                  <td><span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10, background: "rgba(37,99,235,0.08)", color: "#2563EB", border: "1px solid rgba(37,99,235,0.2)" }}>{typeLabel[job.propertyType]}</span></td>
                  <td style={{ fontSize: 12, color: "#64748d" }}>{job.city} / {job.district}</td>
                  <td style={{ textAlign: "center" }}>
                    {job.lastRunAt ? (
                      <span style={{ fontSize: 11 }}>
                        {new Date(job.lastRunAt).toLocaleString("zh-CN").split(" ")[0]}
                        <span style={{ marginLeft: 6, display: "inline-block", padding: "1px 6px", borderRadius: 4, fontSize: 10,
                          background: job.lastRunStatus === "SUCCESS" ? "rgba(5,150,105,0.12)" : "rgba(220,38,38,0.08)",
                          color: job.lastRunStatus === "SUCCESS" ? "#059669" : "#dc2626",
                          border: `1px solid ${job.lastRunStatus === "SUCCESS" ? "rgba(5,150,105,0.25)" : "rgba(220,38,38,0.2)"}` }}>
                          {job.lastRunStatus}
                        </span>
                        {job.lastPipelineCount > 0 && <span style={{ marginLeft: 4, color: "#64748d" }}>({job.lastPipelineCount}条)</span>}
                      </span>
                    ) : <span style={{ fontSize: 12, color: "#64748d" }}>—</span>}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => toggleActive(job)} className="btn-ghost">{job.isActive ? "停用" : "启用"}</button>
                    <button onClick={() => { setEditJob({ ...job }); setShowForm(true); }} className="btn-ghost">编辑</button>
                    <button onClick={() => deleteJob(job)} className="btn-danger">删除</button>
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
