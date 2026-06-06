"use client";

import { useState, useEffect } from "react";

type Step = "login" | "register" | "verify" | "done";

// ── Vercel Design System tokens ──
const title = { fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" } as const;
const label = { fontSize: 12, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" } as const;
const caption = { fontSize: 12, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" } as const;
const body = { fontSize: 14, fontWeight: 400, color: "#404040", fontFamily: "var(--font-sans)" } as const;
const badge = { fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)" } as const;
const mono = { fontFamily: "var(--font-mono)", fontWeight: 300, letterSpacing: "-0.03em" } as const;

export default function ProfilePanel({ credits, totalCredits, chatTokens, creditStats }: {
  credits?: { referral: number; purchased: number };
  totalCredits?: number;
  chatTokens?: { total: number; used: number };
  creditStats?: { viewCount: number; unlockCount: number; conversations: number };
}) {
  const [step, setStep] = useState<Step>("login");
  const [form, setForm] = useState({ email: "", password: "", confirm: "", code: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const [activated, setActivated] = useState(false);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem("pricecre_username") || "用户"; } catch { return "用户"; }
  });
  const [editingName, setEditingName] = useState(false);

  const saveUsername = (name: string) => {
    setUsername(name);
    try { localStorage.setItem("pricecre_username", name); } catch {}
    setEditingName(false);
  };

  // Redeem state
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [redeemMsg, setRedeemMsg] = useState("");

  const quota = credits ? credits.referral + credits.purchased : 0;
  const remainingChat = chatTokens ? Math.max(0, chatTokens.total - chatTokens.used) : 0;

  // Restore login
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pricecre_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.email) {
          setForm(p => ({ ...p, email: user.email }));
          setLoggedIn(true); setStep("done"); setActivated(true);
        }
      }
    } catch {}
  }, []);

  const handleRedeem = async () => {
    if (redeemCode.length !== 6) { setRedeemMsg("请输入6位激活码"); setRedeemStatus("error"); return; }
    setRedeemStatus("loading");
    let ue = "";
    try { const s = localStorage.getItem("pricecre_user"); if (s) ue = JSON.parse(s).email || ""; } catch {}
    try {
      const res = await fetch("/api/data/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: redeemCode, email: ue }) });
      const d = await res.json();
      if (d.success) { setRedeemMsg(`激活成功！${d.credits} 次查询权益已到账`); setRedeemStatus("success"); setRedeemCode(""); }
      else { setRedeemMsg(d.error || "激活失败"); setRedeemStatus("error"); }
    } catch { setRedeemMsg("网络错误"); setRedeemStatus("error"); }
  };

  // ── Login / Register ──
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "16px" }}>
        <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E5E5", padding: 24 }}>
          <h2 style={{ ...title, fontSize: 18, textAlign: "center", marginBottom: 16 }}>
            {step === "verify" ? "验证邮箱" : "登录 PriceCRE"}
          </h2>

          {step !== "verify" && (
            <div style={{ display: "flex", borderRadius: 8, background: "#F7F7F7", padding: 2, marginBottom: 16 }}>
              {["login","register"].map(s => (
                <button key={s} onClick={() => setStep(s as Step)}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", background: step === s ? "#FFF" : "transparent", color: step === s ? "#171717" : "#A3A3A3", fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: step === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none", fontFamily: "var(--font-sans)" }}>
                  {s === "login" ? "邮箱登录" : "注册新账户"}
                </button>
              ))}
            </div>
          )}

          {error && <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(238,0,0,0.06)", color: "#EE0000", fontSize: 12, fontWeight: 500, marginBottom: 12, fontFamily: "var(--font-sans)" }}>{error}</div>}

          {step === "verify" ? (
            <form onSubmit={async e => { e.preventDefault(); setLoading(true); try { const r = await fetch("/api/auth/verify", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email:form.email,code:form.code}) }); const d = await r.json(); if (d.success) { setToken(d.token); setLoggedIn(true); setStep("done"); if (d.referralCode) try { localStorage.setItem("pricecre_user", JSON.stringify({email:form.email,referralCode:d.referralCode,totalCredits:10,registeredAt:Date.now()})); } catch {} } else setError(d.error||"验证失败"); } catch { setError("网络错误"); } setLoading(false); }}>
              <p style={caption}>{devCode ? `验证码已发送至 ${form.email} (${devCode})` : `验证码已发送至 ${form.email}`}</p>
              <input type="text" placeholder="输入6位验证码" value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 18, textAlign: "center", letterSpacing: "0.3em", outline: "none", fontFamily: "var(--font-mono)", marginTop: 12 }} maxLength={6} />
              <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                {loading ? "验证中..." : "验证并登录"}
              </button>
            </form>
          ) : step === "register" ? (
            <form onSubmit={async e => { e.preventDefault(); setError(""); if (!form.email||!form.password) return; if (form.password.length<6){setError("密码至少6位");return;} if (form.password!==form.confirm){setError("两次密码不一致");return;} setLoading(true); try { const r = await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.email,password:form.password})}); const d=await r.json(); if(d.success){setDevCode(d.devCode||"");setStep("verify")} else setError(d.error||"发送失败"); } catch { setError("网络错误"); } setLoading(false); }}>
              <InputField label="账户邮箱" placeholder="your@email.com" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              <InputField label="设置密码" placeholder="至少6位" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <InputField label="确认密码" placeholder="再次输入" type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} />
              <button type="submit" disabled={loading} style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form onSubmit={e => { e.preventDefault(); if(!form.email||!form.password)return; try{const code="sz"+Math.random().toString(36).substring(2,8);localStorage.setItem("pricecre_user",JSON.stringify({email:form.email,referralCode:code,totalCredits:10,registeredAt:Date.now()}));localStorage.setItem("pricecre_username",form.email.split("@")[0]);}catch{}setLoggedIn(true);setStep("done");setActivated(true); }}>
              <InputField label="账户邮箱" placeholder="your@email.com" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              <InputField label="访问密码" placeholder="········" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} />
              <button type="submit" style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", WebkitAppearance: "none" as any }}>登录</button>
            </form>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E5E5E5" }} /><span style={{ ...badge, color: "#A3A3A3" }}>OR</span><div style={{ flex: 1, height: 1, background: "#E5E5E5" }} />
          </div>
          <button onClick={() => {
            const testEmail = "test@pricecre.com";
            try {
              localStorage.setItem("pricecre_user", JSON.stringify({
                email: testEmail,
                referralCode: "sztest1",
                totalCredits: 10,
                registeredAt: Date.now(),
              }));
              localStorage.setItem("pricecre_username", "测试用户");
            } catch {}
            setForm(p => ({ ...p, email: testEmail }));
            setLoggedIn(true); setStep("done"); setActivated(true);
          }} style={{ width: "100%", padding: "12px 0", borderRadius: 8, border: "1px solid #D4D4D4", background: "#FFF", color: "#07C160", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>微信登录（测试模式）</button>
        </div>
      </div>
    );
  }

  // ── Logged-in Desktop Layout ──
  return (
    <div style={{ padding: "16px", maxWidth: 740, margin: "0 auto" }}>
      {/* User header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
          {username?.charAt(0).toUpperCase() || form.email?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input
              autoFocus
              defaultValue={username}
              onBlur={e => saveUsername(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveUsername((e.target as HTMLInputElement).value); if (e.key === "Escape") setEditingName(false); }}
              style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", border: "1px solid #0070F3", borderRadius: 4, padding: "2px 6px", outline: "none", width: 120 }}
            />
          ) : (
            <div style={{ ...title, fontSize: 14, cursor: "pointer" }} onClick={() => setEditingName(true)} title="点击编辑昵称">
              {username} <span style={{ fontSize: 9, color: "#A3A3A3", marginLeft: 4 }}>✎</span>
            </div>
          )}
          <div style={{ ...caption, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{form.email}</div>
        </div>
        <button onClick={() => {
          localStorage.removeItem("pricecre_user");
          localStorage.removeItem("pricecre_username");
          localStorage.removeItem("pricecre_referralCode");
          document.dispatchEvent(new CustomEvent("user-logout"));
          setLoggedIn(false); setStep("login"); setForm({email:"",password:"",confirm:"",code:""});
        }} style={{ ...label, fontSize: 11, background: "none", border: "none", cursor: "pointer", color: "#A3A3A3" }}>
          退出登录
        </button>
      </div>

      {/* Desktop: 2-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* LEFT COL: Credit info + History */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Credit Pools */}
          <SectionCard icon="credit" title="额度来源">
            {[
              { label: "邀约额度", sub: "邀请好友获得", v: credits?.referral || 0, color: "#2563EB" },
              { label: "付费额度", sub: "直接购买", v: credits?.purchased || 0, color: "#7C3AED" },
            ].map(p => (
              <PoolRow key={p.label} label={p.label} sub={p.sub} value={p.v} color={p.color} />
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#F7F7F7", borderRadius: 6, marginTop: 4 }}>
              <span style={label}>可用额度</span>
              <span style={{ ...mono, fontSize: 18, color: quota > 0 ? "#0070F3" : "#EE0000" }}>{quota}</span>
            </div>
          </SectionCard>

          {/* AI Chat */}
          <SectionCard icon="chat" title="AI 对话">
            <PoolRow label="对话额度" sub={`剩余 ${remainingChat} / ${chatTokens?.total || 0} 条`} value={remainingChat} color="#2563EB" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 8 }}>
              <MiniStat label="已用" value={chatTokens?.used || 0} sub="条" />
              <MiniStat label="总对话" value={creditStats?.conversations || 0} sub="次" />
            </div>
          </SectionCard>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {[
              { label: "查看订单", action: "orders", icon: "cart" },
              { label: "已解锁资产", action: "assets", icon: "unlock" },
              { label: "对话记录", action: "chats", icon: "chat" },
              { label: "纠错提报", action: "correct", icon: "edit" },
            ].map(btn => (
              <button key={btn.label} onClick={() => document.dispatchEvent(new CustomEvent("credit-panel-action", { detail: btn.action }))}
                style={{ padding: "8px 0", borderRadius: 8, border: "1px solid #E5E5E5", background: "#FFF", color: "#404040", fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Redeem — compact */}
        <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: "10px 14px", marginTop: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <input value={redeemCode} onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemStatus("idle"); }}
              placeholder="激活兑换码" maxLength={6} onKeyDown={e => { if (e.key === "Enter") handleRedeem(); }}
              style={{ flex: 1, padding: "6px 10px", border: "1px solid #E5E5E5", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-mono)", outline: "none", letterSpacing: "0.1em" }} />
            <button onClick={handleRedeem} disabled={redeemStatus === "loading"}
              style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 12, fontWeight: 500, cursor: redeemStatus === "loading" ? "default" : "pointer", opacity: redeemStatus === "loading" ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
              {redeemStatus === "loading" ? "验证中" : "激活"}
            </button>
          </div>
          {redeemStatus !== "idle" && (
            <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", background: redeemStatus === "success" ? "rgba(0,112,243,0.06)" : "rgba(238,0,0,0.06)", color: redeemStatus === "success" ? "#0070F3" : "#EE0000" }}>
              {redeemMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helper Components ──

function InputField({ label: lbl, placeholder, type, value, onChange }: { label: string; placeholder: string; type: string; value: string; onChange: (e: any) => void }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4 }}>{lbl}</div>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" }} />
    </div>
  );
}

function SectionCard({ icon, title: t, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", overflow: "hidden" }}>
      <div style={{ padding: "10px 14px", background: "#FAFAFA", borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>{t}</div>
      </div>
      <div style={{ padding: "10px 14px" }}>{children}</div>
    </div>
  );
}

function PoolRow({ label: lbl, sub, value, color }: { label: string; sub: string; value: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>{lbl}</div>
        <div style={{ fontSize: 11, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>{sub}</div>
      </div>
      <span style={{ ...mono, fontSize: 18, color: value > 0 ? color : "#D4D4D4" }}>{value}</span>
    </div>
  );
}

function MiniStat({ label: lbl, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div style={{ textAlign: "center", padding: "8px 4px", background: "#FAFAFA", borderRadius: 6 }}>
      <div style={{ ...mono, fontSize: 16, color: "#171717" }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>{lbl} {sub}</div>
    </div>
  );
}
