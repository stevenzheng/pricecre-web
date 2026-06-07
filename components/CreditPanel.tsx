"use client";

import { useState } from "react";

interface CreditPanelProps {
  credits: { shared: number; referral: number; purchased: number };
  chatTokens: { total: number; used: number };
  creditStats: { viewCount: number; unlockCount: number; conversations: number };
  userEmail?: string | null;
  onClose?: () => void;
}

// Vercel Design System: 14/12/11 sizing, Geist Mono fw:300 numbers, -0.03em
const monoSm = { fontFamily: "var(--font-mono)", fontWeight: 300, letterSpacing: "-0.03em" } as const;
const monoLg = { fontFamily: "var(--font-mono)", fontWeight: 300, letterSpacing: "-0.04em" } as const;
const labelSm = { fontSize: 12, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" } as const;
const capSm = { fontSize: 12, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" } as const;
const title = { fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" } as const;
const badge = { fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)" } as const;

// Section icon component
const Icon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const s = { width: size, height: size, flexShrink: 0 } as const;
  switch (type) {
    case "credit": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
    case "gift": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.5"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></svg>;
    case "share": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
    case "cart": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>;
    case "eye": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#A3A3A3" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
    case "check": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
    case "unlock": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>;
    case "chat": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>;
    case "alert": return <svg {...s} viewBox="0 0 24 24" fill="none" stroke="#EE0000" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
    default: return null;
  }
};

export default function CreditPanel({ credits, chatTokens, creditStats, userEmail, onClose }: CreditPanelProps) {
  const total = credits.shared + credits.referral + credits.purchased;
  const isExhausted = total === 0;
  const isLoggedIn = !!userEmail;
  const isLow = total <= 3 && total > 0;
  const remainingChat = Math.max(0, chatTokens.total - chatTokens.used);

  const poolNum = (v: number, active: boolean) => (
    <span style={{ ...monoSm, fontSize: 17, color: active ? "#0070F3" : "#A3A3A3" }}>{v}</span>
  );

  return (
    <div className="rounded-xl border" style={{ width: onClose ? 320 : "100%", maxWidth: 360, background: "#FFFFFF", borderColor: "#E5E5E5", boxShadow: onClose ? "0 4px 24px rgba(0,0,0,0.08)" : "none" }}>
      {/* ── Status Bar ── */}
      <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, background: isExhausted ? "rgba(238,0,0,0.03)" : isLow ? "rgba(245,166,35,0.05)" : "rgba(0,112,243,0.03)", borderRadius: "12px 12px 0 0" }}>
        <Icon type={isExhausted ? "alert" : isLow ? "alert" : "check"} size={12} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>
          {!isLoggedIn ? "请先登录" : isExhausted ? "额度已用完" : isLow ? `剩余 ${total} 次 · 即将耗尽` : `可用 ${total} 次额度`}
          {isExhausted && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: "#A3A3A3" }}>请购买或邀请好友获取</span>}
        </span>
        {onClose && (
          <button onClick={onClose} style={{ padding: 2, background: "none", border: "none", cursor: "pointer", color: "#A3A3A3" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
          </button>
        )}
      </div>

      {/* ── 额度来源 ── */}
      <div style={{ padding: "10px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <Icon type="credit" size={11} /> 额度来源
        </div>
        {[
          { label: "提报真实成交", sub: "提报交易 · 确认后兑换", value: credits.shared, icon: "gift" as const, color: "#0D9488", bg: "rgba(13,148,136,0.04)", action: "share" },
          { label: "邀请好友注册", sub: "邀请可获得10次查看额度", value: credits.referral, icon: "share" as const, color: "#2563EB", bg: "rgba(37,99,235,0.04)", action: "share" },
          { label: "购买查看次数", sub: "直接购买 · ¥99/50次", value: credits.purchased, icon: "cart" as const, color: "#7C3AED", bg: "rgba(124,58,237,0.04)", action: "profile" },
        ].map((item) => (
          <button key={item.label}
            onClick={() => {
              document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: item.action }));
              setTimeout(() => onClose?.(), 50);
            }}
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", margin: "4px 0", borderRadius: 6, width: "100%", cursor: "pointer", background: item.bg, border: "none", borderLeft: `3px solid ${item.color}`, textAlign: "left" }}>
            <Icon type={item.icon} size={16} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>{item.label}</span>
            <span style={{ fontSize: 10, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>{item.sub}</span>
            {poolNum(item.value, item.value > 0)}
          </button>
        ))}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 6, background: isExhausted ? "rgba(238,0,0,0.04)" : "#F7F7F7", border: "1px solid #E5E5E5", marginTop: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isExhausted ? "#EE0000" : "#0070F3"} strokeWidth="1.5"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            可用额度
          </span>
          <span style={{ ...monoLg, fontSize: 17, color: isExhausted ? "#EE0000" : "#0070F3" }}>{total}</span>
        </div>
      </div>

      {/* ── AI 对话 ── */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #F0F0F0" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <Icon type="chat" size={11} /> AI 对话
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: 6, background: "rgba(37,99,235,0.04)", borderLeft: "3px solid #2563EB" }}>
          <Icon type="chat" size={16} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>对话额度</span>
          <span style={{ fontSize: 10, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>剩余 {remainingChat}/{chatTokens.total} 条</span>
          <span style={{ ...monoSm, fontSize: 17, color: remainingChat > 0 ? "#2563EB" : "#EE0000" }}>{remainingChat}</span>
        </div>
      </div>

      {/* ── 数据概览 ── */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #F0F0F0" }}>
        <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
          <Icon type="eye" size={11} /> 数据概览
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { label: "资产查看权益", value: credits.referral + credits.purchased, sub: "次", icon: "unlock" as const },
            { label: "已解锁资产", value: creditStats.unlockCount, sub: "张", icon: "check" as const },
            { label: "AI对话次数", value: chatTokens.used, sub: "次", icon: "chat" as const },
            { label: "AI分析报告", value: creditStats.conversations, sub: "份", icon: "eye" as const },
          ].map((s) => (
            <div key={s.label}
              onClick={s.label === "AI分析报告" ? () => document.dispatchEvent(new CustomEvent("credit-panel-action", { detail: "ai-reports" })) : s.label === "已解锁资产" ? () => document.dispatchEvent(new CustomEvent("credit-panel-action", { detail: "unlocked-assets" })) : undefined}
              style={{ padding: "8px 10px", borderRadius: 6, background: "#FAFAFA", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: (s.label === "AI分析报告" || s.label === "已解锁资产") ? "pointer" : "default" }}>
              <Icon type={s.icon} size={12} />
              <div style={{ ...monoLg, fontSize: 15, color: "#171717" }}>{s.value}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── 快捷操作 ── */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid #E5E5E5" }}>
        {[
          { label: "查看订单", icon: "cart", color: "#7C3AED", action: "orders" },
          { label: "对话记录", icon: "chat", color: "#2563EB", action: "chats" },
        ].map((btn) => (
          <button key={btn.label} onClick={() => { document.dispatchEvent(new CustomEvent("credit-panel-action", { detail: btn.action })); onClose?.(); }}
            style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", color: btn.color, fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <Icon type={btn.icon} size={12} /> {btn.label}
          </button>
        ))}
      </div>
    </div>
  );
}
