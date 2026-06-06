"use client";
import { useState, useEffect } from "react";

export default function PipelineLogPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/agent/schedule").then(r => r.json()).then(d => setEntries((Array.isArray(d) ? d : []).filter((x: any) => x.lastRunAt))).finally(() => setLoading(false)); }, []);

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header"><h1 className="vl-page-title">管线日志</h1><p className="vl-page-desc">Agent 爬取管线运行历史 · 成功 {entries.filter(e => e.lastRunStatus === "SUCCESS").length} / 失败 {entries.filter(e => e.lastRunStatus === "FAILED").length} · 累计 {entries.reduce((s:number,e:any)=>s+(e.lastPipelineCount||0),0)} 条</p></div>
      {loading ? <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div> : entries.length === 0 ? <div className="vl-empty"><p className="vl-empty-title">暂无运行记录</p><p className="vl-empty-desc">触发全量抓取后显示</p></div> : (
        <table className="vl-table"><thead><tr><th>站点</th><th style={{ textAlign: "center" }}>状态</th><th style={{ textAlign: "right" }}>产量</th><th>运行时间</th><th>错误信息</th></tr></thead><tbody>
          {entries.map((e:any) => (
            <tr key={e.id}><td style={{ fontWeight: 600 }}>{e.label}</td><td style={{ textAlign: "center" }}><span className={`vl-badge ${e.lastRunStatus === "SUCCESS" ? "vl-badge-success" : "vl-badge-error"}`}>{e.lastRunStatus}</span></td><td className="vl-mono" style={{ textAlign: "right" }}>{e.lastPipelineCount || 0}</td><td className="vl-hint">{e.lastRunAt ? new Date(e.lastRunAt).toLocaleString("zh-CN") : "—"}</td><td className="vl-hint" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.lastRunError || "—"}</td></tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}
