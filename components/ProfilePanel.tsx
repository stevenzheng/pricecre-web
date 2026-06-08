"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { showModal } from "@/components/Toast";

type Step = "login" | "register" | "verify" | "done";

const mono = { fontFamily: "var(--font-mono)", fontWeight: 300, letterSpacing: "-0.03em" } as const;
const caption = { fontSize: 12, fontWeight: 400, color: "#A3A3A3", fontFamily: "var(--font-sans)" } as const;
const title = { fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" } as const;
const badge = { fontSize: 11, fontWeight: 500, fontFamily: "var(--font-sans)" } as const;

export default function ProfilePanel({ credits, totalCredits, chatTokens, creditStats, userEmail }: {
  credits?: { referral: number; purchased: number };
  totalCredits?: number;
  chatTokens?: { total: number; used: number };
  creditStats?: { viewCount: number; unlockCount: number; conversations: number };
  userEmail?: string | null;
}) {
  const [step, setStep] = useState<Step>("login");
  const [form, setForm] = useState({ email: "", password: "", confirm: "", code: "" });
  // 关键修复：loggedIn 状态完全由 userEmail prop 驱动，不再用 localStorage 判断
  const loggedIn = !!userEmail;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [username, setUsername] = useState("用户");
  const [editingName, setEditingName] = useState(false);

  // 从 localStorage 读取用户名（仅显示用，不影响登录状态）
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pricecre_username");
      if (stored) setUsername(stored);
      const user = JSON.parse(localStorage.getItem("pricecre_user") || "{}");
      if (user.email) setForm(p => ({ ...p, email: user.email }));
    } catch {}
  }, [userEmail]);

  // 当 userEmail prop 有值时，自动切换到 done 状态
  useEffect(() => {
    if (userEmail) {
      setStep("done");
      setError("");
    } else {
      setStep("login");
    }
  }, [userEmail]);

  const saveUsername = (name: string) => {
    setUsername(name);
    try { localStorage.setItem("pricecre_username", name); } catch {}
    setEditingName(false);
  };

  // Redeem
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemStatus, setRedeemStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [redeemMsg, setRedeemMsg] = useState("");

  const handleRedeem = async () => {
    if (redeemCode.length !== 6) { setRedeemMsg("请输入6位激活码"); setRedeemStatus("error"); return; }
    setRedeemStatus("loading");
    try {
      const res = await fetch("/api/data/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode, email: userEmail || "" })
      });
      const d = await res.json();
      if (d.success) { setRedeemMsg(`激活成功！${d.credits} 次查询权益已到账`); setRedeemStatus("success"); setRedeemCode(""); }
      else { setRedeemMsg(d.error || "激活失败"); setRedeemStatus("error"); }
    } catch { setRedeemMsg("网络错误"); setRedeemStatus("error"); }
  };

  // Payment
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState<"single" | "monthly">("single");
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay">("wechat");
  const [buying, setBuying] = useState(false);
  const [showAiPayment, setShowAiPayment] = useState(false);
  const [aiPaymentMethod, setAiPaymentMethod] = useState<"wechat" | "alipay">("wechat");

  const remainingChat = chatTokens ? Math.max(0, chatTokens.total - chatTokens.used) : 0;

  // 登录处理：完全依赖 NextAuth signIn
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        // 只存显示信息，不存鉴权信息
        try {
          localStorage.setItem("pricecre_username", form.email.split("@")[0]);
          const existingUser = JSON.parse(localStorage.getItem("pricecre_user") || "{}");
          localStorage.setItem("pricecre_user", JSON.stringify({
            ...existingUser,
            email: form.email,
            loginAt: Date.now(),
          }));
        } catch {}
        // 通知 page.tsx 更新 userEmail 状态
        document.dispatchEvent(new CustomEvent("user-login", { detail: { email: form.email } }));
      } else {
        setError("账号或密码错误");
      }
    } catch {
      setError("网络错误，请稍后重试");
    }
    setLoading(false);
  };

  // 退出登录
  const handleLogout = async () => {
    await signOut({ redirect: false });
    localStorage.removeItem("pricecre_user");
    localStorage.removeItem("pricecre_username");
    document.dispatchEvent(new CustomEvent("user-logout"));
  };

  // ── 未登录界面 ──
  if (!loggedIn) {
    return (
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "16px" }}>
        <div style={{ background: "#FFF", borderRadius: 12, border: "1px solid #E5E5E5", padding: 24 }}>
          <h2 style={{ ...title, fontSize: 18, textAlign: "center", marginBottom: 16 }}>
            {step === "verify" ? "验证邮箱" : "登录 PriceCRE"}
          </h2>

          {step !== "verify" && (
            <div style={{ display: "flex", borderRadius: 8, background: "#F7F7F7", padding: 2, marginBottom: 16 }}>
              {(["login", "register"] as Step[]).map(s => (
                <button key={s} onClick={() => { setStep(s); setError(""); }}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 6, border: "none", background: step === s ? "#FFF" : "transparent", color: step === s ? "#171717" : "#A3A3A3", fontSize: 13, fontWeight: 500, cursor: "pointer", boxShadow: step === s ? "0 1px 3px rgba(0,0,0,0.08)" : "none", fontFamily: "var(--font-sans)" }}>
                  {s === "login" ? "邮箱登录" : "注册新账户"}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div style={{ padding: "8px 12px", borderRadius: 6, background: "rgba(238,0,0,0.06)", color: "#EE0000", fontSize: 12, fontWeight: 500, marginBottom: 12, fontFamily: "var(--font-sans)" }}>
              {error}
            </div>
          )}

          {step === "verify" ? (
            <form onSubmit={async e => {
              e.preventDefault();
              setLoading(true);
              try {
                const r = await fetch("/api/auth/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: form.email, code: form.code })
                });
                const d = await r.json();
                if (d.success) {
                  try {
                    localStorage.setItem("pricecre_user", JSON.stringify({
                      email: form.email,
                      referralCode: d.referralCode || "",
                      totalCredits: 10,
                      registeredAt: Date.now()
                    }));
                    localStorage.setItem("pricecre_username", form.email.split("@")[0]);
                  } catch {}
                  document.dispatchEvent(new CustomEvent("user-login", { detail: { email: form.email } }));
                  const signInResult = await signIn("credentials", {
                    email: form.email,
                    password: form.password,
                    redirect: false,
                  });
                  if (!signInResult?.ok) {
                    setStep("login");
                    setError("注册成功，请用新密码登录");
                  }
                } else {
                  setError(d.error || "验证失败");
                }
              } catch { setError("网络错误"); }
              setLoading(false);
            }}>
              <p style={caption}>{devCode ? `验证码已发送至 ${form.email} (${devCode})` : `验证码已发送至 ${form.email}`}</p>
              <input type="text" placeholder="输入6位验证码" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 18, textAlign: "center", letterSpacing: "0.3em", outline: "none", fontFamily: "var(--font-mono)", marginTop: 12 }}
                maxLength={6} />
              <button type="submit" disabled={loading}
                style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                {loading ? "验证中..." : "验证并登录"}
              </button>
            </form>
          ) : step === "register" ? (
            <form onSubmit={async e => {
              e.preventDefault();
              setError("");
              if (!form.email || !form.password) return;
              if (form.password.length < 6) { setError("密码至少6位"); return; }
              if (form.password !== form.confirm) { setError("两次密码不一致"); return; }
              setLoading(true);
              try {
                const r = await fetch("/api/auth/register", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: form.email, password: form.password })
                });
                const d = await r.json();
                if (d.success) { setDevCode(d.devCode || ""); setStep("verify"); }
                else setError(d.error || "发送失败");
              } catch { setError("网络错误"); }
              setLoading(false);
            }}>
              <InputField label="账户邮箱" placeholder="your@email.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <InputField label="设置密码" placeholder="至少6位" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <InputField label="确认密码" placeholder="再次输入" type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} />
              <button type="submit" disabled={loading}
                style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                {loading ? "发送中..." : "发送验证码"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <InputField label="账户邮箱" placeholder="your@email.com" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              <InputField label="访问密码" placeholder="········" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              <button type="submit" disabled={loading}
                style={{ width: "100%", marginTop: 12, padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                {loading ? "登录中..." : "登录"}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── 已登录界面 ──
  const referralCode = (() => {
    try { return JSON.parse(localStorage.getItem("pricecre_user") || "{}").referralCode || ""; } catch { return ""; }
  })();

  return (
    <div style={{ padding: "16px", maxWidth: 740, margin: "0 auto" }}>
      {/* 用户头部 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `hsl(${(userEmail || "").charCodeAt(0) % 360}, 60%, 45%)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: 15, fontWeight: 700, flexShrink: 0 }}>
          {(userEmail || "?").charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <input autoFocus defaultValue={username}
              onBlur={e => saveUsername(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveUsername((e.target as HTMLInputElement).value); if (e.key === "Escape") setEditingName(false); }}
              style={{ fontSize: 14, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", border: "1px solid #0070F3", borderRadius: 4, padding: "2px 6px", outline: "none", width: 120 }} />
          ) : (
            <div style={{ ...title, fontSize: 14, cursor: "pointer" }} onClick={() => setEditingName(true)} title="点击编辑昵称">
              {username} <span style={{ fontSize: 9, color: "#A3A3A3", marginLeft: 4 }}>✎</span>
            </div>
          )}
          <div style={{ ...caption, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis" }}>{userEmail}</div>
        </div>
        {/* 退出登录使用真实 NextAuth signOut */}
        <button onClick={handleLogout}
          style={{ fontSize: 11, fontWeight: 500, color: "#A3A3A3", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          退出登录
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        {/* 邀请好友 */}
        <div id="referral-section" style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="1.5"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
            邀请好友
          </div>
          <div style={{ fontSize: 13, color: "#737373", marginBottom: 10 }}>邀请好友注册，双方各得 10 次查看额度</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input readOnly value={referralCode ? `pricecre.com/r/${referralCode}` : "加载中..."}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-mono)", background: "#F7F7F7" }} />
            <button onClick={e => {
              if (!referralCode) return;
              const btn = e.currentTarget;
              navigator.clipboard.writeText(`https://pricecre.com/r/${referralCode}`).then(() => {
                btn.textContent = "已复制"; (btn.style as any).color = "#10B981";
                setTimeout(() => { btn.textContent = "复制"; (btn.style as any).color = "#0070F3"; }, 2000);
              });
            }} style={{ padding: "10px 18px", borderRadius: 8, border: "1px solid #0070F3", background: "#FFF", color: "#0070F3", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>复制</button>
          </div>
        </div>

        {/* 激活兑换码 */}
        <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.5"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 100 4 2 2 0 000-4z"/></svg>
            激活兑换码
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={redeemCode} onChange={e => { setRedeemCode(e.target.value.toUpperCase()); setRedeemStatus("idle"); }}
              placeholder="6位激活码" maxLength={6} onKeyDown={e => { if (e.key === "Enter") handleRedeem(); }}
              style={{ flex: 1, padding: "10px 14px", border: "1px solid #E5E5E5", borderRadius: 8, fontSize: 16, fontFamily: "var(--font-mono)", outline: "none", letterSpacing: "0.1em" }} />
            <button onClick={handleRedeem} disabled={redeemStatus === "loading"}
              style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: redeemStatus === "loading" ? "default" : "pointer", opacity: redeemStatus === "loading" ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
              {redeemStatus === "loading" ? "验证中" : "激活"}
            </button>
          </div>
          {redeemStatus !== "idle" && (
            <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, fontSize: 13, fontFamily: "var(--font-sans)", background: redeemStatus === "success" ? "rgba(0,112,243,0.06)" : "rgba(238,0,0,0.06)", color: redeemStatus === "success" ? "#0070F3" : "#EE0000" }}>
              {redeemMsg}
            </div>
          )}
        </div>

        {/* 购买查看权益 */}
        <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F5A623" strokeWidth="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
            商业付费直通车
          </div>
          {!showPayment ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => { setPaymentProduct("single"); setShowPayment(true); }}
                style={{ padding: "12px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                查看权益 × 50次 · ¥99.00
              </button>
              <div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", textAlign: "center" }}>
                一次性购买 50 次资产数据查看额度，不限时长
              </div>
              <button onClick={() => { setPaymentProduct("monthly"); setShowPayment(true); }}
                style={{ padding: "10px 0", borderRadius: 8, border: "1px solid #EF4444", background: "#FFF", color: "#EF4444", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                不限次包月 · ¥299.00/月
              </button>
            </div>
          ) : (
            <div>
              <div style={{ padding: "10px 12px", background: "#F7F7F7", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E5E5E5", paddingTop: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>合计</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "#0070F3" }}>¥{paymentProduct === "monthly" ? "299.00" : "99.00"}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {(["wechat", "alipay"] as const).map(m => (
                  <button key={m} onClick={() => setPaymentMethod(m)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: paymentMethod === m ? "2px solid #0070F3" : "1px solid #E5E5E5", background: paymentMethod === m ? "rgba(0,112,243,0.04)" : "#FFF", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", color: m === "wechat" ? "#07C160" : "#1677FF" }}>
                    {m === "wechat" ? "微信支付" : "支付宝"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setShowPayment(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #E5E5E5", background: "#FFF", color: "#404040", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>返回</button>
                <button onClick={async () => {
                  setBuying(true);
                  try {
                    const res = await fetch("/api/payment/test-buy", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: userEmail, product: paymentProduct, amount: paymentProduct === "monthly" ? 299 : 99, paymentMethod }),
                    });
                    const d = await res.json();
                    if (d.success) { setShowPayment(false); showModal("支付成功！额度已到账"); }
                    else showModal(d.error || "支付失败");
                  } catch { showModal("网络错误"); }
                  setBuying(false);
                }} disabled={buying}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 12, fontWeight: 500, cursor: buying ? "default" : "pointer", opacity: buying ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                  {buying ? "处理中..." : "确认支付"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* AI 对话购买 */}
        <div style={{ background: "#FFF", borderRadius: 10, border: "1px solid #E5E5E5", padding: "12px 14px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            AI 对话次数
          </div>
          {!showAiPayment ? (
            <button onClick={() => setShowAiPayment(true)}
              style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #2563EB 0%, #EC4899 100%)", color: "#FFF", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              ¥10 · 100条对话
            </button>
          ) : (
            <div>
              <div style={{ padding: "10px 12px", background: "#F7F7F7", borderRadius: 8, marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#171717", fontFamily: "var(--font-sans)" }}>AI 对话 × 100条</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "#0070F3" }}>¥10.00</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {(["wechat", "alipay"] as const).map(m => (
                  <button key={m} onClick={() => setAiPaymentMethod(m)}
                    style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: aiPaymentMethod === m ? "2px solid #0070F3" : "1px solid #E5E5E5", background: aiPaymentMethod === m ? "rgba(0,112,243,0.04)" : "#FFF", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", color: m === "wechat" ? "#07C160" : "#1677FF" }}>
                    {m === "wechat" ? "微信支付" : "支付宝"}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setShowAiPayment(false)} style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "1px solid #E5E5E5", background: "#FFF", color: "#404040", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>返回</button>
                <button onClick={async () => {
                  setBuying(true);
                  try {
                    const res = await fetch("/api/payment/test-buy", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: userEmail, product: "ai-chat-100", amount: 10, paymentMethod: aiPaymentMethod }),
                    });
                    const d = await res.json();
                    if (d.success) { setShowAiPayment(false); showModal("AI对话100条已到账！"); }
                    else showModal(d.error || "购买失败");
                  } catch { showModal("网络错误"); }
                  setBuying(false);
                }} disabled={buying}
                  style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 12, fontWeight: 500, cursor: buying ? "default" : "pointer", opacity: buying ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                  {buying ? "处理中..." : "确认支付"}
                </button>
              </div>
            </div>
          )}
          <div style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)", textAlign: "center", marginTop: 6 }}>
            100 条 AI 助理对话额度，私密咨询资产行情与精算分析
          </div>
        </div>

        <style>{`
          @keyframes liveGlow {
            0%, 100% { box-shadow: 0 0 4px rgba(239,68,68,0.4); }
            50% { box-shadow: 0 0 12px rgba(239,68,68,0.6); }
          }
        `}</style>
      </div>
    </div>
  );
}

function InputField({ label: lbl, placeholder, type, value, onChange }: { label: string; placeholder: string; type: string; value: string; onChange: (e: any) => void }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4 }}>{lbl}</div>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        style={{ width: "100%", padding: "9px 12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" }} />
    </div>
  );
}
