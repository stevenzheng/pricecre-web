// app/admin/exchange-codes/page.tsx — Exchange Code history management
"use client";

import { useState, useEffect } from "react";

interface CodeRecord {
  id: string;
  code: string;
  email: string;
  credits: number;
  redeemedAt: string;
  note: string;
}

export default function ExchangeCodesPage() {
  const [records, setRecords] = useState<CodeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genEmail, setGenEmail] = useState("");
  const [genMsg, setGenMsg] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit-log?type=redeem");
      const data = await res.json();
      // Transform audit logs into code records
      const codes = (data.logs || []).filter((l: any) => l.note?.includes("激活码兑换"))
        .map((l: any) => ({
          id: l.id,
          code: (l.note?.match(/激活码兑换:\s*(\w+)/)?.[1] || "—"),
          email: l.email,
          credits: l.amount,
          redeemedAt: l.createdAt,
          note: l.note,
        }));
      setRecords(codes);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleGenerate = async () => {
    if (!genEmail) { setGenMsg("请输入邮箱"); return; }
    setGenerating(true); setGenMsg("");
    try {
      const res = await fetch("/api/admin/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: genEmail, credits: 8 }),
      });
      const d = await res.json();
      if (d.success) {
        setGenMsg(`已生成激活码: ${d.code}，已记录到历史`);
        setGenEmail("");
        fetchData();
      } else {
        setGenMsg(d.error || "生成失败");
      }
    } catch { setGenMsg("网络错误"); }
    setGenerating(false);
  };

  return (
    <div className="admin-content-inner">
      <div className="admin-page-header">
        <h1 className="admin-page-title">兑换码管理</h1>
        <p className="admin-page-desc">{records.length} 条兑换记录</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={fetchData} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e2e4ea", background: "#fff", color: "#64748d", fontSize: 12, cursor: "pointer" }}>刷新</button>
      </div>

      {/* Generate new code */}
      <div style={{ marginBottom: 16, padding: 14, background: "#fff", borderRadius: 10, border: "1px solid #e2e4ea", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "#171717", whiteSpace: "nowrap" }}>生成兑换码</span>
        <input value={genEmail} onChange={e => setGenEmail(e.target.value)} placeholder="输入用户邮箱" style={{ flex: 1, padding: "8px 10px", border: "1px solid #e2e4ea", borderRadius: 6, fontSize: 13 }} />
        <button onClick={handleGenerate} disabled={generating} style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#10b981", color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
          {generating ? "生成中..." : "生成 8 次额度"}
        </button>
        {genMsg && <span style={{ fontSize: 12, color: genMsg.includes("成功")||genMsg.includes("生成") ? "#10b981" : "#ef4444" }}>{genMsg}</span>}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: "#64748d" }}>加载中...</div> : records.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#64748d" }}>
          <p style={{ fontSize: 16 }}>暂无兑换记录</p>
          <p style={{ fontSize: 13 }}>使用上方输入框为用户生成兑换码</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="str-table">
            <thead><tr><th>激活码</th><th>用户邮箱</th><th>额度</th><th>兑换时间</th><th>备注</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td className="str-td-mono" style={{ fontWeight: 600 }}>{r.code}</td>
                  <td>{r.email}</td>
                  <td className="str-td-mono" style={{ color: "#10b981" }}>+{r.credits}</td>
                  <td className="str-td-hint">{r.redeemedAt ? new Date(r.redeemedAt).toLocaleString("zh-CN") : "—"}</td>
                  <td className="str-td-hint" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{r.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
