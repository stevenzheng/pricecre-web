"use client";
import { useState, useEffect } from "react";
const typeLabel: Record<string, string> = { OFFICE: "办公", SHOPS: "商业", INDUSTRIAL: "产业园" };

export default function FieldSettingsPage() {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("OFFICE");
  useEffect(() => { setLoading(true); fetch(`/api/admin/field-settings?type=${filter}`).then(r => r.json()).then(d => setFields(d.fields || [])).finally(() => setLoading(false)); }, [filter]);
  const toggle = async (id: string, key: string, val: boolean) => { await fetch(`/api/admin/field-settings/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: !val }) }); setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: !val } : f)); };

  return (
    <div className="gh-content-inner">
      <div className="gh-page-header"><h1 className="gh-page-title">字段管理</h1><p className="gh-page-desc">控制各业态前台资产卡片显示哪些字段</p></div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>{Object.keys(typeLabel).map(t => <button key={t} className={`gh-filter-tab${filter === t ? " active" : ""}`} onClick={() => setFilter(t)}>{typeLabel[t]}</button>)}</div>
      {loading ? <div className="gh-empty"><p className="gh-empty-title">加载中...</p></div> : (
        <table className="gh-table"><thead><tr><th>字段Key</th><th>名称</th><th style={{ textAlign: "center" }}>显示</th><th style={{ textAlign: "center" }}>须解锁</th><th style={{ textAlign: "center" }}>排序</th></tr></thead><tbody>
          {fields.map((f: any) => (
            <tr key={f.id}>
              <td style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}>{f.fieldKey}</td>
              <td>{f.fieldName}</td>
              <td style={{ textAlign: "center" }}><button onClick={() => toggle(f.id, "isDisplayed", f.isDisplayed)} className={`gh-badge ${f.isDisplayed ? "gh-badge-success" : "gh-badge-neutral"}`} style={{ cursor: "pointer", border: "none" }}>{f.isDisplayed ? "显示" : "隐藏"}</button></td>
              <td style={{ textAlign: "center" }}><button onClick={() => toggle(f.id, "isLocked", f.isLocked)} className={`gh-badge ${f.isLocked ? "gh-badge-accent" : "gh-badge-neutral"}`} style={{ cursor: "pointer", border: "none" }}>{f.isLocked ? "🔒" : "公开"}</button></td>
              <td className="gh-mono" style={{ textAlign: "center" }}>{f.sortOrder}</td>
            </tr>
          ))}
        </tbody></table>
      )}
    </div>
  );
}
