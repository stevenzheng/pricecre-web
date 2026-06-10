// app/admin/corrections/page.tsx — 纠错审核管理
"use client";

import { useState, useEffect } from "react";

interface Correction {
  id: string;
  propertyId: string;
  fieldKey: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  reason: string;
  status: string;
  submittedBy: string;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
  asset?: { projectName: string; city: string; district: string; propertyType: string } | null;
}

const assetTypeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业零售", INDUSTRIAL: "产业园" };

const statusLabel: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  REJECTED: "已拒绝",
};

const statusColor: Record<string, string> = {
  PENDING: "#F5A623",
  APPROVED: "#10B981",
  REJECTED: "#EF4444",
};

export default function CorrectionsAdminPage() {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/corrections?status=${filter}`);
      const data = await res.json();
      setCorrections(data.corrections || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await fetch("/api/admin/corrections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      fetchData();
    } catch {}
  };

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>精算纠错审核</p>
          <p style={{ fontSize: 13, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>
            {corrections.length} 条 · {corrections.filter(c => c.status === "PENDING").length} 条待审
          </p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "#F0F0F0", borderRadius: 6, padding: 2 }}>
          {(["PENDING","APPROVED","REJECTED"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: filter === s ? "#FFF" : "transparent", color: filter === s ? "#171717" : "#737373", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: filter === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
              {statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "#737373" }}>加载中...</div> : corrections.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#171717", margin: "0 0 4px", fontFamily: "var(--font-sans)" }}>暂无纠错记录</p>
          <p style={{ fontSize: 12, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>用户在资产卡片中提交精算字段纠错后会显示在此处</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {corrections.map(c => (
            <div key={c.id} style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  {/* 资产主信息 */}
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", marginBottom: 2 }}>
                    {c.asset ? c.asset.projectName : "（未匹配到资产）"}
                    {c.asset && (
                      <span style={{ fontSize: 11, fontWeight: 400, color: "#737373", marginLeft: 8 }}>
                        {c.asset.city} · {c.asset.district} · {assetTypeLabels[c.asset.propertyType] || c.asset.propertyType}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#0070F3", fontFamily: "var(--font-sans)" }}>纠错字段：{c.fieldLabel || c.fieldKey}</span>
                    <span style={{ fontSize: 10, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "2px 6px", borderRadius: 4, background: `${statusColor[c.status]}15`, color: statusColor[c.status] }}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </div>
                  <p style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-mono)", margin: 0 }}>
                    {c.propertyId} · {c.fieldKey}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {c.status === "PENDING" && (
                    <>
                      <button onClick={() => handleAction(c.id, "approve")}
                        style={{ padding: "5px 14px", borderRadius: 5, border: "none", background: "#10B981", color: "#FFF", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>通过</button>
                      <button onClick={() => handleAction(c.id, "reject")}
                        style={{ padding: "5px 14px", borderRadius: 5, border: "1px solid #EF4444", background: "#FFF", color: "#EF4444", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>拒绝</button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", padding: "10px 14px", background: "#FAFAFA", borderRadius: 8, marginBottom: 8 }}>
                <div>
                  <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", display: "block" }}>原值</span>
                  <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: "#737373", textDecoration: "line-through" }}>{c.oldValue}</span>
                </div>
                <span style={{ fontSize: 14, color: "#A3A3A3" }}>→</span>
                <div>
                  <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", display: "block" }}>新值</span>
                  <span style={{ fontSize: 14, fontFamily: "var(--font-mono)", color: "#0070F3", fontWeight: 600 }}>{c.newValue}</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>
                <span>提交人：{c.submittedBy || "匿名"} · {new Date(c.createdAt).toLocaleString("zh-CN")}</span>
                <span>{c.reason ? `理由：${c.reason}` : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
