// app/admin/data-review/page.tsx — Stripe-Adapted Data Review Queue
"use client";

import { useState } from "react";

type ReviewStatus = "pending" | "approved" | "rejected";
type ReviewAssetType = "OFFICE" | "SHOPS" | "INDUSTRIAL";

interface ReviewItem {
  id: string;
  projectName: string;
  city: string;
  district: string;
  assetType: ReviewAssetType;
  faceRent: number;
  netRent: number;
  source: string;
  submittedAt: string;
  status: ReviewStatus;
}

const mockData: ReviewItem[] = [];

const statusTabs: { label: string; value: ReviewStatus | "all" }[] = [
  { label: "全部 All", value: "all" },
  { label: "待审核 Pending", value: "pending" },
  { label: "已通过 Approved", value: "approved" },
  { label: "已驳回 Rejected", value: "rejected" },
];

export default function DataReviewPage() {
  const [filter, setFilter] = useState<ReviewStatus | "all">("all");

  const filtered = filter === "all" ? mockData : mockData.filter((d) => d.status === filter);

  const assetTypeBadge = (t: ReviewAssetType) => {
    switch (t) {
      case "OFFICE":
        return <span className="str-badge str-badge-accent">写字楼</span>;
      case "SHOPS":
        return <span className="str-badge str-badge-neutral">商业</span>;
      case "INDUSTRIAL":
        return <span className="str-badge str-badge-warning">产业园</span>;
    }
  };

  const statusBadge = (s: ReviewStatus) => {
    switch (s) {
      case "pending":
        return <span className="str-badge str-badge-accent">待审核</span>;
      case "approved":
        return <span className="str-badge str-badge-success">已通过</span>;
      case "rejected":
        return <span className="str-badge str-badge-danger">已驳回</span>;
    }
  };

  return (
    <div className="admin-content-inner">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title">审核队列</h1>
        <p className="admin-page-desc">
          Agent 管线产出的待审资产 — 逐项审核确保数据质量
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: 20 }}>
        <div className="str-filter-tabs">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              className={`str-filter-tab${filter === tab.value ? " active" : ""}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table or Empty */}
      {filtered.length === 0 ? (
        <div className="str-empty">
          <svg className="str-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <p className="str-empty-title">暂无待审核资产</p>
          <p className="str-empty-desc">
            {filter === "all"
              ? "管线尚未产出数据或所有资产已处理完毕"
              : `当前筛选条件下无 ${statusTabs.find((t) => t.value === filter)?.label.split(" ")[1]} 资产`}
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>城市</th>
                <th>区域</th>
                <th>业态</th>
                <th style={{ textAlign: "right" }}>面价 (元/m²/月)</th>
                <th style={{ textAlign: "right" }}>净有效租金</th>
                <th>来源</th>
                <th>提交时间</th>
                <th>状态</th>
                <th style={{ width: 120 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 400 }}>{item.projectName}</td>
                  <td>{item.city}</td>
                  <td>{item.district}</td>
                  <td>{assetTypeBadge(item.assetType)}</td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    {item.faceRent.toFixed(1)}
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>
                    {item.netRent.toFixed(1)}
                  </td>
                  <td className="str-td-hint">{item.source}</td>
                  <td className="str-td-hint">{item.submittedAt}</td>
                  <td>{statusBadge(item.status)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="str-btn-neutral str-btn-sm">通过</button>
                      <button className="str-btn-danger str-btn-sm">驳回</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Footer */}
      {mockData.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 12,
              fontWeight: 300,
              color: "#64748d",
              margin: 0,
            }}
          >
            共 {mockData.length} 条记录
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="str-btn-neutral str-btn-sm">上一页</button>
            <button className="str-btn-neutral str-btn-sm">下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
