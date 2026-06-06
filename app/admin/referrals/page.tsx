// app/admin/referrals/page.tsx — Ghost Admin Referral Management
"use client";

import { useState, useEffect } from "react";

interface ReferralUser {
  id: string; email: string; myReferralCode: string;
  referralViewCount: number; purchasedViewCount: number;
  lifetimeReferralEarned: number; referralsCount: number; createdAt: string;
}
interface ReferralRecord {
  id: string; referrerEmail: string; referrerCode: string;
  refereeEmail: string; rewarded: boolean; createdAt: string;
}

export default function ReferralsAdminPage() {
  const [users, setUsers] = useState<ReferralUser[]>([]);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "records">("users");
  const [toast, setToast] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try { const res = await fetch("/api/admin/referrals"); const data = await res.json(); setUsers(data.users || []); setRecords(data.referrals || []); } catch {}
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleRegenerate = async (userId: string) => {
    if (!confirm("确认重新生成邀请码？旧码将失效。")) return;
    await fetch("/api/admin/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "regenerate" }) });
    fetchData(); setToast("邀请码已重新生成"); setTimeout(() => setToast(""), 3000);
  };
  const handleResetLifetime = async (userId: string) => {
    if (!confirm("确认重置防刷锁？")) return;
    await fetch("/api/admin/referrals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action: "resetLifetime" }) });
    fetchData(); setToast("已解锁"); setTimeout(() => setToast(""), 3000);
  };

  return (
    <div className="vl-content-inner">
      <div className="vl-page-header">
        <h1 className="vl-page-title">邀请码管理</h1>
        <p className="vl-page-desc">{users.length} 个用户 · {users.reduce((s, u) => s + u.referralsCount, 0)} 次裂变转化</p>
      </div>

      {toast && <div className="vl-toast" style={{ marginBottom: 16 }} onClick={() => setToast("")}>{toast}</div>}

      <div className="vl-action-bar">
        <div className="vl-filter-tabs">
          {(["users", "records"] as const).map((t) => (
            <button key={t} className={`vl-filter-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>
              {t === "users" ? "用户邀请码" : "裂变记录"}
            </button>
          ))}
        </div>
        <button onClick={fetchData} className="vl-btn-ghost">刷新</button>
      </div>

      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : tab === "users" ? (
        <div className="vl-table-wrap">
          <table className="vl-table">
            <thead>
              <tr>
                <th>用户邮箱</th><th>邀请码</th><th style={{ width: 100 }}>链接</th>
                <th style={{ textAlign: "right" }}>裂变额度</th><th style={{ textAlign: "right" }}>付费额度</th>
                <th style={{ textAlign: "right" }}>累计获取</th><th style={{ textAlign: "right" }}>邀请人数</th>
                <th style={{ width: 140 }} />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.email}</td>
                  <td className="vl-td-mono">{u.myReferralCode || "—"}</td>
                  <td className="vl-td-hint" style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis" }}>pricecre.com/r/{u.myReferralCode}</td>
                  <td className="vl-td-mono" style={{ textAlign: "right" }}>{u.referralViewCount}</td>
                  <td className="vl-td-mono" style={{ textAlign: "right" }}>{u.purchasedViewCount}</td>
                  <td className="vl-td-mono" style={{ textAlign: "right", color: (u.lifetimeReferralEarned ?? 0) >= 100 ? "#EE0000" : "#0070F3" }}>
                    {u.lifetimeReferralEarned ?? 0}
                    {(u.lifetimeReferralEarned ?? 0) >= 100 && " 🔒"}
                  </td>
                  <td className="vl-td-mono" style={{ textAlign: "right" }}>{u.referralsCount}</td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => handleRegenerate(u.id)} className="vl-btn-ghost vl-btn-sm">重生成</button>
                      {(u.lifetimeReferralEarned ?? 0) >= 100 && (
                        <button onClick={() => handleResetLifetime(u.id)} className="vl-btn-danger vl-btn-sm">解锁</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vl-table-wrap">
          <table className="vl-table">
            <thead>
              <tr>
                <th>邀请人</th><th>邀请码</th><th>被邀请人</th><th>状态</th><th>时间</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600 }}>{r.referrerEmail}</td>
                  <td className="vl-td-mono">{r.referrerCode}</td>
                  <td>{r.refereeEmail}</td>
                  <td><span className={`vl-badge ${r.rewarded ? "vl-badge-success" : "vl-badge-warning"}`}>{r.rewarded ? "已奖励" : "待奖励"}</span></td>
                  <td className="vl-td-hint">{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
