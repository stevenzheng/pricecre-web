// app/admin/crawl-schedule/page.tsx — Stripe-Adapted Crawl Management
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

const typeLabels: Record<string, string> = {
  OFFICE: "办公",
  SHOP: "商业",
  SHOPPING: "商业",
  INDUSTRIAL: "产业园",
};

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
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editJob) return;
    const url = editJob.id
      ? `/api/agent/schedule/${editJob.id}`
      : "/api/agent/schedule";
    const method = editJob.id ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editJob),
      });
      if (res.ok) {
        setActionMsg(editJob.id ? "已更新 Updated" : "已创建 Created");
        setShowForm(false);
        setEditJob(null);
        fetchJobs();
      }
    } catch {
      setActionMsg("操作失败");
    }
  };

  const toggleActive = async (job: CrawlJob) => {
    await fetch(`/api/agent/schedule/${job.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !job.isActive }),
    });
    fetchJobs();
  };

  const deleteJob = async (job: CrawlJob) => {
    if (!confirm(`删除「${job.label}」？此操作不可撤销。`)) return;
    await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    setActionMsg("已删除 Deleted");
  };

  const crawlAll = async () => {
    setCrawlingAll(true);
    setActionMsg("正在全量抓取所有目标站点...");
    try {
      const res = await fetch("/api/agent/crawl-all", { method: "POST" });
      const data = await res.json();
      setActionMsg(data.msg || "完成 Completed");
      fetchJobs();
    } catch {
      setActionMsg("抓取失败");
    }
    setCrawlingAll(false);
  };

  const activeCount = jobs.filter((j) => j.isActive).length;

  return (
    <div className="admin-content-inner">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">爬取计划管理</h1>
        <p className="admin-page-desc">
          管理目标站点列表，按城市与业态自动化调度数据采集
        </p>
      </div>

      {/* Action Bar */}
      <div className="str-action-bar">
        <button
          onClick={() => {
            setEditJob({
              label: "",
              targetUrl: "",
              propertyType: "OFFICE",
              city: "shanghai",
              district: "pudong",
              isActive: true,
            });
            setShowForm(true);
          }}
          className="str-btn-primary"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          添加站点
        </button>

        <button
          onClick={crawlAll}
          disabled={crawlingAll || activeCount === 0}
          className="str-btn-ghost"
        >
          {crawlingAll ? (
            "抓取中..."
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
              </svg>
              全量抓取 ({activeCount})
            </>
          )}
        </button>
      </div>

      {/* Toast */}
      {actionMsg && (
        <div
          className="str-toast"
          style={{ marginBottom: 16 }}
          onClick={() => setActionMsg("")}
        >
          {actionMsg}
        </div>
      )}

      {/* Form */}
      {showForm && editJob && (
        <div className="str-form-card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px 12px",
              }}
            >
              <div>
                <label className="str-label">站点名称 Site Name</label>
                <input
                  className="str-input"
                  value={editJob.label || ""}
                  onChange={(e) =>
                    setEditJob({ ...editJob, label: e.target.value })
                  }
                  placeholder="例：前滩太古里"
                  required
                />
              </div>
              <div>
                <label className="str-label">目标 URL Target URL</label>
                <input
                  className="str-input str-input-mono"
                  value={editJob.targetUrl || ""}
                  onChange={(e) =>
                    setEditJob({ ...editJob, targetUrl: e.target.value })
                  }
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="str-label">业态 Asset Type</label>
                <select
                  className="str-select"
                  value={editJob.propertyType}
                  onChange={(e) =>
                    setEditJob({
                      ...editJob,
                      propertyType: e.target.value as CrawlJob["propertyType"],
                    })
                  }
                >
                  <option value="OFFICE">写字楼 Office</option>
                  <option value="SHOPS">商业零售 Retail</option>
                  <option value="INDUSTRIAL">产业园 Industrial</option>
                </select>
              </div>
              <div>
                <label className="str-label">城市 / 区域 City / District</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="str-input"
                    value={editJob.city || ""}
                    onChange={(e) =>
                      setEditJob({ ...editJob, city: e.target.value })
                    }
                    placeholder="shanghai"
                    style={{ flex: 1 }}
                  />
                  <input
                    className="str-input"
                    value={editJob.district || ""}
                    onChange={(e) =>
                      setEditJob({ ...editJob, district: e.target.value })
                    }
                    placeholder="jing_an"
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid #e5edf5",
              }}
            >
              <button type="submit" className="str-btn-primary">
                {editJob.id ? "保存 Save" : "添加 Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditJob(null);
                }}
                className="str-btn-neutral"
              >
                取消 Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="str-skeleton"
              style={{ height: 64, borderRadius: 6 }}
            />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && jobs.length === 0 && (
        <div className="str-empty">
          <svg className="str-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <p className="str-empty-title">暂无目标站点</p>
          <p className="str-empty-desc">
            点击「添加站点」创建第一个爬取目标
          </p>
        </div>
      )}

      {/* Job List */}
      {!loading && jobs.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {jobs.map((job) => (
            <div key={job.id} className="str-card-static" style={{ padding: "16px 20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                {/* Left: info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}
                  >
                    <span
                      className={`str-badge ${
                        job.isActive ? "str-badge-success" : "str-badge-neutral"
                      }`}
                    >
                      {job.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="str-badge str-badge-accent">
                      {typeLabels[job.propertyType] || job.propertyType}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 14,
                        fontWeight: 400,
                        color: "#061b31",
                      }}
                    >
                      {job.label}
                    </span>
                  </div>

                  <p
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 12,
                      fontWeight: 500,
                      color: "#64748d",
                      margin: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {job.targetUrl}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontSize: 11,
                        fontWeight: 300,
                        color: "#64748d",
                      }}
                    >
                      {job.city} / {job.district}
                    </span>
                    {job.lastRunAt && (
                      <span
                        style={{
                          fontFamily: "var(--font-sans)",
                          fontSize: 11,
                          fontWeight: 300,
                          color: "#64748d",
                        }}
                      >
                        上次: {new Date(job.lastRunAt).toLocaleString("zh-CN")}{" "}
                        <span
                          className={`str-badge ${
                            job.lastRunStatus === "SUCCESS"
                              ? "str-badge-success"
                              : "str-badge-danger"
                          }`}
                        >
                          {job.lastRunStatus}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: actions */}
                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => toggleActive(job)}
                    className="str-btn-neutral str-btn-sm"
                  >
                    {job.isActive ? "停用" : "启用"}
                  </button>
                  <button
                    onClick={() => {
                      setEditJob({ ...job });
                      setShowForm(true);
                    }}
                    className="str-btn-neutral str-btn-sm"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => deleteJob(job)}
                    className="str-btn-danger str-btn-sm"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
