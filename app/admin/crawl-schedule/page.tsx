// app/admin/crawl-schedule/page.tsx — Ghost Admin Crawl Management
"use client";

import useSWR, { useSWRConfig } from "swr";
import { useState, useCallback } from "react";

interface CrawlJob {
  id: string;
  label: string;
  targetUrl: string;
  propertyType: "OFFICE" | "SHOPS" | "INDUSTRIAL";
  city: string;
  district: string;
  isActive: boolean;
  lastRunAt: string | null;
  lastRunStatus: string | null;
  lastPipelineCount: number;
}

const typeLabel: Record<string, string> = { OFFICE: "Office", SHOPS: "Retail", INDUSTRIAL: "Industrial" };

export default function CrawlSchedulePage() {
  const { data: jobs = [], isLoading, mutate } = useSWR<CrawlJob[]>("/api/agent/schedule");
  const { mutate: globalMutate } = useSWRConfig();
  const [showForm, setShowForm] = useState(false);
  const [editJob, setEditJob] = useState<Partial<CrawlJob> | null>(null);
  const [toast, setToast] = useState("");

  /* ---- Optimistic Update Helpers ---- */
  const optUpdate = useCallback(
    async (id: string, patch: Partial<CrawlJob>, rollback: Partial<CrawlJob>) => {
      if (!jobs) return;
      const old = jobs;
      const next = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
      mutate(next, false);
      try {
        const res = await fetch(`/api/agent/schedule/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("API error");
        mutate();
        globalMutate("/api/agent/schedule");
      } catch {
        mutate(jobs.map((j) => (j.id === id ? { ...j, ...rollback } : j)), false);
        setToast("操作失败，已回滚");
        setTimeout(() => setToast(""), 3000);
      }
    },
    [jobs, mutate, globalMutate]
  );

  const toggleActive = (job: CrawlJob) => {
    optUpdate(job.id, { isActive: !job.isActive }, { isActive: job.isActive });
  };

  const deleteJob = async (job: CrawlJob) => {
    if (!confirm(`删除「${job.label}」？`)) return;
    mutate(
      jobs.filter((j) => j.id !== job.id),
      false
    );
    try {
      await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
      mutate();
    } catch {
      mutate();
      setToast("删除失败");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJob) return;
    const url = editJob.id ? `/api/agent/schedule/${editJob.id}` : "/api/agent/schedule";
    const method = editJob.id ? "PUT" : "POST";
    try {
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editJob) });
      if (res.ok) {
        setShowForm(false);
        setEditJob(null);
        mutate();
        setToast(editJob.id ? "已更新" : "已创建");
      }
    } catch {
      setToast("保存失败");
    }
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header">
        <h1 className="gh-page-title">爬取计划管理</h1>
        <p className="gh-page-desc">管理目标站点，按城市与业态自动化调度数据采集</p>
      </div>

      {/* Action bar */}
      <div className="gh-action-bar">
        <button
          onClick={() => {
            setEditJob({ label: "", targetUrl: "", propertyType: "OFFICE", city: "shanghai", district: "pudong", isActive: true });
            setShowForm(true);
          }}
          className="gh-btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          添加站点
        </button>
        <button className="gh-btn-outline" onClick={() => { setToast("全量抓取已触发"); setTimeout(() => setToast(""), 3000); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
          </svg>
          全量抓取
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="gh-toast" style={{ marginBottom: 16 }} onClick={() => setToast("")}>{toast}</div>}

      {/* Form */}
      {showForm && editJob && (
        <div className="gh-form-card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 12px" }}>
              <div>
                <label className="gh-label">站点名称</label>
                <input className="gh-input" value={editJob.label || ""} onChange={(e) => setEditJob({ ...editJob, label: e.target.value })} placeholder="前滩太古里" required />
              </div>
              <div>
                <label className="gh-label">URL</label>
                <input className="gh-input gh-input-mono" value={editJob.targetUrl || ""} onChange={(e) => setEditJob({ ...editJob, targetUrl: e.target.value })} placeholder="https://..." required />
              </div>
              <div>
                <label className="gh-label">业态</label>
                <select className="gh-select" value={editJob.propertyType} onChange={(e) => setEditJob({ ...editJob, propertyType: e.target.value as CrawlJob["propertyType"] })}>
                  <option value="OFFICE">写字楼</option>
                  <option value="SHOPS">商业零售</option>
                  <option value="INDUSTRIAL">产业园</option>
                </select>
              </div>
              <div>
                <label className="gh-label">城市 / 区域</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input className="gh-input" value={editJob.city || ""} onChange={(e) => setEditJob({ ...editJob, city: e.target.value })} placeholder="shanghai" style={{ flex: 1 }} />
                  <input className="gh-input" value={editJob.district || ""} onChange={(e) => setEditJob({ ...editJob, district: e.target.value })} placeholder="jing_an" style={{ flex: 1 }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid #E5E7EB" }}>
              <button type="submit" className="gh-btn-primary">{editJob.id ? "保存" : "创建"}</button>
              <button type="button" className="gh-btn-text" onClick={() => { setShowForm(false); setEditJob(null); }}>取消</button>
            </div>
          </form>
        </div>
      )}

      {/* Skeleton */}
      {isLoading && (
        <div className="gh-card-static" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="gh-skeleton" style={{ height: 64, borderRadius: 8 }} />)}
        </div>
      )}

      {/* Empty */}
      {!isLoading && jobs.length === 0 && (
        <div className="gh-empty">
          <svg className="gh-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2"/>
          </svg>
          <p className="gh-empty-title">暂无目标站点</p>
          <p className="gh-empty-desc">点击「添加站点」创建第一个爬取目标</p>
        </div>
      )}

      {/* Job list */}
      {!isLoading && jobs.length > 0 && (
        <div className="gh-card-static" style={{ overflow: "hidden" }}>
          {jobs.map((job, i) => (
            <div
              key={job.id}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 20px",
                borderBottom: i < jobs.length - 1 ? "1px solid #E5E7EB" : "none",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className={`gh-badge ${job.isActive ? "gh-badge-success" : "gh-badge-neutral"}`}>
                    {job.isActive ? "Active" : "Paused"}
                  </span>
                  <span className="gh-badge gh-badge-neutral">{typeLabel[job.propertyType]}</span>
                  <span style={{ fontWeight: 600, fontSize: 14, color: "#15171A" }}>{job.label}</span>
                </div>
                <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 12, fontWeight: 500, color: "#738A94", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.targetUrl}</p>
              </div>
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => toggleActive(job)} className="gh-btn-text gh-btn-sm">{job.isActive ? "停用" : "启用"}</button>
                <button onClick={() => { setEditJob({ ...job }); setShowForm(true); }} className="gh-btn-text gh-btn-sm">编辑</button>
                <button onClick={() => deleteJob(job)} className="gh-btn-danger gh-btn-sm">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
