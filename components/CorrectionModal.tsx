"use client";

import { useState } from "react";

interface CorrectionModalProps {
  propertyId: string;
  fieldKey: string;
  fieldLabel: string;
  currentValue: string;
  unit?: string;
  email?: string;
  onClose: () => void;
  onSubmit: () => void;
}

export default function CorrectionModal({
  propertyId, fieldKey, fieldLabel, currentValue, unit, email, onClose, onSubmit,
}: CorrectionModalProps) {
  const [newValue, setNewValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    if (!newValue.trim()) { setMsg("请输入新估值"); return; }
    setSubmitting(true); setMsg("");
    try {
      const res = await fetch("/api/data/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, fieldKey, fieldLabel, newValue, reason, email }),
      });
      const d = await res.json();
      if (d.success) {
        setMsg("纠错已提交，管理员审核通过后将奖励额度");
        setTimeout(() => { onSubmit(); onClose(); }, 1200);
      } else { setMsg(d.error || "提交失败"); }
    } catch { setMsg("网络错误"); }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative max-w-sm w-[90vw] rounded-2xl p-6 shadow-2xl animate-slide-up" style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-strong)", fontFamily: "var(--font-sans)" }}>纠正字段</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--text-hint)", fontSize: 18 }}>×</button>
        </div>

        <div className="mb-3">
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)" }}>{fieldLabel}</span>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-strong)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
            当前值：{currentValue}{unit ? ` ${unit}` : ""}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", display: "block", marginBottom: 4 }}>新估值{unit ? ` (${unit})` : ""}</label>
          <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="输入修正值" autoFocus
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-mono)", outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text)" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-sans)", display: "block", marginBottom: 4 }}>纠错理由（选填）</label>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="如：近期成交数据表明..."
            style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box", background: "var(--bg-input)", color: "var(--text)" }} />
        </div>

        {msg && (
          <div style={{ marginBottom: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-sans)", background: msg.includes("已提交") ? "rgba(0,112,243,0.06)" : "rgba(238,0,0,0.06)", color: msg.includes("已提交") ? "#0070F3" : "#EE0000" }}>
            {msg}
          </div>
        )}

        <button onClick={handleSubmit} disabled={submitting}
          style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "var(--accent)", color: "var(--text-inverse)", fontSize: 14, fontWeight: 500, cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
          {submitting ? "提交中..." : "提交纠正"}
        </button>
      </div>
    </div>
  );
}
