// components/PropertyChat.tsx — AI Assistant Chat (slidebar/fullscreen, collapsible, avatar, compliance)
"use client";

import { useState, useRef, useEffect } from "react";

interface Indicator { key: string; label: string; value: string; }
interface PropertyContext {
  projectName: string; city: string; district: string; propertyType: string;
  faceRent: number; indicators: Indicator[];
}
interface Msg { role: "user" | "assistant"; content: string; }

// Convert **bold** to real <b> tags
function renderContent(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <b key={i}>{part.slice(2, -2)}</b>;
    }
    return part;
  });
}

export default function PropertyChat({ property, email, onClose }: { property: PropertyContext; email?: string; onClose: () => void }) {
  const [chatQuota, setChatQuota] = useState<{ total: number; used: number }>({ total: 0, used: 0 });
  const [messages, setMessages] = useState<Msg[]>([{
    role: "assistant",
    content: `嗨！我是 **${property.projectName}** 的 AI 分析师 👋

这个项目位于 ${property.city}·${property.district}，是 ${property.propertyType} 业态，挂牌面价 **¥${property.faceRent}/㎡/天**。

有什么想了解的尽管问我，我会结合市场数据和专业知识帮你分析。`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  // Track chat usage in localStorage per asset
  const getUsage = () => {
    try {
      const raw = localStorage.getItem("pricecre_chat_usage");
      const map = raw ? JSON.parse(raw) : {};
      return (map[property.projectName] || { free: 0, tokens: 0 });
    } catch { return { free: 0, tokens: 0 }; }
  };
  const [freeUsed, setFreeUsed] = useState(() => getUsage().free);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    const e = email || (typeof window !== "undefined" ? (() => { try { return JSON.parse(localStorage.getItem("pricecre_user") || "{}")?.email; } catch { return ""; } })() : "");
    if (!e) return;
    fetch(`/api/ai/chat-quota?email=${encodeURIComponent(e)}`).then(r => r.json()).then(d => {
      setChatQuota({ total: d.tokens || 0, used: d.totalUsed || 0 });
    }).catch(() => {});
  }, [email]);

  const scrollBottom = () => {
    const el = scrollRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  };

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    // Local quota check
    const usage = getUsage();
    const user = (() => { try { return JSON.parse(localStorage.getItem("pricecre_user") || "null"); } catch { return null; } })();
    const email = user?.email || "anonymous";

    // Check server quota
    let allowed = true;
    let source = "free";
    try {
      const check = await fetch("/api/ai/chat-quota", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, assetId: property.projectName }),
      });
      const c = await check.json();
      if (c.outOfQuota) {
        setMessages(prev => [...prev, { role: "assistant" as const, content: c.message || "免费对话次数已用完，请购买AI对话包 ¥10/100条。" }]);
        return;
      }
      source = c.source || "free";
    } catch {
      // Fallback: local check only
      if (usage.free >= 10) {
        setMessages(prev => [...prev, { role: "assistant" as const, content: "额度不足，请购买AI对话包。" }]);
        return;
      }
    }

    // Update local usage
    const newUsage = { ...usage, free: Math.min(usage.free + 1, 10) };
    try {
      const raw = localStorage.getItem("pricecre_chat_usage");
      const map = raw ? JSON.parse(raw) : {};
      map[property.projectName] = newUsage;
      localStorage.setItem("pricecre_chat_usage", JSON.stringify(map));
      setFreeUsed(newUsage.free);
    } catch {}

    const withUser: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(withUser);
    setInput("");
    setLoading(true);
    setCollapsed(false);
    scrollBottom();
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: withUser, property, email }),
      });
      const d = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: d.content || "无响应" }]);
    } catch { setMessages(prev => [...prev, { role: "assistant", content: "网络异常，请稍后重试。" }]); }
    setLoading(false);
    scrollBottom();
  };

  const handleClose = () => {
    if (isMobile) { setConfirmClose(true); return; }
    onClose();
  };

  // Shared message list
  const messageList = (
    <>
      {messages.map((m, i) => (
        <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", display: "flex", flexDirection: "column" }}>
          <div style={{
            padding: "10px 14px", borderRadius: 12,
            background: m.role === "user" ? "#171717" : "#F7F7F7",
            color: m.role === "user" ? "#FFFFFF" : "#171717",
            fontSize: 13.5, lineHeight: 1.65, fontFamily: "var(--font-sans)",
            letterSpacing: "-0.01em", whiteSpace: "pre-wrap",
            borderBottomRightRadius: m.role === "user" ? 4 : 12,
            borderBottomLeftRadius: m.role === "assistant" ? 4 : 12,
          }}>
            {m.role === "assistant" ? renderContent(m.content) : m.content}
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 3, paddingLeft: m.role === "assistant" ? 4 : 0, paddingRight: m.role === "user" ? 4 : 0, justifyContent: m.role === "assistant" ? "flex-start" : "flex-end" }}>
            <button onClick={() => { navigator.clipboard.writeText(m.content.replace(/<[^>]*>/g, ""));
              const el = document.getElementById(`cp-msg-${i}`); if (el) { el.textContent = "已复制"; setTimeout(() => { if (el) el.textContent = "复制"; }, 1500); } }}
              id={`cp-msg-${i}`} style={{ fontSize: 10, color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontFamily: "var(--font-sans)" }}>复制</button>
            <button onClick={() => {
              const text = m.content.replace(/<[^>]*>/g, "");
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `ai-chat-${Date.now()}.txt`;
              document.body.appendChild(a); a.click(); document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }} style={{ fontSize: 10, color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", padding: "0 4px", fontFamily: "var(--font-sans)" }}>下载</button>
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ alignSelf: "flex-start", display: "flex", gap: 4, padding: "8px 14px" }}>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#A3A3A3", animation: "vl-d 1s ease-in-out infinite" }} />
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#A3A3A3", animation: "vl-d 1s ease-in-out 0.2s infinite" }} />
          <span style={{ width: 6, height: 6, borderRadius: 3, background: "#A3A3A3", animation: "vl-d 1s ease-in-out 0.4s infinite" }} />
        </div>
      )}
    </>
  );

  // ============ DESKTOP ============
  if (!isMobile) {
    return (
      <>
        {/* Floating toggle button — visible when collapsed */}
        {collapsed && (
          <button onClick={() => setCollapsed(false)}
            style={{
              position: "fixed", right: 16, bottom: 80, zIndex: 9999,
              width: 48, height: 48, borderRadius: "50%",
              background: "linear-gradient(135deg, #ff6ec7 0%, #7b2fff 50%, #00d4ff 100%)",
              color: "#FFFFFF", border: "none",
              boxShadow: "0 0 20px rgba(123,47,255,0.4), 0 4px 16px rgba(0,0,0,0.2)",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "vl-pop 0.3s ease",
            }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}

        {/* Slidebar from right */}
        {!collapsed && (
          <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", justifyContent: "flex-end" }}>
            <div onClick={() => setCollapsed(true)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
            <div style={{ position: "relative", width: 440, maxWidth: "90vw", height: "100%", background: "#FFFFFF", borderLeft: "1px solid #E5E5E5", boxShadow: "-2px 0 24px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", animation: "vl-slide-r 0.25s ease" }}>
              {/* Header with avatar */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E5E5", display: "flex", alignItems: "center", gap: 10, background: "#FAFAFA", flexShrink: 0 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #1a73e8 0%, #4285f4 25%, #7baaf7 50%, #a1c4fd 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(26,115,232,0.3)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3" fill="#FFFFFF" fillOpacity="0.3"/>
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                    <path d="M12 6a6 6 0 016 6" strokeDasharray="2 2"/>
                    <circle cx="12" cy="12" r="1" fill="#FFFFFF"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", letterSpacing: "-0.02em" }}>AI 分析师</div>
                  <div style={{ fontSize: 11, color: "#737373", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.projectName}</div>
                </div>
                <button onClick={() => setCollapsed(true)} title="收起" style={{ width: 32, height: 32, border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#737373", fontSize: 14, lineHeight: "32px" }}>─</button>
                <button onClick={handleClose} title="关闭" style={{ width: 32, height: 32, border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#737373", fontSize: 18, lineHeight: "32px" }}>✕</button>
              </div>

              {/* Messages */}
              <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>{messageList}</div>

              {/* Compliance */}
              <div style={{ padding: "4px 16px", fontSize: 10, color: "#A3A3A3", textAlign: "center", fontFamily: "var(--font-sans)", borderTop: "1px solid #F7F7F7", flexShrink: 0 }}>
                AI 分析师基于大模型生成，内容仅供参考，不构成投资建议
              </div>

              {/* Input */}
              <div style={{ padding: "8px 12px 16px", borderTop: "1px solid #E5E5E5", display: "flex", gap: 8, flexShrink: 0 }}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="输入你的问题..." disabled={loading} style={{ flex: 1, padding: "10px 14px", border: "1px solid #E5E5E5", borderRadius: 10, outline: "none", fontSize: 13.5, fontFamily: "var(--font-sans)", background: loading ? "#F7F7F7" : "#FAFAFA" }} />
                <button onClick={send} disabled={loading || !input.trim()} style={{ width: 42, height: 42, borderRadius: 10, border: "none", background: input.trim() && !loading ? "#171717" : "#E5E5E5", cursor: input.trim() && !loading ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </button>
              </div>
            </div>
            <style>{`@keyframes vl-slide-r{from{transform:translateX(100%)}to{transform:translateX(0)}}@keyframes vl-d{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}@keyframes vl-pop{0%{transform:scale(0)}60%{transform:scale(1.1)}to{transform:scale(1)}}`}</style>
          </div>
        )}
      </>
    );
  }

  // ============ MOBILE ============
  return (
    <>
    {collapsed ? (
      /* Collapsed floating button on mobile */
      <button onClick={() => setCollapsed(false)}
        style={{
          position: "fixed", right: 16, bottom: 120, zIndex: 9999,
          width: 48, height: 48, borderRadius: "50%",
          background: "linear-gradient(135deg, #ff6ec7 0%, #7b2fff 50%, #00d4ff 100%)",
          color: "#FFFFFF", border: "none",
          boxShadow: "0 0 20px rgba(123,47,255,0.4), 0 4px 16px rgba(0,0,0,0.2)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "vl-pop 0.3s ease",
        }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    ) : (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "#FFFFFF", display: "flex", flexDirection: "column" }}>
      {/* Header with avatar */}
      <div style={{ padding: "10px 14px", borderBottom: "1px solid #E5E5E5", display: "flex", alignItems: "center", gap: 10, background: "#FAFAFA", paddingTop: "max(10px, env(safe-area-inset-top))", flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #1a73e8 0%, #4285f4 25%, #7baaf7 50%, #a1c4fd 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", flexShrink: 0, boxShadow: "0 2px 8px rgba(26,115,232,0.3)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" fill="#FFFFFF" fillOpacity="0.3"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            <path d="M12 6a6 6 0 016 6" strokeDasharray="2 2"/>
            <circle cx="12" cy="12" r="1" fill="#FFFFFF"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>AI 分析师</div>
          <div style={{ fontSize: 11, color: "#737373", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{property.projectName}</div>
        </div>
        <button onClick={() => { setCollapsed(true); }} title="收起" style={{ width: 32, height: 32, border: "none", borderRadius: 6, background: "#F7F7F7", cursor: "pointer", color: "#171717" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </button>
        <button onClick={handleClose} title="关闭" style={{ width: 32, height: 32, border: "none", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#171717" }}>✕</button>
      </div>

      {/* Quota Bar — always visible */}
      <div style={{ padding: "6px 14px", background: "rgba(37,99,235,0.04)", borderBottom: "1px solid #E5E5E5", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        <span style={{ color: "#737373" }}>AI对话额度</span>
        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#2563EB" }}>{chatQuota.total > 0 ? `${chatQuota.used}/${chatQuota.total}` : "加载中..."}</span>
        <div style={{ flex: 1, height: 4, background: "#F0F0F0", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${chatQuota.total > 0 ? Math.min(100, (chatQuota.used / chatQuota.total) * 100) : 0}%`, height: "100%", background: chatQuota.used >= chatQuota.total && chatQuota.total > 0 ? "#EF4444" : "#2563EB", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
          <span style={{ fontSize: 10, color: "#A3A3A3" }}>剩余 {chatQuota.total - chatQuota.used}</span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflow: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>{messageList}</div>

      {/* Compliance */}
      <div style={{ padding: "4px 16px", fontSize: 10, color: "#A3A3A3", textAlign: "center", fontFamily: "var(--font-sans)", borderTop: "1px solid #F7F7F7", flexShrink: 0 }}>
        AI 分析师基于大模型生成，内容仅供参考，不构成投资建议
      </div>

      {/* Quota Bar + Purchase — always visible */}
      <div style={{ padding: "8px 16px", borderTop: "1px solid #E5E5E5", display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: "#FAFAFA" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: "#737373", fontFamily: "var(--font-sans)" }}>AI对话额度</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 600, color: "#2563EB" }}>{chatQuota.total > 0 ? `${chatQuota.used}/${chatQuota.total}` : "加载中..."}</span>
          </div>
          <div style={{ height: 4, background: "#E5E5E5", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${chatQuota.total > 0 ? Math.min(100, (chatQuota.used / chatQuota.total) * 100) : 0}%`, height: "100%", background: chatQuota.used >= chatQuota.total && chatQuota.total > 0 ? "#EF4444" : "#2563EB", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
        </div>
        <button onClick={() => document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "profile" }))}
          style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #2563EB", background: "#FFF", color: "#2563EB", fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-sans)" }}>
          购买AI对话额度
        </button>
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px 14px", borderTop: "1px solid #E5E5E5", display: "flex", gap: 8, paddingBottom: "max(14px, env(safe-area-inset-bottom))", flexShrink: 0 }}>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="输入你的问题..." disabled={loading} style={{ flex: 1, padding: "10px 14px", border: "1px solid #E5E5E5", borderRadius: 10, outline: "none", fontSize: 14, fontFamily: "var(--font-sans)", background: loading ? "#F7F7F7" : "#FAFAFA" }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ width: 42, height: 42, borderRadius: 10, border: "none", background: input.trim() && !loading ? "#171717" : "#E5E5E5", cursor: input.trim() && !loading ? "pointer" : "default", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        </button>
      </div>

      <style>{`@keyframes vl-d{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:1;transform:scale(1.3)}}`}</style>

      {/* Confirm close */}
      {confirmClose && (
        <div style={{ position: "fixed", inset: 0, zIndex: 11000, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmClose(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#FFFFFF", borderRadius: 12, padding: "24px 20px", width: 280, textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 8px" }}>关闭对话</p>
            <p style={{ fontSize: 13, color: "#737373", fontFamily: "var(--font-sans)", margin: "0 0 20px" }}>确定要结束与 AI 分析师的对话吗？</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmClose(false)} style={{ flex: 1, padding: "10px", border: "1px solid #E5E5E5", borderRadius: 8, background: "#FFFFFF", fontSize: 14, fontWeight: 500, color: "#737373", cursor: "pointer", fontFamily: "var(--font-sans)" }}>继续对话</button>
              <button onClick={onClose} style={{ flex: 1, padding: "10px", border: "none", borderRadius: 8, background: "#E91E63", color: "#FFFFFF", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}>确认关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
    )}
  </>);
}
