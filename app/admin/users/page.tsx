// app/admin/users/page.tsx — User management
"use client";

import { useState, useEffect } from "react";

const roleLabel: Record<string, string> = { SUPER_ADMIN: "超级管理员", ADMIN_DATA: "数据管理员", USER: "普通用户" };

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users").then(r => r.json()).then(d => setUsers(d.users || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const setRole = async (userId: string, role: string) => {
    await fetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role }) });
    fetchUsers();
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">用户管理</h1>
        <p className="admin-page-desc">{users.length} 位注册用户</p>
      </div>

      {loading ? <p style={{ color: "#64748d", fontSize: 14 }}>加载中...</p> : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>邮箱</th>
                <th style={{ textAlign: "center" }}>角色</th>
                <th style={{ textAlign: "right" }}>付费额度</th>
                <th style={{ textAlign: "right" }}>邀请额度</th>
                <th>注册时间</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 500 }}>{u.email || "—"}</td>
                  <td style={{ textAlign: "center" }}>
                    <select value={u.role} onChange={e => setRole(u.id, e.target.value)} style={{
                      padding: "4px 8px", borderRadius: 4, border: "1px solid #e5edf5",
                      fontSize: 12, color: "#1A1A2E", background: "#fff",
                    }}>
                      {Object.entries(roleLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.purchasedViewCount}</td>
                  <td className="str-td-mono" style={{ textAlign: "right" }}>{u.referralViewCount}</td>
                  <td className="str-td-hint">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
