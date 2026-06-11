"use client";
import { useState, useEffect } from "react";

const roleLabel: Record<string, string> = { SUPER_ADMIN: "超级管理员", ADMIN_DATA: "数据管理员", USER: "普通用户" };

const statusColors: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "待支付" },
  1: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已支付" },
  2: { bg: "var(--bw-panel)", text: "var(--bw-muted)", label: "已取消" },
  3: { bg: "rgba(238,0,0,0.06)", text: "#EE0000", label: "已退款" },
  4: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "退款中" },
  5: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已完成" },
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "USER" });
  const [msg, setMsg] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userCredits, setUserCredits] = useState<Record<string, any>>({});
  const [userTokens, setUserTokens] = useState<Record<string, any>>({});
  const [auditLogs, setAuditLogs] = useState<Record<string, any[]>>({});
  const [creditNote, setCreditNote] = useState("");
  const [tokenNote, setTokenNote] = useState("");
  const [userDetail, setUserDetail] = useState<Record<string, any>>({});
  const [detailModal, setDetailModal] = useState<{ email: string; type: "views" | "orders" | "chats" } | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users").then(r => r.json()).then(d => {
      const us = d.users || [];
      setUsers(us);
      // Pre-fetch credits/tokens for all users
      us.forEach((u: any) => { if (u.email) fetchUserQuota(u.email); });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUserQuota = async (email: string) => {
    try {
      const [cr, tr, al, ud] = await Promise.all([
        fetch(`/api/admin/user-credits?email=${encodeURIComponent(email)}`).then(r => r.json()),
        fetch(`/api/ai/chat-quota?email=${encodeURIComponent(email)}&assetId=__admin__`).then(r => r.json()),
        fetch(`/api/admin/audit-log?email=${encodeURIComponent(email)}&limit=20`).then(r => r.json()),
        fetch(`/api/admin/user-detail?email=${encodeURIComponent(email)}`).then(r => r.json()),
      ]);
      setUserCredits(prev => ({ ...prev, [email]: cr }));
      setUserTokens(prev => ({ ...prev, [email]: tr }));
      setAuditLogs(prev => ({ ...prev, [email]: al.logs || [] }));
      setUserDetail(prev => ({ ...prev, [email]: ud }));
    } catch {}
  };

  const handleExpand = (u: any) => {
    if (expandedUser === u.id) { setExpandedUser(null); return; }
    setExpandedUser(u.id);
    if (u.email && !userCredits[u.email]) fetchUserQuota(u.email);
  };

  const addCredits = async (email: string, amount: number) => {
    await fetch("/api/admin/user-credits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, addCredits: amount, note: creditNote, adminEmail: "admin" }),
    });
    setCreditNote("");
    fetchUserQuota(email);
    setMsg(`已增加 ${amount} 次查询权益`);
    setTimeout(() => setMsg(""), 2000);
  };

  const setCredits = async (email: string, total: number) => {
    await fetch("/api/admin/user-credits", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, setCredits: total, note: creditNote, adminEmail: "admin" }),
    });
    setCreditNote("");
    fetchUserQuota(email);
    setMsg(`已将查询权益设置为 ${total} 次`);
    setTimeout(() => setMsg(""), 2000);
  };

  const addTokens = async (email: string, amount: number) => {
    await fetch("/api/ai/chat-quota", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, addTokens: amount, note: tokenNote, adminEmail: "admin" }),
    });
    setTokenNote("");
    fetchUserQuota(email);
    setMsg(`已赠送 ${amount} 条对话额度`);
    setTimeout(() => setMsg(""), 2000);
  };

  const setTokens = async (email: string, total: number) => {
    await fetch("/api/ai/chat-quota", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, setTokens: total, note: tokenNote, adminEmail: "admin" }),
    });
    setTokenNote("");
    fetchUserQuota(email);
    setMsg(`已将对话额度设置为 ${total} 条`);
    setTimeout(() => setMsg(""), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("已创建"); setShowForm(false); setForm({ email: "", password: "", role: "USER" }); fetchUsers(); }
    else setMsg("失败: " + ((await res.json()).error));
  };

  const setRole = async (id: string, role: string) => {
    await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    fetchUsers();
  };

  const resetPw = async (id: string) => {
    const pw = prompt("新密码："); if (!pw) return;
    await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setMsg("密码已重置");
    setTimeout(() => setMsg(""), 2000);
  };

  const delUser = async (u: any) => {
    if (!confirm(`删除 ${u.email}？`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" }); fetchUsers(); setMsg("已删除");
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="vl-content-inner">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h1 className="vl-page-title" style={{ margin: 0 }}>用户管理</h1><p className="vl-page-desc">{users.length} 位注册用户</p></div>
        <button onClick={() => setShowForm(true)} className="vl-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>+ 添加用户</button>
      </div>

      {msg && <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(62,176,239,0.08)", color: "#0070F3", fontSize: 13, cursor: "pointer" }} onClick={() => setMsg("")}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleCreate} style={{ marginBottom: 16, padding: 16, background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}><label className="vl-label">邮箱</label><input className="vl-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div style={{ flex: 1 }}><label className="vl-label">密码</label><input className="vl-input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
          <div style={{ width: 140 }}><label className="vl-label">角色</label><select className="vl-select" style={{ width: "100%" }} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <button type="submit" className="vl-btn-primary" style={{ fontSize: 13, padding: "8px 20px" }}>创建</button>
          <button type="button" onClick={() => setShowForm(false)} className="vl-btn-ghost">取消</button>
        </form>
      )}

      {loading ? <div className="bw-loading"><div className="bw-spin" /><span>加载中</span></div> : (
        <div style={{ display: "grid", gap: 10 }}>
          {users.map(u => {
            const isExpanded = expandedUser === u.id;
            const cr = u.email ? userCredits[u.email] : null;
            const tr = u.email ? userTokens[u.email] : null;
            const totalCredits = cr
              ? ((cr.referralCredits || 0) + (cr.purchasedCredits || 0))
              : "-";

            return (
              <div key={u.id} style={{ background: "var(--bw-surface)", borderRadius: 8, border: `1px solid ${isExpanded ? "#0070F3" : "var(--bw-line)"}`, overflow: "hidden", transition: "border-color 0.15s" }}>
                {/* User header row */}
                <div onClick={() => handleExpand(u)} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
                    {u.email?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--bw-text)", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>{u.email || "—"}</div>
                    <div style={{ fontSize: 11, color: "var(--bw-muted)", display: "flex", gap: 8, alignItems: "center" }}>
                      <span>{roleLabel[u.role] || u.role}</span>
                      <span>·</span>
                      <span>{new Date(u.createdAt).toLocaleDateString("zh-CN")}</span>
                      <span>·</span>
                      <span style={{ color: "#0D9488", fontWeight: 600 }}>查询权益 {typeof totalCredits === "number" ? `${totalCredits} 次` : totalCredits}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={e => { e.stopPropagation(); resetPw(u.id); }} className="vl-btn-ghost" style={{ fontSize: 12 }}>重置密码</button>
                    <button onClick={e => { e.stopPropagation(); delUser(u); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "var(--bw-tint-neg)", color: "#E91E63", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>删除</button>
                  </div>
                </div>

                {/* Expanded management panel */}
                {isExpanded && (() => {
                  const ud = u.email ? userDetail[u.email] : null;
                  const totalCreditsVal = cr
                    ? (cr.referralCredits || 0) + (cr.purchasedCredits || 0)
                    : 0;
                  const tokensVal = tr?.tokens || 0;
                  const tokensUsed = tr?.totalUsed || 0;
                  const remaining = Math.max(0, tokensVal - tokensUsed);
                  const viewCount = ud?.viewCount || 0;
                  const orderCount = ud?.paidOrderCount || 0;
                  const chatCount = ud?.totalConversations || 0;

                  return (
                  <div style={{ borderTop: "1px solid var(--bw-line)", background: "var(--bw-panel)", padding: "16px" }}>
                    {/* 资源额度卡片组 */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {/* 查看权益 */}
                      <div style={{ background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", padding: "16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#0D9488", letterSpacing: "0.04em", marginBottom: 8, fontFamily: "var(--font-sans)" }}>查看权益</div>
                        <div style={{ fontSize: 24, fontWeight: 300, color: "#0D9488", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.03em", marginBottom: 4 }}>
                          {totalCreditsVal}
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--bw-muted)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
                          <span>邀约获得 <b style={{ color: "#0D9488", fontWeight: 600 }}>{cr?.referralCredits ?? 0}</b></span>
                          <span>付费获得 <b style={{ color: "#0D9488", fontWeight: 600 }}>{cr?.purchasedCredits ?? 0}</b></span>
                          {(cr?.totalUsed || 0) > 0 && <span>已用 <b style={{ color: "#EE0000", fontWeight: 600 }}>{cr.totalUsed}</b></span>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          {[3, 8, 20, 50].map(n => (
                            <button key={n} onClick={() => addCredits(u.email, n)}
                              style={{ padding: "3px 10px", borderRadius: 999, border: "1px solid var(--bw-tint-pos)", background: "var(--bw-tint-pos)", color: "#0D9488", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>+{n} 次</button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="number" min={0} placeholder="设为..." style={{ width: 56, padding: "4px 8px", border: "1px solid var(--bw-line)", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-geist-mono)", outline: "none" }}
                            onKeyDown={e => { if (e.key === "Enter") setCredits(u.email, Number((e.target as HTMLInputElement).value)); }} />
                          <button onClick={e => {
                            const inp = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement);
                            if (inp?.value) setCredits(u.email, Number(inp.value));
                          }} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid var(--bw-line)", background: "var(--bw-surface)", color: "var(--bw-text-2)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>设置</button>
                          <input value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="备注"
                            style={{ flex: 1, padding: "4px 8px", border: "1px solid var(--bw-line)", borderRadius: 6, fontSize: 11, outline: "none", minWidth: 60 }} />
                        </div>
                      </div>

                      {/* AI 对话额度 */}
                      <div style={{ background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", padding: "16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", letterSpacing: "0.04em", marginBottom: 8, fontFamily: "var(--font-sans)" }}>AI 对话额度</div>
                        <div style={{ fontSize: 24, fontWeight: 300, color: "#2563EB", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.03em", marginBottom: 4 }}>
                          {remaining}
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--bw-muted)", marginBottom: 12, fontFamily: "var(--font-sans)" }}>
                          <span>总额度 <b style={{ color: "#2563EB", fontWeight: 600 }}>{tokensVal}</b></span>
                          {tokensUsed > 0 && <span>已用 <b style={{ color: "#EE0000", fontWeight: 600 }}>{tokensUsed}</b></span>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                          {[100, 500, 1100].map(n => (
                            <button key={n} onClick={() => addTokens(u.email, n)}
                              style={{ padding: "3px 10px", borderRadius: 999, border: "1px solid var(--bw-tint-info)", background: "var(--bw-tint-info)", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>+{n} 条</button>
                          ))}
                        </div>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <input type="number" min={0} placeholder="设为..." style={{ width: 56, padding: "4px 8px", border: "1px solid var(--bw-line)", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-geist-mono)", outline: "none" }}
                            onKeyDown={e => { if (e.key === "Enter") setTokens(u.email, Number((e.target as HTMLInputElement).value)); }} />
                          <button onClick={e => {
                            const inp = (e.currentTarget.parentElement?.querySelector("input") as HTMLInputElement);
                            if (inp?.value) setTokens(u.email, Number(inp.value));
                          }} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid var(--bw-line)", background: "var(--bw-surface)", color: "var(--bw-text-2)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>设置</button>
                          <input value={tokenNote} onChange={e => setTokenNote(e.target.value)} placeholder="备注"
                            style={{ flex: 1, padding: "4px 8px", border: "1px solid var(--bw-line)", borderRadius: 6, fontSize: 11, outline: "none", minWidth: 60 }} />
                        </div>
                      </div>
                    </div>

                    {/* 累计统计卡片 - 可点击查看详情 */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 12 }}>
                      {[
                        { label: "累计提报", value: viewCount, sub: "条查看记录", type: "views" as const, color: "#0D9488" },
                        { label: "累计购买", value: orderCount, sub: "笔已支付订单", type: "orders" as const, color: "#0070F3" },
                        { label: "已确权", value: chatCount, sub: "次 AI 对话", type: "chats" as const, color: "#2563EB" },
                      ].map(item => (
                        <div key={item.label}
                          onClick={() => u.email && setDetailModal({ email: u.email, type: item.type })}
                          style={{
                            background: "var(--bw-surface)", borderRadius: 8, border: "1px solid var(--bw-line)", padding: "12px 14px",
                            cursor: "pointer", transition: "border-color 0.15s",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = item.color)}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--bw-line)")}
                        >
                          <div style={{ fontSize: 11, fontWeight: 500, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 20, fontWeight: 300, color: item.color, fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.03em" }}>{item.value}</div>
                          <div style={{ fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)" }}>{item.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Audit Log */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--bw-text)", marginBottom: 8, fontFamily: "var(--font-sans)" }}>操作日志</div>
                      {auditLogs[u.email]?.length > 0 ? (
                        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
                          <thead><tr style={{ color: "var(--bw-muted)", textAlign: "left" }}>
                            <th style={{ padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>时间</th>
                            <th style={{ padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>操作</th>
                            <th style={{ padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid var(--bw-line)", textAlign: "right" }}>数量</th>
                            <th style={{ padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid var(--bw-line)", textAlign: "right" }}>余额</th>
                            <th style={{ padding: "4px 8px", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>备注</th>
                          </tr></thead>
                          <tbody>
                            {auditLogs[u.email].map((log: any) => {
                              const typeLabel: Record<string, string> = { add_credits: "增加权益", set_credits: "设置权益", add_tokens: "赠送额度", set_tokens: "设置额度", consume_view: "查看资产", consume_chat: "AI对话" };
                              const typeColor: Record<string, string> = { add_credits: "#0D9488", set_credits: "#0D9488", add_tokens: "#2563EB", set_tokens: "#2563EB", consume_view: "var(--bw-muted)", consume_chat: "var(--bw-muted)" };
                              return (
                                <tr key={log.id} style={{ borderBottom: "1px solid var(--bw-panel)" }}>
                                  <td style={{ padding: "3px 8px", color: "var(--bw-hint)", whiteSpace: "nowrap" }}>{new Date(log.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                                  <td style={{ padding: "3px 8px", color: typeColor[log.type] || "var(--bw-text-2)", fontWeight: 600 }}>{typeLabel[log.type] || log.type}</td>
                                  <td style={{ padding: "3px 8px", textAlign: "right", fontFamily: "var(--font-geist-mono)", color: log.amount >= 0 ? "#0D9488" : "#E91E63" }}>{log.amount >= 0 ? `+${log.amount}` : log.amount}</td>
                                  <td style={{ padding: "3px 8px", textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--bw-text)" }}>{log.balance}</td>
                                  <td style={{ padding: "3px 8px", color: "var(--bw-hint)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.note || log.adminEmail || "—"}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : <div style={{ fontSize: 11, color: "var(--bw-hint)" }}>暂无操作记录</div>}
                    </div>

                    {/* Role selector */}
                    <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--bw-text-2)", fontFamily: "var(--font-sans)" }}>角色</span>
                      <select value={u.role} onChange={e => setRole(u.id, e.target.value)}
                        style={{ padding: "4px 10px", border: "1px solid var(--bw-line)", borderRadius: 6, fontSize: 13, outline: "none", background: "var(--bw-surface)" }}>
                        {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* 详情弹窗 - 查看/订单/对话记录 */}
      {detailModal && (() => {
        const ud = userDetail[detailModal.email];
        const titles: Record<string, string> = { views: "查看记录", orders: "购买记录", chats: "对话记录" };

        const renderViews = () => {
          if (!ud?.viewLogs || ud.viewLogs.length === 0) return <div style={{ padding: 20, textAlign: "center", color: "var(--bw-hint)", fontSize: 12 }}>暂无查看记录</div>;
          return (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ color: "var(--bw-muted)" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>资产 ID</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>查看时间</th>
              </tr></thead>
              <tbody>
                {ud.viewLogs.map((v: any, i: number) => (
                  <tr key={v.id || i} style={{ borderBottom: "1px solid var(--bw-panel)" }}>
                    <td style={{ padding: "6px 10px", fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#0070F3" }}>{v.propertyId}</td>
                    <td style={{ padding: "6px 10px", color: "var(--bw-text-2)", whiteSpace: "nowrap" }}>{new Date(v.viewedAt).toLocaleString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };

        const renderOrders = () => {
          if (!ud?.orders || ud.orders.length === 0) return <div style={{ padding: 20, textAlign: "center", color: "var(--bw-hint)", fontSize: 12 }}>暂无购买记录</div>;
          return (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ color: "var(--bw-muted)" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>订单号</th>
                <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>金额</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>状态</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>时间</th>
              </tr></thead>
              <tbody>
                {ud.orders.map((o: any, i: number) => {
                  const st = statusColors[o.status] || statusColors[0];
                  return (
                    <tr key={o.id || i} style={{ borderBottom: "1px solid var(--bw-panel)" }}>
                      <td style={{ padding: "6px 10px", fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#0070F3" }}>{o.orderNo}</td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono)", fontWeight: 600 }}>¥{o.amount.toFixed(2)}</td>
                      <td style={{ padding: "6px 10px" }}>
                        <span style={{ padding: "1px 6px", borderRadius: 3, fontSize: 11, background: st.bg, color: st.text, fontWeight: 500 }}>{st.label}</span>
                      </td>
                      <td style={{ padding: "6px 10px", color: "var(--bw-muted)", fontSize: 11, whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleDateString("zh-CN")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          );
        };

        const renderChats = () => {
          if (!ud?.chatLogs || ud.chatLogs.length === 0) return <div style={{ padding: 20, textAlign: "center", color: "var(--bw-hint)", fontSize: 12 }}>暂无对话记录</div>;
          return (
            <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
              <thead><tr style={{ color: "var(--bw-muted)" }}>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>时间</th>
                <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>消耗</th>
                <th style={{ padding: "6px 10px", textAlign: "right", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>余额</th>
                <th style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, borderBottom: "1px solid var(--bw-line)" }}>备注</th>
                <th style={{ padding: "6px 10px", textAlign: "center", fontWeight: 600, borderBottom: "1px solid var(--bw-line)", width: 60 }}>操作</th>
              </tr></thead>
              <tbody>
                {ud.chatLogs.map((c: any, i: number) => (
                  <tr key={c.id || i} style={{ borderBottom: "1px solid var(--bw-panel)" }}>
                    <td style={{ padding: "6px 10px", color: "var(--bw-hint)", whiteSpace: "nowrap", fontSize: 11 }}>{new Date(c.createdAt).toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "#EE0000" }}>-{Math.abs(c.amount)}</td>
                    <td style={{ padding: "6px 10px", textAlign: "right", fontFamily: "var(--font-geist-mono)", color: "var(--bw-text)" }}>{c.balance}</td>
                    <td style={{ padding: "6px 10px", color: "var(--bw-muted)", fontSize: 11, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.note}>{c.note || "—"}</td>
                    <td style={{ padding: "6px 10px", textAlign: "center" }}>
                      <button
                        onClick={() => {
                          const text = `用户: ${detailModal!.email}\n时间: ${new Date(c.createdAt).toLocaleString("zh-CN")}\n消耗: ${Math.abs(c.amount)} 条\n备注: ${c.note || "AI对话"}`;
                          navigator.clipboard.writeText(text).then(() => setMsg("已复制对话记录"));
                        }}
                        style={{ padding: "2px 8px", borderRadius: 4, border: "1px solid var(--bw-line)", background: "var(--bw-surface)", fontSize: 10, color: "var(--bw-muted)", cursor: "pointer", fontFamily: "var(--font-sans)" }}
                        title="复制记录以便存入知识库"
                      >
                        复制
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        };

        const renderContent = () => {
          switch (detailModal.type) {
            case "views": return renderViews();
            case "orders": return renderOrders();
            case "chats": return renderChats();
            default: return null;
          }
        };

        return (
          <>
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} onClick={() => setDetailModal(null)} />
            <div style={{
              position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              background: "var(--bw-surface)", borderRadius: 12, width: 560, maxWidth: "92vw", maxHeight: "70vh", overflow: "auto",
              zIndex: 101, border: "1px solid var(--bw-line)",
            }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--bw-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--bw-text)", margin: 0, fontFamily: "var(--font-sans)" }}>
                  {detailModal.email} · {titles[detailModal.type]}
                </h3>
                <button onClick={() => setDetailModal(null)}
                  style={{ padding: "2px 8px", borderRadius: 6, border: "none", background: "transparent", fontSize: 18, color: "var(--bw-muted)", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ padding: "12px 16px" }}>
                {renderContent()}
              </div>
            </div>
          </>
        );
      })(      )}
    </div>
  );
}
