"use client";

import { useState, useEffect, useCallback } from "react";

interface CrawlJob {
  id: string;
  label: string;
  targetUrl: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  city: string;
  district: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string;
  lastPipelineCount: number;
}

export default function CrawlSchedulePage() {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState<Partial<CrawlJob> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [crawlingAll, setCrawlingAll] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agent/schedule");
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch { setJobs([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJob) return;
    const url = editJob.id ? `/api/agent/schedule/${editJob.id}` : "/api/agent/schedule";
    const method = editJob.id ? "PUT" : "POST";
    try {
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editJob) });
      setActionMsg(editJob.id ? "已更新" : "已创建");
      setShowForm(false); setEditJob(null); fetchJobs();
    } catch { setActionMsg("操作失败"); }
  };

  const toggleActive = async (job: CrawlJob) => {
    await fetch(`/api/agent/schedule/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !job.isActive }) });
    fetchJobs();
  };

  const deleteJob = async (job: CrawlJob) => {
    if (!confirm(`删除「${job.label}」？`)) return;
    await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== job.id));
    setActionMsg("已删除");
  };

  const crawlAll = async () => {
    setCrawlingAll(true);
    setActionMsg("正在全量抓取所有目标站点...");
    try {
      const res = await fetch("/api/agent/crawl-all", { method: "POST" });
      const data = await res.json();
      setActionMsg(data.msg || "完成");
      fetchJobs();
    } catch { setActionMsg("抓取失败"); }
    setCrawlingAll(false);
  };

  const inputClass = "w-full px-3 py-1.5 text-sm rounded-sm border outline-none transition-colors focus:border-[var(--accent)]";
  const inputStyle = { background: "var(--bg-input)", borderColor: "var(--line)", color: "var(--text)" } as const;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>爬取计划管理</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            管理目标站点列表，一键全量抓取
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditJob({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", isActive: true }); setShowForm(true); }}
            className="btn-secondary text-xs rounded-sm px-3 py-1.5"
          >
            + 添加站点
          </button>
          <button
            onClick={crawlAll}
            disabled={crawlingAll || jobs.filter(j => j.isActive).length === 0}
            className="btn-primary text-xs rounded-sm px-4 py-1.5 disabled:opacity-50"
          >
            {crawlingAll ? "抓取中..." : `全量抓取 (${jobs.filter(j => j.isActive).length})`}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="mb-4 px-4 py-2 card-dark rounded text-sm cursor-pointer" onClick={() => setActionMsg("")}>
          {actionMsg}
        </div>
      )}

      {showForm && editJob && (
        <form onSubmit={handleSubmit} className="card-dark p-4 rounded mb-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>站点名称</label>
              <input className={inputClass} style={inputStyle} value={editJob.label || ""} onChange={e => setEditJob({ ...editJob, label: e.target.value })} placeholder="例：前滩太古里" required />
            </div>
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>目标 URL</label>
              <input className={inputClass} style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} value={editJob.targetUrl || ""} onChange={e => setEditJob({ ...editJob, targetUrl: e.target.value })} placeholder="https://..." required />
            </div>
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>业态</label>
              <select className={inputClass} style={inputStyle} value={editJob.propertyType} onChange={e => setEditJob({ ...editJob, propertyType: e.target.value as any })}>
                <option value="OFFICE">办公 OFFICE</option>
                <option value="SHOPS">商业 SHOPS</option>
                <option value="INDUSTRIAL">产业园 INDUSTRIAL</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>城市 / 区域</label>
              <div className="flex gap-2">
                <input className={inputClass + " flex-1"} style={inputStyle} value={editJob.city || ""} onChange={e => setEditJob({ ...editJob, city: e.target.value })} placeholder="shanghai" />
                <input className={inputClass + " flex-1"} style={inputStyle} value={editJob.district || ""} onChange={e => setEditJob({ ...editJob, district: e.target.value })} placeholder="jing_an" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary text-xs rounded-sm px-4 py-1.5">{editJob.id ? "保存" : "添加"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditJob(null); }} className="btn-secondary text-xs rounded-sm px-3 py-1.5">取消</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>加载中...</p>
      ) : jobs.length === 0 ? (
        <div className="card-dark p-8 text-center rounded">
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>暂无目标站点</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-hint)" }}>点击「+ 添加站点」添加第一个爬取目标</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {jobs.map(job => (
            <div key={job.id} className={`card-dark p-3 rounded flex items-center justify-between gap-3 ${job.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: job.isActive ? "var(--positive)" : "var(--text-hint)" }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>{job.label}</span>
                    <span className="badge badge-accent text-[10px]">{job.propertyType}</span>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>{job.targetUrl}</p>
                  <div className="flex gap-3 mt-0.5 text-[10px]" style={{ color: "var(--text-hint)" }}>
                    <span>{job.city} / {job.district}</span>
                    {job.lastRunAt && (
                      <span>
                        上次: {new Date(job.lastRunAt).toLocaleString("zh-CN")}
                        <span className={`badge ml-1 text-[10px] ${job.lastRunStatus === "SUCCESS" ? "badge-positive" : "badge-negative"}`}>
                          {job.lastRunStatus}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => toggleActive(job)} className="btn-secondary text-[10px] rounded-sm px-2 py-1">
                  {job.isActive ? "停用" : "启用"}
                </button>
                <button onClick={() => { setEditJob({ ...job }); setShowForm(true); }} className="btn-secondary text-[10px] rounded-sm px-2 py-1">编辑</button>
                <button onClick={() => deleteJob(job)} className="btn-secondary text-[10px] rounded-sm px-2 py-1" style={{ color: "var(--negative)" }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
