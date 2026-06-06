"use client";

import { useState } from "react";

interface CreditPanelProps {
  credits: { shared: number; referral: number; purchased: number };
  chatTokens: { total: number; used: number };
  creditStats: { viewCount: number; unlockCount: number; conversations: number };
  onClose: () => void;
}

// Vercel Design System token sizes:
// 14px/600 title, 14px/400 body, 12px/500 label, 12px/400 caption, 11px/500 badge
// Numbers: Geist Mono fw:300 lean, tabular-nums, -0.03em

const numStyle = { fontFamily: "var(--font-mono)", fontWeight: 300, letterSpacing: "-0.03em" } as const;
const labelStyle = { fontSize: 12, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" } as const;
const captionStyle = { fontSize: 12, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" } as const;
const titleStyle = { fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" } as const;
const badgeStyle = { fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)" } as const;

export default function CreditPanel({ credits, chatTokens, creditStats, onClose }: CreditPanelProps) {
  const total = credits.shared + credits.referral + credits.purchased;
  const isExhausted = total === 0;
  const isLow = total <= 3 && total > 0;
  const [showEye, setShowEye] = useState(false);
  const remainingChat = Math.max(0, chatTokens.total - chatTokens.used);

  const poolNum = (v: number) => (
    <span style={{ ...numStyle, fontSize: 18, color: v > 0 ? "#0070F3" : "#A3A3A3" }}>{v}</span>
  );

  return (
    <div className="rounded-xl border shadow-lg p-0 overflow-hidden" style={{ width: 320, background: "#FFFFFF", borderColor: "#E5E5E5" }}>
      {/* Warning Banner */}
      {isExhausted && (
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "rgba(238,0,0,0.04)" }}>
          <span style={{ ...badgeStyle, padding: "2px 6px", borderRadius: 4, background: "rgba(238,0,0,0.08)", color: "#EE0000" }}>额度超限</span>
          <span style={{ ...badgeStyle, color: "#EE0000" }}>额度已用完</span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3" style={{ background: "#FAFAFA" }}>
        <button className="flex-shrink-0 cursor-pointer" onClick={() => setShowEye(!showEye)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </button>
        <div>
          <div style={titleStyle}>
            {isExhausted ? "额度已用完" : isLow ? "额度即将耗尽" : "额度已激活"}
          </div>
          <div style={captionStyle}>
            {isExhausted ? "请购买或邀请好友获取额度" : isLow ? `剩余 ${total} 次 · 建议补充` : `可用额度 ${total} 次`}
          </div>
        </div>
        <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-[#F7F7F7]" style={{ color: "#737373" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        </button>
      </div>

      {/* ── 额度池（上） ── */}
      <div className="px-5 pt-4 pb-0">
        <div style={{ ...badgeStyle, color: "#737373", marginBottom: 6 }}>额度池</div>
      </div>
      <div className="px-5 pb-2" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { label: "互享额度", sub: "注册 / 活动赠送", value: credits.shared, icon: "gift" },
          { label: "邀约额度", sub: "邀请好友获取", value: credits.referral, icon: "share" },
          { label: "付费额度", sub: "直接购买 · ¥99/50次", value: credits.purchased, icon: "cart" },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between py-2 px-0" style={{ borderBottom: "1px solid #F7F7F7" }}>
            <div>
              <div style={labelStyle}>{item.label}</div>
              <div style={captionStyle}>{item.sub}</div>
            </div>
            {poolNum(item.value)}
          </div>
        ))}
      </div>

      {/* ── 可用额度（下） ── */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between p-3 rounded-lg mt-2" style={{ background: isExhausted ? "rgba(238,0,0,0.04)" : "rgba(0,112,243,0.06)" }}>
          <span style={{ ...labelStyle, color: "#171717", fontWeight: 600 }}>可用额度</span>
          <span style={{ ...numStyle, fontSize: 20, color: isExhausted ? "#EE0000" : "#0070F3" }}>{total}</span>
        </div>
      </div>

      {/* ── 确权数据 ── */}
      <div className="px-5 py-3 border-t grid grid-cols-2 gap-x-4 gap-y-3" style={{ borderColor: "#E5E5E5" }}>
        {[
          { label: "查看权益", value: credits.referral + credits.purchased, sub: "次" },
          { label: "AI 对话额度", value: remainingChat, sub: "条剩余" },
          { label: "解锁卡片", value: creditStats.unlockCount, sub: "张" },
          { label: "AI 对话次数", value: creditStats.conversations, sub: "次已用" },
        ].map((s) => (
          <div key={s.label} className="text-center py-1.5 rounded-lg" style={{ background: "#FAFAFA" }}>
            <div style={{ ...numStyle, fontSize: 18, color: "#171717" }}>{s.value}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>{s.label} <span style={{ color: "#A3A3A3" }}>{s.sub}</span></div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div className="px-5 py-3 border-t flex gap-2" style={{ borderColor: "#E5E5E5" }}>
        <button className="btn-primary flex-1" style={{ fontSize: 13, padding: "6px 0" }}
          onClick={() => { document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "share" })); onClose?.(); }}>
          提交交易
        </button>
        <button className="btn-secondary flex-1" style={{ fontSize: 13, padding: "6px 0" }}
          onClick={() => { document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "profile" })); onClose?.(); }}>
          购买额度
        </button>
      </div>
    </div>
  );
}
