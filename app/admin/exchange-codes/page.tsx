// app/admin/exchange-codes/page.tsx — 4 types + history
"use client";
import { useState, useEffect } from "react";

type CodeType = "view10" | "view50" | "monthly" | "ai200";

interface CodeRecord { id: string; code: string; email: string; credits: number; type: string; createdAt: string; }

const TYPES: { key: CodeType; label: string; credits: number; desc: string }[] = [
  { key: "view10", label: "10次查看额度", credits: 10, desc: "注册即送10次资产查看权益" },
  { key: "view50", label: "¥99/50次查看", credits: 50, desc: "付费购买50次查看额度" },
  { key: "monthly", label: "包月不限次", credits: 999, desc: "¥299/月 不限次查看+AI分析" },
  { key: "ai200", label: "AI对话200次", credits: 200, desc: "200条AI对话额度" },
];

export default function ExchangeCodesPage() {
  const [records, setRecords] = useState<CodeRecord[]>([]);
  const [type, setType] = useState<CodeType>("view10");
  const [email, setEmail] = useState("");
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState("");

  // 历史记录从服务端读取（数据库持久化）；服务端不可用时回退 localStorage
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/admin/generate-codes");
      const d = await res.json();
      if (Array.isArray(d.records) && d.records.length > 0) { setRecords(d.records); return; }
    } catch {}
    try { setRecords(JSON.parse(localStorage.getItem("pricecre_code_log")||"[]")); } catch {}
  };

  useEffect(() => { loadHistory(); }, []);

  const generate = async () => {
    if (!email.trim()) { setMsg("请输入邮箱"); return; }
    const t = TYPES.find(x => x.key === type)!;
    setGenerating(true); setMsg("");
    try {
      const res = await fetch("/api/admin/generate-codes", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: email.trim(), credits: t.credits, type: t.key, label: t.label }) });
      const d = await res.json();
      if (d.success) {
        // 本地也留一份，作为服务端不可用时的降级显示
        const rec: CodeRecord = { id: Date.now().toString(36), code: d.code, email: email.trim(), credits: t.credits, type: t.label, createdAt: new Date().toISOString() };
        try { localStorage.setItem("pricecre_code_log", JSON.stringify([rec, ...records].slice(0,200))); } catch {}
        setMsg(`已生成 ${d.code} (${t.label})${d.emailSent ? " · 邮件已发送" : " · 邮件发送失败，请手动告知用户"}`); setEmail("");
        loadHistory();
      } else { setMsg(d.error || "失败"); }
    } catch { setMsg("网络错误"); }
    setGenerating(false);
  };

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>兑换码管理</h2>
        <p style={{ fontSize: 13, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>{records.length} 条记录</p>
      </div>

      <div className="vl-card-static" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", marginBottom: 10 }}>兑换码类型</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, marginBottom: 14 }}>
          {TYPES.map(t => (
            <div key={t.key} onClick={() => setType(t.key)} style={{ padding: "12px 8px", borderRadius: 8, border: type===t.key?"2px solid #0070F3":"1px solid #E5E5E5", background: type===t.key?"rgba(0,112,243,0.04)":"#FFF", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", marginTop: 2 }}>{t.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key==="Enter"&&generate()} placeholder="用户邮箱" style={{ flex:1, padding:"10px 14px", border:"1px solid #D4D4D4", borderRadius:8, fontSize:13, fontFamily:"var(--font-sans)", outline:"none" }} />
          <button onClick={generate} disabled={generating} style={{ padding:"10px 24px", borderRadius:8, border:"none", background:"#0070F3", color:"#FFF", fontSize:13, fontWeight:500, fontFamily:"var(--font-sans)", cursor:"pointer", whiteSpace:"nowrap" }}>{generating?"生成中...":"生成"}</button>
        </div>
        {msg&&<div style={{ marginTop:10, padding:"8px 12px", borderRadius:6, fontSize:12, fontFamily:"var(--font-sans)", background:msg.includes("已生成")?"rgba(16,185,129,0.06)":"rgba(238,0,0,0.06)", color:msg.includes("已生成")?"#10B981":"#EE0000" }}>{msg}</div>}
      </div>

      {records.length===0?<div className="vl-card-static" style={{ padding:40, textAlign:"center" }}><p className="vl-empty-title">暂无记录</p></div>:(
        <div className="vl-card-static" style={{ overflow:"hidden" }}>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr style={{ borderBottom:"1px solid #E5E5E5", background:"#FAFAFA" }}>
                <th style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:500, color:"#737373", fontFamily:"var(--font-sans)" }}>兑换码</th>
                <th style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:500, color:"#737373", fontFamily:"var(--font-sans)" }}>邮箱</th>
                <th style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:500, color:"#737373", fontFamily:"var(--font-sans)" }}>类型</th>
                <th style={{ padding:"8px 14px", textAlign:"right", fontSize:11, fontWeight:500, color:"#737373", fontFamily:"var(--font-sans)" }}>额度</th>
                <th style={{ padding:"8px 14px", textAlign:"left", fontSize:11, fontWeight:500, color:"#737373", fontFamily:"var(--font-sans)" }}>时间</th>
              </tr></thead>
              <tbody>{records.map(r => (
                <tr key={r.id} style={{ borderBottom:"1px solid #F0F0F0" }}>
                  <td style={{ padding:"8px 14px", fontFamily:"var(--font-mono)", fontWeight:600, color:"#0070F3" }}>{r.code}</td>
                  <td style={{ padding:"8px 14px", color:"#404040", fontFamily:"var(--font-sans)" }}>{r.email}</td>
                  <td style={{ padding:"8px 14px", color:"#404040", fontFamily:"var(--font-sans)", fontSize:12 }}>{r.type}</td>
                  <td style={{ padding:"8px 14px", textAlign:"right", fontFamily:"var(--font-mono)", color:"#10B981" }}>{r.credits}次</td>
                  <td style={{ padding:"8px 14px", color:"#A3A3A3", fontSize:12, fontFamily:"var(--font-sans)" }}>{new Date(r.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
