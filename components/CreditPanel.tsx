"use client";

import { useState } from "react";

interface CreditPanelProps {
  credits: { referral: number; purchased: number };
  onClose: () => void;
}

// Vercel Design System font tokens:
// 14px/400 body, 14px/600 card-title, 12px/500 label, 12px/400 caption, 11px/500 badge
// Numbers: Geist Mono, weight 300 (细线体), tabular-nums, -0.03em

export default function CreditPanel({ credits, onClose }: CreditPanelProps) {
  const total = credits.referral + credits.purchased;
  const isExhausted = total === 0;
  const isLow = total <= 3 && total > 0;
  const [showEye, setShowEye] = useState(false);

  const numStyle = { fontFamily: "var(--font-mono)", fontWeight: 300, letterSpacing: "-0.03em" } as const;
  const labelStyle = { fontSize: 12, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" } as const;
  const captionStyle = { fontSize: 12, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" } as const;
  const bodyStyle = { fontSize: 14, fontWeight: 400, color: "#404040", fontFamily: "var(--font-sans)" } as const;
  const titleStyle = { fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" } as const;
  const badgeStyle = { fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)" } as const;

  return (
    <div className="rounded-xl border shadow-lg p-0 overflow-hidden" style={{ width: 320, background: "#FFFFFF", borderColor: "#E5E5E5" }}>
      {/* Warning Banner (when exhausted) */}
      {isExhausted && (
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(238,0,0,0.04)" }}>
          <span style={{ ...badgeStyle, padding: "2px 6px", borderRadius: 4, background: "rgba(238,0,0,0.08)", color: "#EE0000" }}>
            额度超限
          </span>
          <span style={{ ...badgeStyle, color: "#EE0000" }}>额度已用完</span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3" style={{ background: "#FAFAFA" }}>
        <button
          className="flex-shrink-0 cursor-pointer transition-all"
          onClick={() => setShowEye(!showEye)}
          aria-label={showEye ? "隐藏额度" : "显示额度"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </button>
        <div>
          <div style={titleStyle}>
            {isExhausted ? "额度已用完" : isLow ? "额度即将耗尽" : showEye ? (
              <span className="inline-flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                额度已激活
              </span>
            ) : "额度已激活"}
          </div>
          <div style={captionStyle}>
            {isExhausted
              ? "邀约与付费额度均已用完"
              : isLow
              ? `剩余 ${total} 次确权额度 · 建议补充`
              : `可用额度：${total} 次`}
          </div>
        </div>
        <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-[#F7F7F7] transition-colors" style={{ color: "#737373" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        </button>
      </div>

      {/* Pools */}
      <div className="px-5 py-4" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#FAFAFA" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,112,243,0.06)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <div>
              <div style={labelStyle}>邀约额度</div>
              <div style={captionStyle}>分享链接获取</div>
            </div>
          </div>
          <span style={{ ...numStyle, fontSize: 18, color: credits.referral > 0 ? "#0070F3" : "#A3A3A3" }}>{credits.referral}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#FAFAFA" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,112,243,0.06)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <div style={labelStyle}>付费池</div>
              <div style={captionStyle}>直接购买 · ¥99/50次</div>
            </div>
          </div>
          <span style={{ ...numStyle, fontSize: 18, color: credits.purchased > 0 ? "#0070F3" : "#A3A3A3" }}>{credits.purchased}</span>
        </div>
      </div>

      {/* Total */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: isExhausted ? "rgba(238,0,0,0.04)" : "rgba(0,112,243,0.06)" }}>
          <span style={labelStyle}>可用额度</span>
          <span style={{ ...numStyle, fontSize: 18, color: isExhausted ? "#EE0000" : "#0070F3" }}>{total}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 border-t grid grid-cols-3 gap-2" style={{ borderColor: "#E5E5E5" }}>
        {[{ label: "累计提报", value: 0 }, { label: "累计购买", value: 0 }, { label: "已确权", value: 0 }].map((s) => (
          <div key={s.label} className="text-center">
            <div style={{ ...numStyle, fontSize: 18, color: "#171717" }}>{s.value}</div>
            <div style={badgeStyle} className="text-[#737373]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 py-3 border-t flex gap-2" style={{ borderColor: "#E5E5E5" }}>
        <button
          className="btn-primary flex-1"
          style={{ fontSize: 13, padding: "6px 0" }}
          onClick={() => { document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "share" })); onClose?.(); }}
        >
          提交真实交易
        </button>
        <button
          className="btn-secondary flex-1"
          style={{ fontSize: 13, padding: "6px 0" }}
          onClick={() => { document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "profile" })); onClose?.(); }}
        >
          购买额度
        </button>
      </div>
    </div>
  );
}
