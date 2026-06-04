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

function statusBadge(status: string) {
  switch (status) {
    case "SUCCESS": return "bg-[var(--positive-soft)] text-[var(--positive)]";
    case "FAILED": return "bg-[var(--negative-soft)] text-[var(--negative)]";
    default: return "bg-[var(--panel)] text-[var(--text-muted)]";
  }
}

function typeBadge(type: string) {
  switch (type) {
    case "OFFICE": return "bg-[var(--accent-soft)] text-[var(--accent)]";
    case "SHOPS": return "bg-[var(--positive-soft)] text-[var(--positive)]";
    case "INDUSTRIAL": return "bg-[var(--warning-soft)] text-[var(--warning)]";
    default: return "bg-[var(--panel)] text-[var(--text-muted)]";
  }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editJob) return;
    const url = editJob.id ? `/api/agent/schedule/${editJob.id}` : "/api/agent/schedule";
    const method = editJob.id ? "PUT" : "POST";
    try {
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editJob) });
      setActionMsg(editJob.id ? "已更新" : "已创建");
      setShowForm(false); setEditJob(null); fetchJobs();
    } catch { setActionMsg("操作失败"); }
  }

  async function toggleActive(job: CrawlJob) {
    await fetch(`/api/agent/schedule/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !job.isActive }) });
    fetchJobs(); setActionMsg(`${job.label} ${job.isActive ? "已停用" : "已启用"}`);
  }

  async function deleteJob(job: CrawlJob) {
    if (!confirm(`删除「${job.label}」？`)) return;
    await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
    setJobs(prev => prev.filter(j => j.id !== job.id));
    setActionMsg(`「${job.label}」已删除`);
  }

  async function runNow(job: CrawlJob) {
    setActionMsg(`正在触发「${job.label}」...`);
    try {
      const res = await fetch("/api/agent/crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetUrl: job.targetUrl, propertyType: job.propertyType, city: job.city, district: job.district, projectName: job.label }) });
      const data = await res.json();
      setActionMsg(data.success ? `完成，assetId: ${data.assetId}` : `失败: ${data.msg || data.error}`);
      fetchJobs();
    } catch { setActionMsg("触发失败"); }
  }

  const inputClass = "w-full mt-1 px-3 py-2 bg-[var(--bg-input)] border border-[var(--line)] rounded-lg text-sm text-[var(--text)] placeholder:text-[var(--text-hint)] focus:outline-none focus:border-[var(--accent)] transition-colors";
  const btnPrimary = "px-4 py-2 bg-[var(--accent)] text-white font-medium rounded-lg text-sm hover:opacity-90 transition-opacity";
  const btnGhost = "px-3 py-1.5 text-xs rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--panel)] transition-colors";

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-strong)]">爬取计划管理</h1>
            <p className="text-[var(--text-muted)] text-sm mt-1">配置定时抓取任务，Cron 每30分钟检查到期计划</p>
          </div>
          <button
            onClick={() => { setEditJob({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", scheduleHour: 2, scheduleMinute: 0, isActive: true }); setShowForm(true); }}
            className={btnPrimary}
          >
            + 新建计划
          </button>
        </div>

        {actionMsg && (
          <div className="mb-4 px-4 py-2 bg-[var(--bg-surface)] border border-[var(--line)] rounded-lg text-sm cursor-pointer" onClick={() => setActionMsg("")}>
            {actionMsg}
          </div>
        )}

        {showForm && editJob && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-[var(--text-muted)]">名称</label><input className={inputClass} value={editJob.label || ""} onChange={e => setEditJob({ ...editJob, label: e.target.value })} placeholder="例：前滩太古里" required /></div>
              <div><label className="text-xs text-[var(--text-muted)]">目标 URL</label><input className={inputClass + " font-mono"} value={editJob.targetUrl || ""} onChange={e => setEditJob({ ...editJob, targetUrl: e.target.value })} placeholder="https://..." required /></div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">业态</label>
                <select className={inputClass} value={editJob.propertyType} onChange={e => setEditJob({ ...editJob, propertyType: e.target.value as any })}>
                  <option value="OFFICE">办公 OFFICE</option>
                  <option value="SHOPS">商业 SHOPS</option>
                  <option value="INDUSTRIAL">产业园 INDUSTRIAL</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">城市 / 区域</label>
                <div className="flex gap-2 mt-1">
                  <input className={inputClass + " flex-1"} value={editJob.city || ""} onChange={e => setEditJob({ ...editJob, city: e.target.value })} placeholder="shanghai" />
                  <input className={inputClass + " flex-1"} value={editJob.district || ""} onChange={e => setEditJob({ ...editJob, district: e.target.value })} placeholder="jing_an" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)]">执行时间 (24h)</label>
                <div className="flex gap-2 mt-1">
                  <input type="number" min={0} max={23} className={inputClass + " w-20"} value={editJob.scheduleHour ?? 2} onChange={e => setEditJob({ ...editJob, scheduleHour: parseInt(e.target.value) || 0 })} />
                  <span className="py-2 text-[var(--text-muted)]">:</span>
                  <input type="number" min={0} max={59} className={inputClass + " w-20"} value={editJob.scheduleMinute ?? 0} onChange={e => setEditJob({ ...editJob, scheduleMinute: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className={btnPrimary}>{editJob.id ? "保存" : "创建"}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditJob(null); }} className={btnGhost}>取消</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-[var(--text-muted)] text-sm">加载中...</p>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl">
            <p className="text-[var(--text-muted)]">暂无爬取计划</p>
            <p className="text-[var(--text-hint)] text-xs mt-1">点击「+ 新建计划」创建</p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map(job => (
              <div key={job.id} className={`p-4 bg-[var(--bg-surface)] border border-[var(--line)] rounded-xl transition-opacity ${job.isActive ? "" : "opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-medium text-sm text-[var(--text-strong)]">{job.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${typeBadge(job.propertyType)}`}>{job.propertyType}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${job.isActive ? "bg-[var(--positive-soft)] text-[var(--positive)]" : "bg-[var(--panel)] text-[var(--text-muted)]"}`}>{job.isActive ? "启用" : "停用"}</span>
                    </div>
                    <p className="text-[var(--text-muted)] text-xs font-mono truncate">{job.targetUrl}</p>
                    <div className="flex gap-4 mt-2 text-xs text-[var(--text-muted)] flex-wrap">
                      <span>时间: {String(job.scheduleHour).padStart(2, "0")}:{String(job.scheduleMinute).padStart(2, "0")}</span>
                      <span>{job.city} / {job.district}</span>
                      {job.lastRunAt && (
                        <span>
                          上次: {new Date(job.lastRunAt).toLocaleString("zh-CN")}
                          <span className={`ml-1 ${statusBadge(job.lastRunStatus)} text-[10px] px-1 rounded`}>{job.lastRunStatus}</span>
                          {job.lastPipelineCount > 0 && <span className="ml-1">({job.lastPipelineCount}条)</span>}
                        </span>
                      )}
                    </div>
                    {job.lastRunError && <p className="mt-1 text-xs text-[var(--negative)] truncate">{job.lastRunError}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => runNow(job)} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors">执行</button>
                    <button onClick={() => { setEditJob({ ...job }); setShowForm(true); }} className={btnGhost}>编辑</button>
                    <button onClick={() => toggleActive(job)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${job.isActive ? "bg-[var(--panel)] text-[var(--text-muted)] hover:text-[var(--text)]" : "bg-[var(--positive-soft)] text-[var(--positive)]"}`}>{job.isActive ? "停用" : "启用"}</button>
                    <button onClick={() => deleteJob(job)} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--negative-soft)] text-[var(--negative)] hover:bg-[var(--negative)] hover:text-white transition-colors">删除</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
