// app/admin/referrals/page.tsx — Referral Code Management
"use client";

import { useState, useEffect } from "react";

interface ReferralUser {
  id: string;
  email: string;
  myReferralCode: string;
  referralViewCount: number;
  purchasedViewCount: number;
  lifetimeReferralEarned: number;
  referralsCount: number;
  createdAt: string;
}

interface ReferralRecord {
  id: string;
  referrerEmail: string;
  referrerCode: string;
  refereeEmail: string;
  rewarded: boolean;
  createdAt: string;
}

export default function ReferralsAdminPage() {
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "records">("users");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/referrals");
      const data = await res.json();
      setUsers(data.users || []);
      setRecords(data.referrals || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleRegenerate = async (userId: string) => {
    if (!confirm("确认重新生成邀请码？旧码将失效。")) return;
    await fetch("/api/admin/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "regenerate" }),
    });
    fetchData();
  };

  const handleResetLifetime = async (userId: string) => {
    if (!confirm("确认重置防刷锁？lifetimeReferralEarned 将归零。")) return;
    await fetch("/api/admin/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "resetLifetime" }),
    });
    fetchData();
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">邀请码管理</h1>
        <p className="admin-page-desc">
          {users.length} 个用户 · {users.reduce((s, u) => s + u.referralsCount, 0)} 次裂变转化
        </p>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        {(["users", "records"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid",
              borderColor: tab === t ? "#533afd" : "#e2e4ea",
              background: tab === t ? "rgba(83,58,253,0.08)" : "#fff",
              color: tab === t ? "#533afd" : "#64748d", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}
          >
            {t === "users" ? "用户邀请码" : "裂变记录"}
          </button>
        ))}
        <button onClick={fetchData} style={{ marginLeft: "auto", padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e4ea", background: "#fff", color: "#64748d", fontSize: 12, cursor: "pointer" }}>
          刷新
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>加载中...</div>
      ) : tab === "users" ? (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>用户邮箱</th>
                <th>邀请码</th>
                <th style={{ width: 100 }}>邀请链接</th>
                <th style={{ textAlign: "right" }}>裂变额度</th>
                <th style={{ textAlign: "right" }}>付费额度</th>
                <th style={{ textAlign: "right" }}>累计获取</th>
                <th style={{ textAlign: "right" }}>邀请人数</th>
                <th style={{ width: 130 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 400 }}>{u.email}</td>
                  <td className="str-td-mono">{u.myReferralCode || "未生成"}</td>
                  <td className="str-td-hint" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>
                    pricecre.com/r/{u.myReferralCode}
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.referralViewCount}</td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.purchasedViewCount}</td>
                  <td style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: (u.lifetimeReferralEarned ?? 0) >= 100 ? "#ef4444" : "#10b981" }}>
                      {u.lifetimeReferralEarned ?? 0}
                      {(u.lifetimeReferralEarned ?? 0) >= 100 && " 🔒"}
                    </span>
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.referralsCount}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleRegenerate(u.id)}
                        style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #533afd", background: "#fff", color: "#533afd", fontSize: 11, cursor: "pointer" }}>
                        重生成
                      </button>
                      {(u.lifetimeReferralEarned ?? 0) >= 100 && (
                        <button onClick={() => handleResetLifetime(u.id)}
                          style={{ padding: "4px 10px", borderRadius: 5, border: "1px solid #ef4444", background: "#fef2f2", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
                          解锁
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>邀请人</th>
                <th>邀请码</th>
                <th>被邀请人</th>
                <th>状态</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.referrerEmail}</td>
                  <td className="str-td-mono">{r.referrerCode}</td>
                  <td>{r.refereeEmail}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 500, color: r.rewarded ? "#10b981" : "#f59e0b" }}>
                      {r.rewarded ? "已奖励" : "待奖励"}
                    </span>
                  </td>
                  <td className="str-td-hint">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
