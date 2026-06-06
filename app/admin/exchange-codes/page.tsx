// app/admin/exchange-codes/page.tsx — Admin: Generate exchange codes
"use client";

import { useState } from "react";

const PRODUCTS = [
  { id: "single", name: "查看权益×50次", credits: 50, type: "view" },
  { id: "monthly", name: "不限次包月", credits: 999, type: "subscription" },
  { id: "ai-chat-100", name: "AI对话×100条", credits: 100, type: "chat" },
];

export default function ExchangeCodesPage() {
  const [product, setProduct] = useState("single");
  const [count, setCount] = useState(1);
  const [codes, setCodes] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const generateCodes = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, count }),
      });
      const data = await res.json();
      if (data.codes) setCodes(data.codes);
    } catch {}
    setGenerating(false);
  };

  return (
    <div style={{ maxWidth: 800, padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, color: "#171717", marginBottom: 20 }}>生成兑换码</h2>

      <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "#404040", whiteSpace: "nowrap" }}>商品类型</label>
          <select value={product} onChange={e => setProduct(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E5E5E5", fontSize: 13, flex: 1 }}>
            {PRODUCTS.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
            ))}
          </select>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: "#404040", whiteSpace: "nowrap" }}>生成数量</label>
          <input type="number" min={1} max={100} value={count} onChange={e => setCount(parseInt(e.target.value) || 1)}
            style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #E5E5E5", fontSize: 13, width: 100 }} />
        </div>
        <button onClick={generateCodes} disabled={generating}
          style={{ padding: "10px 24px", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: generating ? "default" : "pointer", opacity: generating ? 0.6 : 1 }}>
          {generating ? "生成中..." : `生成 ${count} 个兑换码`}
        </button>
      </div>

      {codes.length > 0 && (
        <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#171717", margin: 0 }}>
              已生成 {codes.length} 个兑换码 — {PRODUCTS.find(p=>p.id===product)?.name}
            </h3>
            <button onClick={() => {
              navigator.clipboard.writeText(codes.join("\n"));
            }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", fontSize: 12, cursor: "pointer" }}>
              复制全部
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8, maxHeight: 400, overflow: "auto" }}>
            {codes.map((code, i) => (
              <div key={i} onClick={() => { navigator.clipboard.writeText(code); }}
                style={{ padding: "10px 14px", background: "#F7F7F7", borderRadius: 6, border: "1px solid #E5E5E5", fontFamily: "var(--font-mono)", fontSize: 16, textAlign: "center", cursor: "pointer", letterSpacing: "0.15em", userSelect: "all" }}>
                {code}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
