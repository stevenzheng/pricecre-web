// app/admin/data-review/page.tsx — Asset Data Manager
"use client";

import { useState, useEffect } from "react";

interface Property {
  id: string; projectName: string; city: string; district: string;
  propertyType: string; faceRent: number; dataSource: string;
  confidenceScore: number; createdAt: string;
}

const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };
const cities = ["上海","北京","广州","成都","杭州","深圳","苏州","西安","长沙"];

export default function DataReviewPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    projectName: "", city: "上海", district: "浦东", propertyType: "OFFICE",
    faceRent: "", dataSource: "manual", confidenceScore: "0.9",
  });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/properties");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProperties((data.properties || []).map((p: any) => ({
        id: String(p.id || ""),
        projectName: String(p.projectName || ""),
        city: String(p.city || ""),
        district: String(p.district || ""),
        propertyType: String(p.propertyType || "OFFICE"),
        faceRent: Number(p.faceRent) || 0,
        dataSource: String(p.dataSource || ""),
        confidenceScore: Number(p.confidenceScore) || 0,
        createdAt: String(p.createdAt || ""),
      })));
    } catch (e: any) {
      // Fallback to mock properties served via API
      try {
        const mockRes = await fetch("/api/admin/mock-properties");
        const mockData = await mockRes.json();
        setProperties((mockData.properties || []).map((p: any) => ({
          id: String(p.id || ""),
          projectName: String(p.projectName || ""),
          city: String(p.city || ""),
          district: String(p.district || ""),
          propertyType: String(p.propertyType || "OFFICE"),
          faceRent: Number(p.faceRent) || 0,
          dataSource: String(p.dataSource || ""),
          confidenceScore: Number(p.confidenceScore) || 0,
          createdAt: String(p.createdAt || ""),
        })));
      } catch {
        setError("数据加载失败");
        setProperties([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectName) { setMsg("项目名称必填"); return; }
    setAdding(true); setMsg("");
    try {
      const res = await fetch("/api/admin/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, faceRent: parseFloat(form.faceRent) || 0, confidenceScore: parseFloat(form.confidenceScore) || 0.9 }),
      });
      const d = await res.json();
      if (d.success) { setMsg("添加成功！"); setShowAddForm(false); fetchData(); }
      else { setMsg(d.error || "添加失败"); }
    } catch { setMsg("网络错误"); }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除？")) return;
    try { await fetch(`/api/admin/properties?id=${id}`, { method: "DELETE" }); fetchData(); } catch {}
  };

  if (loading) return (
    <div style={{ padding: 24 }}>
      <p style={{ fontSize: 13, color: "#737373", fontFamily: "var(--font-sans)" }}>加载中...</p>
    </div>
  );

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>资产数据管理</p>
          <p style={{ fontSize: 13, fontWeight: 400, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>{properties.length} 条资产</p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={fetchData} className="vl-btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>刷新</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="vl-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
            {showAddForm ? "取消" : "+ 手动添加"}
          </button>
        </div>
      </div>

      {msg && <div style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", background: msg.includes("成功") ? "rgba(0,112,243,0.06)" : "rgba(238,0,0,0.06)", color: msg.includes("成功") ? "#0070F3" : "#EE0000" }}>{msg}</div>}
      {error && <div style={{ marginBottom: 12, padding: "6px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", background: "rgba(238,0,0,0.06)", color: "#EE0000" }}>{error}</div>}

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: 16, padding: 16, background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>项目名称 *</label><input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} required /></div>
          <div><label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>城市</label><select value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }}>{cities.map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>区域</label><input value={form.district} onChange={e => setForm({...form, district: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} /></div>
          <div><label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>业态</label><select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }}>{Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: "#737373", display: "block", marginBottom: 4, fontFamily: "var(--font-sans)" }}>面价 (元/㎡/天)</label><input type="number" step="0.1" value={form.faceRent} onChange={e => setForm({...form, faceRent: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }} /></div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={adding} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#10B981", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              {adding ? "添加中..." : "确认添加"}
            </button>
          </div>
        </form>
      )}

      {/* Empty state */}
      {properties.length === 0 && !loading && !error && (
        <div style={{ padding: 40, textAlign: "center", background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>暂无资产数据</p>
          <p style={{ fontSize: 12, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>数据库中没有资产记录，点击"+ 手动添加"开始录入</p>
        </div>
      )}

      {/* Table */}
      {properties.length > 0 && (
        <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5E5", background: "#FAFAFA" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>项目名称</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>城市</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>区域</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>业态</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>面价</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>可信度</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>数据源</th>
                  <th style={{ padding: "10px 14px", width: 60 }}></th>
                </tr>
              </thead>
              <tbody>
                {properties.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #F0F0F0" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>{p.projectName}</td>
                    <td style={{ padding: "10px 14px", color: "#404040", fontFamily: "var(--font-sans)" }}>{p.city}</td>
                    <td style={{ padding: "10px 14px", color: "#404040", fontFamily: "var(--font-sans)" }}>{p.district}</td>
                    <td style={{ padding: "10px 14px", color: "#404040", fontFamily: "var(--font-sans)" }}>{typeLabels[p.propertyType]||p.propertyType}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#171717" }}>¥{Number(p.faceRent||0).toFixed(1)}</td>
                    <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: (p.confidenceScore||0) >= 0.8 ? "#0070F3" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EE0000" }}>
                      {((p.confidenceScore||0)*100).toFixed(0)}%
                    </td>
                    <td style={{ padding: "10px 14px", color: "#737373", fontSize: 12, fontFamily: "var(--font-sans)" }}>{p.dataSource}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={()=>handleDelete(p.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #EE0000", background: "rgba(238,0,0,0.04)", color: "#EE0000", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
