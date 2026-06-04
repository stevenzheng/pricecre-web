// app/admin/field-settings/page.tsx — FieldMetadata management
"use client";

import { useState, useEffect } from "react";

const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function FieldSettingsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OFFICE");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/field-settings?type=${filter}`)
      .then(r => r.json()).then(d => setFields(d.fields || []))
      .finally(() => setLoading(false));
  }, [filter]);

  const toggleDisplay = async (id: string, current: boolean) => {
    await fetch(`/api/admin/field-settings/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDisplayed: !current }),
    });
    setFields(prev => prev.map(f => f.id === id ? { ...f, isDisplayed: !current } : f));
  };

  const toggleLock = async (id: string, current: boolean) => {
    await fetch(`/api/admin/field-settings/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isLocked: !current }),
    });
    setFields(prev => prev.map(f => f.id === id ? { ...f, isLocked: !current } : f));
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">字段管理</h1>
        <p className="admin-page-desc">控制各业态在前台资产卡片中显示哪些字段、哪些须解锁查看</p>
      </div>

      <div style={{ marginBottom: 20, display: "flex", gap: 8 }}>
        {["OFFICE", "SHOPS", "INDUSTRIAL"].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: "6px 14px", borderRadius: 4, border: "1px solid",
            borderColor: filter === t ? "#2563EB" : "#e5edf5",
            background: filter === t ? "rgba(37,99,235,0.08)" : "#fff",
            color: filter === t ? "#2563EB" : "#64748d",
            fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>{typeLabel[t]}</button>
        ))}
      </div>

      {loading ? <p style={{ color: "#64748d", fontSize: 14 }}>加载中...</p> : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead>
              <tr>
                <th>字段Key</th>
                <th>字段名</th>
                <th style={{ textAlign: "center" }}>前台显示</th>
                <th style={{ textAlign: "center" }}>须解锁</th>
                <th style={{ textAlign: "center" }}>排序</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(f => (
                <tr key={f.id}>
                  <td style={{ fontFamily: "Geist Mono, monospace", fontSize: 12 }}>{f.fieldKey}</td>
                  <td>{f.fieldName}</td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => toggleDisplay(f.id, f.isDisplayed)} style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 4, border: "none",
                      background: f.isDisplayed ? "rgba(5,150,105,0.12)" : "#f1f3f5",
                      color: f.isDisplayed ? "#059669" : "#64748d", fontSize: 11, cursor: "pointer",
                    }}>{f.isDisplayed ? "显示" : "隐藏"}</button>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button onClick={() => toggleLock(f.id, f.isLocked)} style={{
                      display: "inline-block", padding: "2px 10px", borderRadius: 4, border: "none",
                      background: f.isLocked ? "rgba(37,99,235,0.08)" : "#f1f3f5",
                      color: f.isLocked ? "#2563EB" : "#64748d", fontSize: 11, cursor: "pointer",
                    }}>{f.isLocked ? "🔒 解锁查看" : "公开"}</button>
                  </td>
                  <td className="str-td-mono" style={{ textAlign: "center" }}>{f.sortOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
