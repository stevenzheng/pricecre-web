"use client";

import { useState, useEffect, useCallback } from "react";

interface CrawlJob {
  id: string;
  label: string;
  targetUrl: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  city: string;
  district: string;
  scheduleHour: number;
  scheduleMinute: number;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string;
  lastRunError: string | null;
  lastPipelineCount: number;
}

export default function CrawlSchedulePage() {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [editJob, setEditJob] = useState<Partial<CrawlJob> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

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
    fetchJobs(); setActionMsg(`${job.label} ${job.isActive ? "已停用" : "已启用"}`);
  };

  const deleteJob = async (job: CrawlJob) => {
    if (!confirm(`删除「${job.label}」？`)) return;
    await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== job.id));
    setActionMsg("已删除");
  };

  const runNow = async (job: CrawlJob) => {
    setActionMsg(`正在触发「${job.label}」...`);
    try {
      const res = await fetch("/api/agent/crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl: job.targetUrl, propertyType: job.propertyType, city: job.city, district: job.district, projectName: job.label }) });
      const data = await res.json();
      setActionMsg(data.success ? `完成，assetId: ${data.assetId}` : `失败: ${data.msg || data.error}`);
      fetchJobs();
    } catch { setActionMsg("触发失败"); }
  };

  const inputClass = "w-full px-3 py-1.5 text-sm rounded-sm border outline-none transition-colors focus:border-[var(--accent)]";
  const inputStyle = { background: "var(--bg-input)", borderColor: "var(--line)", color: "var(--text)" } as const;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>爬取计划管理</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>配置定时抓取任务，Vercel Cron 每30分钟检查到期计划</p>
        </div>
        <button
          onClick={() => {
            setEditJob({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", scheduleHour: 2, scheduleMinute: 0, isActive: true });
            setShowForm(true);
          }}
          className="btn-primary text-xs rounded-sm px-3 py-1.5"
        >
          + 新建计划
        </button>
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
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>名称</label>
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
            <div>
              <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>执行时间 (24h)</label>
              <div className="flex items-center gap-1">
                <input type="number" min={0} max={23} className={inputClass + " w-16"} style={inputStyle} value={editJob.scheduleHour ?? 2} onChange={e => setEditJob({ ...editJob, scheduleHour: parseInt(e.target.value) || 0 })} />
                <span style={{ color: "var(--text-muted)", fontSize: 13 }}>:</span>
                <input type="number" min={0} max={59} className={inputClass + " w-16"} style={inputStyle} value={editJob.scheduleMinute ?? 0} onChange={e => setEditJob({ ...editJob, scheduleMinute: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary text-xs rounded-sm px-4 py-1.5">{editJob.id ? "保存" : "创建"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditJob(null); }} className="btn-secondary text-xs rounded-sm px-3 py-1.5">取消</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>加载中...</p>
      ) : jobs.length === 0 ? (
        <div className="card-dark p-8 text-center rounded">
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>暂无爬取计划</p>
          <p className="text-[11px] mt-1" style={{ color: "var(--text-hint)" }}>点击「+ 新建计划」创建第一个定时抓取任务</p>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job.id} className={`card-dark p-3 rounded ${job.isActive ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>{job.label}</span>
                    <span className="badge badge-accent text-[10px]">{job.propertyType}</span>
                    <span className={`badge text-[10px] ${job.isActive ? "badge-positive" : "badge-locked"}`}>
                      {job.isActive ? "启用" : "停用"}
                    </span>
                  </div>
                  <p className="text-[11px] truncate" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{job.targetUrl}</p>
                  <div className="flex gap-3 mt-1.5 text-[11px] flex-wrap" style={{ color: "var(--text-hint)" }}>
                    <span>时间: {String(job.scheduleHour).padStart(2, "0")}:{String(job.scheduleMinute).padStart(2, "0")}</span>
                    <span>{job.city} / {job.district}</span>
                    {job.lastRunAt && (
                      <span>
                        上次: {new Date(job.lastRunAt).toLocaleString("zh-CN")}
                        <span className={`badge ml-1.5 text-[10px] ${job.lastRunStatus === "SUCCESS" ? "badge-positive" : job.lastRunStatus === "FAILED" ? "badge-negative" : "badge-locked"}`}>
                          {job.lastRunStatus}
                        </span>
                        {job.lastPipelineCount > 0 && <span className="ml-1">({job.lastPipelineCount}条)</span>}
                      </span>
                    )}
                  </div>
                  {job.lastRunError && (
                    <p className="mt-1 text-[11px] truncate" style={{ color: "var(--negative)" }}>{job.lastRunError}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => runNow(job)} className="btn-primary text-[10px] rounded-sm px-2 py-1 opacity-80 hover:opacity-100">执行</button>
                  <button onClick={() => { setEditJob({ ...job }); setShowForm(true); }} className="btn-secondary text-[10px] rounded-sm px-2 py-1">编辑</button>
                  <button onClick={() => toggleActive(job)} className={`btn-secondary text-[10px] rounded-sm px-2 py-1 ${job.isActive ? "" : "border-[var(--accent-border)]"}`}>
                    {job.isActive ? "停用" : "启用"}
                  </button>
                  <button onClick={() => deleteJob(job)} className="btn-secondary text-[10px] rounded-sm px-2 py-1" style={{ color: "var(--negative)" }}>删除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
