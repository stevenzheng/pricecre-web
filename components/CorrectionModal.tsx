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

  const S = (s: React.CSSProperties) => s;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div
        style={{
          position: "relative", maxWidth: 380, width: "90vw",
          borderRadius: 16, padding: 24,
          background: "#FFFFFF", border: "1px solid #E5E5E5",
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          animation: "slideUp 0.2s ease-out",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>纠正字段</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 18, color: "#A3A3A3", padding: 0, lineHeight: 1 }}>×</button>
        </div>

        {/* Current value */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: "#737373", fontFamily: "var(--font-sans)" }}>{fieldLabel}</span>
          <div style={S({ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--font-mono)", marginTop: 2 })}>
            当前值：{currentValue}{unit ? ` ${unit}` : ""}
          </div>
        </div>

        {/* New value */}
        <div style={{ marginBottom: 10 }}>
          <label style={S({ fontSize: 11, color: "#737373", fontFamily: "var(--font-sans)", display: "block", marginBottom: 4 })}>
            新估值{unit ? ` (${unit})` : ""}
          </label>
          <input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            placeholder="输入修正值"
            autoFocus
            style={S({
              width: "100%", padding: "10px 12px", border: "1px solid #D4D4D4", borderRadius: 8,
              fontSize: 14, fontFamily: "var(--font-mono)", outline: "none",
              background: "#FAFAFA", color: "#171717", boxSizing: "border-box",
            })}
          />
        </div>

        {/* Reason */}
        <div style={{ marginBottom: 14 }}>
          <label style={S({ fontSize: 11, color: "#737373", fontFamily: "var(--font-sans)", display: "block", marginBottom: 4 })}>
            纠错理由（选填）
          </label>
          <input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="如：近期成交数据表明..."
            style={S({
              width: "100%", padding: "10px 12px", border: "1px solid #D4D4D4", borderRadius: 8,
              fontSize: 13, fontFamily: "var(--font-sans)", outline: "none",
              background: "#FAFAFA", color: "#171717", boxSizing: "border-box",
            })}
          />
        </div>

        {/* Message */}
        {msg && (
          <div style={S({
            marginBottom: 10, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontFamily: "var(--font-sans)",
            background: msg.includes("已提交") ? "rgba(0,112,243,0.06)" : "rgba(238,0,0,0.06)",
            color: msg.includes("已提交") ? "#0070F3" : "#EE0000",
          })}>
            {msg}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={S({
            width: "100%", padding: "12px 0", borderRadius: 8, border: "none",
            background: "#0070F3", color: "#FFFFFF", fontSize: 14, fontWeight: 500,
            cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1,
            fontFamily: "var(--font-sans)",
          })}
        >
          {submitting ? "提交中..." : "提交纠正"}
        </button>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
