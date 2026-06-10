// app/admin/data-review/page.tsx — Asset Data Manager
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type ViewMode = "list" | "card";

const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };
const cities = ["上海","北京","广州","成都","杭州","深圳","苏州","西安","长沙"];

interface PropertyRow {
  id: string; projectName: string; city: string; district: string;
  propertyType: string; faceRent: number; dataSource: string;
  confidenceScore: number; createdAt: string;
}

export default function DataReviewPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
          <div style={{ display: "inline-flex", borderRadius: 6, border: "1px solid #E5E5E5", overflow: "hidden" }}>
            <button onClick={() => setViewMode("list")} style={{ padding: "5px 10px", border: "none", background: viewMode === "list" ? "#0070F3" : "#FFF", color: viewMode === "list" ? "#FFF" : "#737373", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>列表</button>
            <button onClick={() => setViewMode("card")} style={{ padding: "5px 10px", border: "none", borderLeft: "1px solid #E5E5E5", background: viewMode === "card" ? "#0070F3" : "#FFF", color: viewMode === "card" ? "#FFF" : "#737373", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>卡片</button>
          </div>
          <button onClick={fetchData} className="vl-btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>刷新</button>
          <button onClick={() => setShowAddForm(!showAddForm)} className="vl-btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}>
            {showAddForm ? "取消" : "+ 手动添加"}
          </button>
          <button onClick={() => router.push('/admin/corrections')} className="vl-btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }}>纠错审核</button>
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

      {/* List View */}
      {viewMode === "list" && properties.length > 0 && (
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
                    <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                      <button onClick={() => router.push(`/admin/data-review/${p.id}`)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>编辑</button>
                      <button onClick={()=>handleDelete(p.id)} style={{ padding: "3px 8px", borderRadius: 4, border: "1px solid #EE0000", background: "rgba(238,0,0,0.04)", color: "#EE0000", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === "card" && properties.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {properties.map(p => (
            <div key={p.id} style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", overflow: "hidden" }}>
              {/* Card Header */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #F0F0F0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.projectName}</p>
                  <p style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)", margin: 0 }}>{p.city} · {p.district}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", padding: "2px 6px", borderRadius: 4, background: "rgba(0,112,243,0.06)", color: "#0070F3", whiteSpace: "nowrap" }}>
                  {typeLabels[p.propertyType]||p.propertyType}
                </span>
              </div>

              {/* Card Body */}
              <div onClick={() => router.push(`/admin/data-review/${p.id}`)} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)" }}>挂牌面价</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 600, color: "#171717" }}>
                    ¥{Number(p.faceRent||0).toFixed(1)}
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>/㎡/天</span>
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)" }}>可信度</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 80, height: 6, borderRadius: 3, background: "#F0F0F0", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min((p.confidenceScore||0)*100, 100)}%`, height: "100%", borderRadius: 3, background: (p.confidenceScore||0) >= 0.8 ? "#10B981" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EE0000" }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, fontFamily: "var(--font-mono)", color: (p.confidenceScore||0) >= 0.8 ? "#10B981" : (p.confidenceScore||0) >= 0.6 ? "#F5A623" : "#EE0000" }}>
                      {((p.confidenceScore||0)*100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)" }}>数据来源</span>
                  <span style={{ fontSize: 12, color: "#404040", fontFamily: "var(--font-sans)" }}>{p.dataSource}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ padding: "10px 16px", borderTop: "1px solid #F0F0F0", display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button onClick={() => router.push(`/admin/data-review/${p.id}`)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #0070F3", background: "rgba(0,112,243,0.04)", color: "#0070F3", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>编辑</button>
                <button onClick={()=>handleDelete(p.id)} style={{ padding: "4px 12px", borderRadius: 5, border: "1px solid #EE0000", background: "rgba(238,0,0,0.04)", color: "#EE0000", fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}>删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
