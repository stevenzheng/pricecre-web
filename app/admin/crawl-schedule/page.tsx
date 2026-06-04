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
  createdAt: string;
}

function statusBadge(status: string) {
  switch (status) {
    case "SUCCESS":
      return "bg-bitmart-aurora/20 text-bitmart-aurora";
    case "FAILED":
      return "bg-bitmart-neon/20 text-bitmart-neon";
    default:
      return "bg-bitmart-muted/20 text-bitmart-muted";
  }
}

function typeBadge(type: string) {
  switch (type) {
    case "OFFICE":
      return "bg-bitmart-accent/20 text-bitmart-accent";
    case "SHOPS":
      return "bg-bitmart-aurora/20 text-bitmart-aurora";
    case "INDUSTRIAL":
      return "bg-yellow-500/20 text-yellow-400";
    default:
      return "bg-bitmart-muted/20 text-bitmart-muted";
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
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  async function handleSubmit(e: React.FormEvent) {
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
      if (!res.ok) throw new Error("请求失败");
      setActionMsg(editJob.id ? "计划已更新" : "计划已创建");
      setShowForm(false);
      setEditJob(null);
      fetchJobs();
    } catch {
      setActionMsg("操作失败，请重试");
    }
  }

  async function toggleActive(job: CrawlJob) {
    try {
      await fetch(`/api/agent/schedule/${job.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !job.isActive }),
      });
      fetchJobs();
      setActionMsg(`${job.label} 已${job.isActive ? "停用" : "启用"}`);
    } catch {
      setActionMsg("操作失败");
    }
  }

  async function deleteJob(job: CrawlJob) {
    if (!confirm(`确定删除「${job.label}」？`)) return;
    try {
      await fetch(`/api/agent/schedule/${job.id}`, { method: "DELETE" });
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
      setActionMsg(`「${job.label}」已删除`);
    } catch {
      setActionMsg("删除失败");
    }
  }

  async function runNow(job: CrawlJob) {
    setActionMsg(`正在触发「${job.label}」...`);
    try {
      const res = await fetch("/api/agent/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: job.targetUrl,
          propertyType: job.propertyType,
          city: job.city,
          district: job.district,
          projectName: job.label,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMsg(`「${job.label}」完成，assetId: ${data.assetId}`);
      } else {
        setActionMsg(`失败: ${data.msg || data.error}`);
      }
      fetchJobs();
    } catch {
      setActionMsg("触发失败");
    }
  }

  function openNew() {
    setEditJob({
      label: "",
      targetUrl: "",
      propertyType: "OFFICE",
      city: "shanghai",
      district: "pudong",
      scheduleHour: 2,
      scheduleMinute: 0,
      isActive: true,
    });
    setShowForm(true);
  }

  function openEdit(job: CrawlJob) {
    setEditJob({ ...job });
    setShowForm(true);
  }

  return (
    <div className="min-h-screen bg-bitmart-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium">爬取计划管理</h1>
            <p className="text-bitmart-muted text-sm mt-1">
              配置定时抓取任务，Vercel Cron 每30分钟检查一次到期计划
            </p>
          </div>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-bitmart-aurora text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            + 新建计划
          </button>
        </div>

        {actionMsg && (
          <div
            className="mb-4 px-4 py-2 bg-bitmart-surface border border-bitmart-border rounded-lg text-sm cursor-pointer"
            onClick={() => setActionMsg("")}
          >
            {actionMsg}
          </div>
        )}

        {showForm && editJob && (
          <form
            onSubmit={handleSubmit}
            className="mb-6 p-4 bg-bitmart-surface border border-bitmart-border rounded-lg space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-bitmart-muted">名称</label>
                <input
                  className="w-full mt-1 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm"
                  value={editJob.label || ""}
                  onChange={(e) =>
                    setEditJob({ ...editJob, label: e.target.value })
                  }
                  placeholder="例：前滩太古里每日抓取"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-bitmart-muted">目标 URL</label>
                <input
                  className="w-full mt-1 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm font-mono"
                  value={editJob.targetUrl || ""}
                  onChange={(e) =>
                    setEditJob({ ...editJob, targetUrl: e.target.value })
                  }
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="text-xs text-bitmart-muted">业态</label>
                <select
                  className="w-full mt-1 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm"
                  value={editJob.propertyType}
                  onChange={(e) =>
                    setEditJob({
                      ...editJob,
                      propertyType: e.target.value as any,
                    })
                  }
                >
                  <option value="OFFICE">办公 OFFICE</option>
                  <option value="SHOPS">商业 SHOPS</option>
                  <option value="INDUSTRIAL">产业园 INDUSTRIAL</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-bitmart-muted">城市 / 区域</label>
                <div className="flex gap-2 mt-1">
                  <input
                    className="flex-1 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm"
                    value={editJob.city || ""}
                    onChange={(e) =>
                      setEditJob({ ...editJob, city: e.target.value })
                    }
                    placeholder="shanghai"
                  />
                  <input
                    className="flex-1 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm"
                    value={editJob.district || ""}
                    onChange={(e) =>
                      setEditJob({ ...editJob, district: e.target.value })
                    }
                    placeholder="jing_an"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-bitmart-muted">
                  执行时间 (24h)
                </label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    min={0}
                    max={23}
                    className="w-20 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm"
                    value={editJob.scheduleHour ?? 2}
                    onChange={(e) =>
                      setEditJob({
                        ...editJob,
                        scheduleHour: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <span className="py-2 text-bitmart-muted">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    className="w-20 px-3 py-2 bg-bitmart-black border border-bitmart-border rounded text-sm"
                    value={editJob.scheduleMinute ?? 0}
                    onChange={(e) =>
                      setEditJob({
                        ...editJob,
                        scheduleMinute: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-bitmart-aurora text-black font-medium rounded-lg text-sm hover:opacity-90"
              >
                {editJob.id ? "保存修改" : "创建计划"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditJob(null);
                }}
                className="px-4 py-2 bg-bitmart-border text-bitmart-muted rounded-lg text-sm hover:text-white"
              >
                取消
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-bitmart-muted text-sm">加载中...</p>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center bg-bitmart-surface border border-bitmart-border rounded-lg">
            <p className="text-bitmart-muted">暂无爬取计划</p>
            <p className="text-bitmart-muted text-xs mt-1">
              点击「+ 新建计划」创建第一个定时抓取任务
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={`p-4 bg-bitmart-surface border rounded-lg transition-all ${
                  job.isActive
                    ? "border-bitmart-border"
                    : "border-bitmart-border/40 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{job.label}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${typeBadge(
                          job.propertyType
                        )}`}
                      >
                        {job.propertyType}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          job.isActive
                            ? "bg-bitmart-aurora/20 text-bitmart-aurora"
                            : "bg-bitmart-muted/20 text-bitmart-muted"
                        }`}
                      >
                        {job.isActive ? "启用" : "停用"}
                      </span>
                    </div>
                    <p className="text-bitmart-muted text-xs font-mono truncate">
                      {job.targetUrl}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-bitmart-muted">
                      <span>
                        时间:{" "}
                        {String(job.scheduleHour).padStart(2, "0")}:
                        {String(job.scheduleMinute).padStart(2, "0")}
                      </span>
                      <span>
                        {job.city} / {job.district}
                      </span>
                      {job.lastRunAt && (
                        <span>
                          上次: {new Date(job.lastRunAt).toLocaleString("zh-CN")}
                          <span
                            className={`ml-1 ${statusBadge(job.lastRunStatus)} text-[10px] px-1 rounded`}
                          >
                            {job.lastRunStatus}
                          </span>
                          {job.lastPipelineCount > 0 && (
                            <span className="ml-1">
                              ({job.lastPipelineCount}条)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {job.lastRunError && (
                      <p className="mt-1 text-xs text-bitmart-neon truncate">
                        {job.lastRunError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4 shrink-0">
                    <button
                      onClick={() => runNow(job)}
                      className="px-3 py-1.5 text-xs bg-bitmart-accent/20 text-bitmart-accent rounded hover:bg-bitmart-accent/30"
                      title="立即执行一次"
                    >
                      执行
                    </button>
                    <button
                      onClick={() => openEdit(job)}
                      className="px-3 py-1.5 text-xs bg-bitmart-border text-bitmart-muted rounded hover:text-white"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => toggleActive(job)}
                      className={`px-3 py-1.5 text-xs rounded ${
                        job.isActive
                          ? "bg-bitmart-muted/20 text-bitmart-muted hover:text-white"
                          : "bg-bitmart-aurora/20 text-bitmart-aurora"
                      }`}
                    >
                      {job.isActive ? "停用" : "启用"}
                    </button>
                    <button
                      onClick={() => deleteJob(job)}
                      className="px-3 py-1.5 text-xs bg-bitmart-neon/10 text-bitmart-neon rounded hover:bg-bitmart-neon/20"
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
    </div>
  );
}
