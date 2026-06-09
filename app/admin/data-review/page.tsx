// app/admin/data-review/page.tsx — Asset Data Manager (review + manual add)
"use client";

import { useState, useEffect } from "react";

interface Property {
  id: string; projectName: string; city: string; district: string;
  propertyType: string; faceRent: number; dataSource: string;
  confidenceScore: number; createdAt: string; status: string;
}

export default function DataReviewPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    projectName: "", city: "上海", district: "浦东", propertyType: "OFFICE",
    faceRent: "", dataSource: "manual", confidenceScore: "0.9",
  });
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/properties");
      const data = await res.json();
      const props = data.properties || [];
      if (props.length > 0) {
        setProperties(props);
      } else {
        // Fallback: load mock data via dynamic import
        import("@/lib/mock-data").then(m => {
          setProperties(m.mockProperties.map((p: any) => ({
            ...p,
            confidenceScore: p.confidenceScore || 0.85,
            status: "published",
          })));
        });
      }
    } catch {
      // Fallback
      import("@/lib/mock-data").then(m => {
        setProperties(m.mockProperties.map((p: any) => ({
          ...p,
          confidenceScore: p.confidenceScore || 0.85,
          status: "published",
        })));
      });
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
        body: JSON.stringify({
          ...form,
          faceRent: parseFloat(form.faceRent) || 0,
          confidenceScore: parseFloat(form.confidenceScore) || 0.9,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("添加成功！");
        setForm({ projectName: "", city: "上海", district: "浦东", propertyType: "OFFICE", faceRent: "", dataSource: "manual", confidenceScore: "0.9" });
        setShowAddForm(false);
        fetchData();
      } else {
        setMsg(d.error || "添加失败");
      }
    } catch { setMsg("网络错误"); }
    setAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确认删除此资产？")) return;
    try {
      await fetch(`/api/admin/properties?id=${id}`, { method: "DELETE" });
      fetchData();
    } catch {}
  };

  const typeLabels: Record<string, string> = { OFFICE: "写字楼", SHOPS: "商业", INDUSTRIAL: "产业园" };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">资产数据管理</h1>
        <p className="admin-page-desc">{properties.length} 条资产 · 审查队列 + 手动添加</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={fetchData} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e4ea", background: "#fff", color: "#64748d", fontSize: 12, cursor: "pointer" }}>刷新</button>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#533afd", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
          {showAddForm ? "取消" : "+ 手动添加资产"}
        </button>
        {msg && <span style={{ fontSize: 12, color: msg.includes("成功") ? "#10b981" : "#ef4444", alignSelf: "center" }}>{msg}</span>}
      </div>

      {showAddForm && (
        <form onSubmit={handleAdd} style={{ marginBottom: 16, padding: 16, background: "#fff", borderRadius: 10, border: "1px solid #e2e4ea", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={{ fontSize: 11, color: "#64748d", display: "block", marginBottom: 4 }}>项目名称 *</label><input value={form.projectName} onChange={e => setForm({...form, projectName: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }} required /></div>
          <div><label style={{ fontSize: 11, color: "#64748d", display: "block", marginBottom: 4 }}>城市</label><select value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }}>{["上海","北京","广州","成都","杭州","深圳","苏州","西安","长沙"].map(c=><option key={c}>{c}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: "#64748d", display: "block", marginBottom: 4 }}>区域</label><input value={form.district} onChange={e => setForm({...form, district: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }} /></div>
          <div><label style={{ fontSize: 11, color: "#64748d", display: "block", marginBottom: 4 }}>业态</label><select value={form.propertyType} onChange={e => setForm({...form, propertyType: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }}>{Object.entries(typeLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
          <div><label style={{ fontSize: 11, color: "#64748d", display: "block", marginBottom: 4 }}>面价 (元/㎡/天)</label><input type="number" step="0.1" value={form.faceRent} onChange={e => setForm({...form, faceRent: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }} /></div>
          <div><label style={{ fontSize: 11, color: "#64748d", display: "block", marginBottom: 4 }}>可信度 (0-1)</label><input type="number" step="0.01" min="0" max="1" value={form.confidenceScore} onChange={e => setForm({...form, confidenceScore: e.target.value})} style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }} /></div>
          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button type="submit" disabled={adding} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
              {adding ? "添加中..." : "确认添加"}
            </button>
          </div>
        </form>
      )}

      {loading ? <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>加载中...</div> : properties.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#64748d" }}>
          <p style={{ fontSize: 16 }}>暂无资产数据</p>
          <p style={{ fontSize: 13 }}>点击"手动添加资产"开始录入</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead><tr><th>项目名称</th><th>城市</th><th>区域</th><th>业态</th><th style={{textAlign:"right"}}>面价</th><th>可信度</th><th>数据源</th><th style={{width:60}}>操作</th></tr></thead>
            <tbody>
              {properties.map(p => (
                <tr key={p.id}>
                  <td style={{fontWeight:400}}>{p.projectName}</td><td>{p.city}</td><td>{p.district}</td>
                  <td>{typeLabels[p.propertyType]||p.propertyType}</td>
                  <td style={{textAlign:"right",fontFamily:"var(--font-mono)"}}>¥{p.faceRent.toFixed(1)}</td>
                  <td><span style={{fontSize:11,color:p.confidenceScore>=0.8?"#10b981":p.confidenceScore>=0.6?"#f59e0b":"#ef4444"}}>{(p.confidenceScore*100).toFixed(0)}%</span></td>
                  <td className="str-td-hint">{p.dataSource}</td>
                  <td><button onClick={()=>handleDelete(p.id)} style={{padding:"3px 8px",borderRadius:4,border:"1px solid #ef4444",background:"#fef2f2",color:"#ef4444",fontSize:11,cursor:"pointer"}}>删除</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
