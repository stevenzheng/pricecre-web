"use client";
import { useState, useEffect } from "react";

const roleLabel: Record<string, string> = { SUPER_ADMIN: "超级管理员", ADMIN_DATA: "数据管理员", USER: "普通用户" };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "USER" });
  const [msg, setMsg] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setMsg("用户已创建"); setShowForm(false); setForm({ email: "", password: "", role: "USER" }); fetchUsers(); }
    else setMsg("创建失败: " + ((await res.json()).error));
  };

  const setRole = async (id: string, role: string) => {
    await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    fetchUsers();
  };

  const resetPassword = async (id: string) => {
    const pw = prompt("新密码：");
    if (!pw) return;
    await fetch(`/api/admin/users/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) });
    setMsg("密码已重置");
  };

  const deleteUser = async (u: any) => {
    if (!confirm(`删除用户 ${u.email || u.id}？此操作不可逆。`)) return;
    await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    fetchUsers(); setMsg("已删除");
  };

  const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 12px", border: "1px solid #e5edf5", borderRadius: 4, fontSize: 13, color: "#1A1A2E", fontFamily: "MiSans, sans-serif", outline: "none" };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header" style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1 className="admin-page-title">用户管理</h1>
          <p className="admin-page-desc">{users.length} 位注册用户</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ fontSize: 12, padding: "6px 16px" }}>+ 添加用户</button>
      </div>
      {msg && <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(37,99,235,0.08)", color: "#2563EB", fontSize: 13, cursor: "pointer" }} onClick={() => setMsg("")}>{msg}</div>}

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: "#fff", border: "1px solid #e5edf5", borderRadius: 6, padding: 16, marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>邮箱</label><input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
          <div style={{ flex: 1 }}><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>密码</label><input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} /></div>
          <div style={{ width: 140 }}><label style={{ fontSize: 11, fontWeight: 500, color: "#64748d" }}>角色</label><select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>{Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
          <button type="submit" className="btn-primary" style={{ fontSize: 12, padding: "7px 20px", height: 38 }}>创建</button>
          <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">取消</button>
        </form>
      )}

      {loading ? <p style={{ color: "#64748d", fontSize: 14 }}>加载中...</p> : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead><tr><th>邮箱</th><th style={{ textAlign: "center" }}>角色</th><th style={{ textAlign: "right" }}>付费</th><th style={{ textAlign: "right" }}>邀约</th><th>注册时间</th><th style={{ textAlign: "right", width: 200 }}>操作</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.email || "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    <select value={u.role} onChange={e => setRole(u.id, e.target.value)} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #e5edf5", fontSize: 12, color: "#1A1A2E", background: "#fff" }}>
                      {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.purchasedViewCount}</td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.referralViewCount}</td>
                  <td className="str-td-hint">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => resetPassword(u.id)} className="btn-ghost">重置密码</button>
                    <button onClick={() => deleteUser(u)} className="btn-danger">删除</button>
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
