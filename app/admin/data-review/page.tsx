// app/admin/data-review/page.tsx — Ghost Admin Data Review Queue
"use client";

import useSWR from "swr";
import { useState } from "react";

type ReviewStatus = "pending" | "approved" | "rejected";
type AssetType = "OFFICE" | "SHOPS" | "INDUSTRIAL";

interface ReviewItem {
  id: string;
  projectName: string;
  city: string;
  district: string;
  assetType: AssetType;
  faceRent: number;
  netRent: number;
  source: string;
  submittedAt: string;
  status: ReviewStatus;
}

const STATUS_OPTIONS = [
  { label: "全部", value: "all" },
  { label: "待审核", value: "pending" },
  { label: "已通过", value: "approved" },
  { label: "已驳回", value: "rejected" },
] as const;

const typeLabel: Record<AssetType, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function DataReviewPage() {
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");
  const { data: items = [], isLoading } = useSWR<ReviewItem[]>("/api/agent/schedule", {
    fallbackData: [],
  });

  const filtered = filter === "all" ? items : items.filter((d) => d.status === filter);

  const badge = (s: ReviewStatus) => {
    switch (s) {
      case "pending": return <span className="gh-badge gh-badge-accent">待审核</span>;
      case "approved": return <span className="gh-badge gh-badge-success">已通过</span>;
      case "rejected": return <span className="gh-badge gh-badge-danger">已驳回</span>;
    }
  };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header">
        <h1 className="gh-page-title">审核队列</h1>
        <p className="gh-page-desc">管线产出的待审资产 — 逐项审核确保数据质量</p>
      </div>

      {/* Filter tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="gh-filter-tabs">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`gh-filter-tab${filter === opt.value ? " active" : ""}`}
              onClick={() => setFilter(opt.value)}
            >
              {opt.label}
              {opt.value === "all" && items.length > 0 && (
                <span style={{ marginLeft: 4, fontSize: 11, color: "#A5B4BF" }}>{items.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="gh-card-static" style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="gh-skeleton" style={{ height: 48, borderRadius: 6 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="gh-empty">
          <svg className="gh-empty-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
            <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
          </svg>
          <p className="gh-empty-title">暂无待审核资产</p>
          <p className="gh-empty-desc">管线尚未产出数据或所有资产已处理完毕</p>
        </div>
      ) : (
        <div className="gh-table-wrap">
          <table className="gh-table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>城市</th>
                <th>业态</th>
                <th style={{ textAlign: "right" }}>面价</th>
                <th style={{ textAlign: "right" }}>净有效</th>
                <th>来源</th>
                <th>提交</th>
                <th>状态</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.projectName}</td>
                  <td className="gh-td-muted">{item.city} · {item.district}</td>
                  <td><span className="gh-badge gh-badge-neutral">{typeLabel[item.assetType]}</span></td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>{item.faceRent.toFixed(1)}</td>
                  <td className="gh-td-mono" style={{ textAlign: "right" }}>{item.netRent.toFixed(1)}</td>
                  <td className="gh-td-hint">{item.source}</td>
                  <td className="gh-td-hint">{item.submittedAt}</td>
                  <td>{badge(item.status)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="gh-btn-primary gh-btn-sm">通过</button>
                      <button className="gh-btn-danger gh-btn-sm">驳回</button>
                    </div>
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
