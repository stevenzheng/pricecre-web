"use client";
import { useState, useEffect } from "react";
const roleLabel: Record<string, string> = { SUPER_ADMIN: "超级管理员", ADMIN_DATA: "数据管理员", USER: "普通用户" };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "USER" });
  const [msg, setMsg] = useState("");

  const fetchUsers = () => { setLoading(true); fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).finally(() => setLoading(false)); };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => { e.preventDefault(); const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (res.ok) { setMsg("已创建"); setShowForm(false); setForm({ email: "", password: "", role: "USER" }); fetchUsers(); } else setMsg("失败: " + ((await res.json()).error)); };
  const setRole = async (id: string, role: string) => { await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) }); fetchUsers(); };
  const resetPw = async (id: string) => { const pw = prompt("新密码："); if (!pw) return; await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) }); setMsg("密码已重置"); };
  const delUser = async (u: any) => { if (!confirm(`删除 ${u.email}？`)) return; await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" }); fetchUsers(); setMsg("已删除"); };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div><h1 className="gh-page-title">用户管理</h1><p className="gh-page-desc">{users.length} 位注册用户</p></div>
        <button onClick={() => setShowForm(true)} className="gh-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>+ 添加用户</button>
      </div>
      {msg && <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(62,176,239,0.08)", color: "#3EB0EF", fontSize: 13, cursor: "pointer" }} onClick={() => setMsg("")}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="gh-card" style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}><label className="gh-label">邮箱</label><input className="gh-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
          <div style={{ flex: 1 }}><label className="gh-label">密码</label><input className="gh-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} /></div>
          <div style={{ width: 140 }}><label className="gh-label">角色</label><select className="gh-select" style={{ width: "100%" }} value={form.role} onChange={e => setForm({...form, role: e.target.value})}>{Object.entries(roleLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <button type="submit" className="gh-btn-primary" style={{ fontSize: 13, padding: "8px 20px" }}>创建</button>
          <button type="button" onClick={() => setShowForm(false)} className="gh-btn-ghost">取消</button>
        </form>
      )}

      {loading ? <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div> : (
        <table className="gh-table"><thead><tr><th>邮箱</th><th style={{ textAlign: "center" }}>角色</th><th style={{ textAlign: "right" }}>付费</th><th style={{ textAlign: "right" }}>邀约</th><th>注册时间</th><th style={{ textAlign: "right", width: 200 }}></th></tr></thead><tbody>
          {users.map(u => (
            <tr key={u.id}><td style={{ fontWeight: 600 }}>{u.email || "—"}</td>
              <td style={{ textAlign: "center" }}><select className="gh-select" value={u.role} onChange={e => setRole(u.id, e.target.value)} style={{ fontSize: 13, padding: "4px 8px" }}>{Object.entries(roleLabel).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></td>
              <td className="gh-mono" style={{ textAlign: "right" }}>{u.purchasedViewCount}</td>
              <td className="gh-mono" style={{ textAlign: "right" }}>{u.referralViewCount}</td>
              <td className="gh-hint">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
              <td style={{ textAlign: "right" }}><button onClick={() => resetPw(u.id)} className="gh-btn-ghost">重置密码</button><button onClick={() => delUser(u)} className="gh-btn-danger">删除</button></td>
            </tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}
