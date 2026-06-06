"use client";
import { showModal } from "@/components/Toast";
import CreditPanel from "@/components/CreditPanel";

import { useState, useEffect } from "react";

type Step = "login" | "register" | "verify" | "done";

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
  // quota is derived from page-level credits for consistency with CreditPanel
  const quota = credits && (credits.referral + credits.purchased) > 0 ? credits.referral + credits.purchased : 0;
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProduct, setPaymentProduct] = useState<"single" | "monthly">("single");
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay">("wechat");
  const [buying, setBuying] = useState(false);
  const [viewHistory, setViewHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Restore login state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pricecre_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.email) {
          setForm((prev) => ({ ...prev, email: user.email }));
          setLoggedIn(true);
          setStep("done");
          setActivated(true);
          // Restore referral code if available
          if (user.referralCode) {
            try { localStorage.setItem("pricecre_referralCode", JSON.stringify(user.referralCode)); } catch {}
          }
        }
      }
    } catch {}
  }, []);

  // Sync credits from parent page state
  useEffect(() => {
    if (credits) {
      const total = credits.referral + credits.purchased;
      if (total > 0 && !activated) setActivated(true);
      // quota is now derived from credits prop — no need to set manually
    }
  }, [credits]);

  const fetchHistory = async () => {
    if (!form.email) return;
    try {
      const res = await fetch(`/api/user/history?email=${encodeURIComponent(form.email)}`);
      const data = await res.json();
      setViewHistory(data.history || []);
    } catch {}
  };

  /* ---- 注册：发送验证码 ---- */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.email || !form.password) return;
    if (form.password.length < 6) { setError("密码至少6位"); return; }
    if (form.password !== form.confirm) { setError("两次密码不一致"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        setDevCode(data.devCode || "");
        setStep("verify");
      } else {
        setError(data.error || "发送失败");
      }
    } catch {
      setError("网络错误，请重试");
    }
    setLoading(false);
  };

  /* ---- 验证码校验 ---- */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, code: form.code }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setLoggedIn(true);
        setStep("done");
        // Save referral code to localStorage for dynamic sharing
        if (data.referralCode) {
          try {
            localStorage.setItem("pricecre_user", JSON.stringify({
              email: form.email,
              referralCode: data.referralCode,
              totalCredits: data.totalCredits || 3,
              registeredAt: Date.now(),
            }));
          } catch {}
        }
        fetchHistory();
      } else {
        setError(data.error || "验证失败");
      }
    } catch {
      setError("网络错误");
    }
    setLoading(false);
  };

  /* ---- 登录 ---- */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    // Save login to localStorage for persistence
    try {
      const code = "sz" + Math.random().toString(36).substring(2, 8);
      localStorage.setItem("pricecre_user", JSON.stringify({
        email: form.email,
        referralCode: code,
        totalCredits: 3,
        registeredAt: Date.now(),
      }));
      localStorage.setItem("pricecre_referralCode", JSON.stringify(code));
    } catch {}
    setLoggedIn(true);
    setStep("done");
    setActivated(true);
  };

  // Shared cards rendered in both logged-in and logged-out states
  const publicCards = (
    <div className="space-y-3">
      {/* 商业付费直通车 */}
      <div className="card p-4">
        <div className="section-title">商业付费直通车</div>
        
        {!showPayment ? (
          <div className="space-y-2">
            <button
              className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              onClick={() => { setPaymentProduct("single"); setShowPayment(true); }}
            >
              立即购买查询权益 · 99元 / 50次
            </button>
            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[var(--bg-hover)]"
              style={{ background: "var(--panel)", color: "var(--text)", border: "1px solid var(--line)" }}
              onClick={() => { setPaymentProduct("monthly"); setShowPayment(true); }}
            >
              不限次包月 · 299元/月
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-slide-up">
            {/* Order Summary */}
            <div className="p-3 rounded-lg" style={{ background: "var(--panel)" }}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>订单明细</span>
                <span style={{ fontSize: 11, color: "var(--text-hint)", fontWeight: 500 }}>1 项</span>
              </div>
              <div className="flex justify-between items-center mb-1" style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 400 }}>
                <span>{paymentProduct === "monthly" ? "不限次包月订阅" : "资产查询权益 × 50次"}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500, color: "var(--text)" }}>¥{paymentProduct === "monthly" ? "299.00" : "99.00"}</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between items-center" style={{ borderColor: "var(--line)" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-strong)" }}>合计</span>
                <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--accent)" }}>¥{paymentProduct === "monthly" ? "299.00" : "99.00"}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>选择支付方式</span>
              
              {/* WeChat */}
              <button
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === "wechat" ? "ring-1" : ""}`}
                style={{
                  borderColor: paymentMethod === "wechat" ? "var(--accent)" : "var(--line)",
                  background: paymentMethod === "wechat" ? "var(--accent-soft)" : "var(--panel)",
                }}
                onClick={() => setPaymentMethod("wechat")}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#07C160" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-inverse)"><path d="M8.69 3.46c-4.15 0-7.52 2.73-7.52 6.1 0 1.86.98 3.53 2.5 4.66l-.63 2.1 2.43-1.23c.96.29 2.02.45 3.14.45.37 0 .74-.02 1.1-.06a5.72 5.72 0 01-.18-1.46c0-3.07 3.02-5.57 6.75-5.57.3 0 .6.02.88.05C17.16 6.23 13.37 3.46 8.69 3.46z"/><path d="M17.35 9.72c-3.4 0-6.16 1.86-6.16 4.16 0 2.3 2.76 4.16 6.16 4.16.25 0 .5-.02.74-.04v.01c.94.3 2.63 1.01 2.63 1.01l-.54-1.89c1.2-.88 1.9-2.04 1.9-3.29 0-2.26-2.76-4.12-6.73-4.12z"/></svg>
                </div>
                <div className="flex-1 text-left">
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-strong)" }}>微信支付</div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-hint)" }}>WeChat Pay · 扫码即付</div>
                </div>
                {paymentMethod === "wechat" && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="var(--text-inverse)"/></svg>
                )}
              </button>

              {/* Alipay */}
              <button
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === "alipay" ? "ring-1" : ""}`}
                style={{
                  borderColor: paymentMethod === "alipay" ? "var(--accent)" : "var(--line)",
                  background: paymentMethod === "alipay" ? "var(--accent-soft)" : "var(--panel)",
                }}
                onClick={() => setPaymentMethod("alipay")}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#1677FF" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--text-inverse)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-2h2v2zm0-6h-2V7h2v4z"/></svg>
                </div>
                <div className="flex-1 text-left">
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-strong)" }}>支付宝</div>
                  <div style={{ fontSize: 11, fontWeight: 400, color: "var(--text-hint)" }}>Alipay · 安全支付</div>
                </div>
                {paymentMethod === "alipay" && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent)"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="var(--text-inverse)"/></svg>
                )}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: "var(--panel)", color: "var(--text-muted)", border: "1px solid var(--line)" }}
                onClick={() => { setShowPayment(false); setPaymentMethod("wechat"); }}
              >
                返回
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: buying ? "var(--text-hint)" : "var(--accent)", color: "var(--text-inverse)", cursor: buying ? "not-allowed" : "pointer" }}
                disabled={buying}
                onClick={async () => {
                  setBuying(true);
                  try {
                    const amount = paymentProduct === "monthly" ? 299 : 99;
                    const product = paymentProduct;
                    const res = await fetch("/api/payment/test-buy", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email: form.email, product, amount, paymentMethod: paymentMethod }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      const msg = paymentProduct === "monthly" 
                        ? "包月订阅已激活 · 30天不限次查看" 
                        : `${paymentMethod === "wechat" ? "微信" : "支付宝"}支付确认中... 50次额度即将到账`;
                      showModal(msg);
                      setShowPayment(false);
                      setPaymentMethod("wechat");
                    } else {
                      showModal("支付失败，请重试");
                    }
                  } catch {
                    const msg = paymentProduct === "monthly" 
                      ? "包月订阅已激活 · 30天不限次查看"
                      : `${paymentMethod === "wechat" ? "微信" : "支付宝"}支付确认中... 50次额度即将到账`;
                    showModal(msg);
                    setShowPayment(false);
                    setPaymentMethod("wechat");
                  }
                  setBuying(false);
                }}
              >
                {buying ? "处理中..." : `确认支付 ¥${paymentProduct === "monthly" ? "299.00" : "99.00"}`}
              </button>
            </div>

            <p className="text-[9px] text-center" style={{ color: "var(--text-hint)" }}>
              支付成功后权益即时到账 · 支持微信/支付宝双通道
            </p>
          </div>
        )}
      </div>
      {/* 分享转发 */}
      <div className="card p-3">
        <div className="section-title">分享转发获得查询权益</div>
        <div className="mb-3 text-center">
          <div style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", color: "var(--text-muted)", marginBottom: 8 }}>历史累计已获取确权权益</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-geist-mono), 'Geist Mono', monospace" }}>0</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>/ 100</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>次</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>你的全局专属裂变链接</div>
          <div className="flex gap-2">
            <input type="text" readOnly value="pricecre.com/r/sz2026" className="input-search flex-1 text-xs" style={{ paddingLeft: "12px", fontFamily: "var(--font-mono)" }} />
            <button className="btn-secondary text-xs px-4 flex-shrink-0" onClick={() => { navigator.clipboard.writeText("pricecre.com/r/sz2026"); showModal("已复制邀约链接"); }}>一键邀约</button>
          </div>
        </div>
      </div>

      {/* 激活兑换码 */}
      <div className="card p-3">
        <div className="section-title">激活兑换码</div>
        <div className="flex gap-2">
          <input type="text" placeholder="输入 6 位兑换码" className="input-search flex-1" style={{ paddingLeft: "12px", fontFamily: "var(--font-mono)" }} maxLength={6} />
          <button className="btn-primary text-sm px-5 flex-shrink-0" onClick={() => showModal("兑换码已激活")}>激活</button>
        </div>
      </div>
    </div>
  );

  /* ---- 登录 / 注册主界面 ---- */
  if (!loggedIn) {
    return (
      <div className="max-w-sm mx-auto px-4 py-4 space-y-4">
        <div className="card p-6 space-y-5">
          {/* 标签 */}
          <div className="flex items-center gap-2 justify-center">
            <span className="badge badge-accent text-[9px] tracking-wider font-medium" style={{ fontFamily: "var(--font-mono)" }}>
              SECURE_GATEWAY
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              // 账户登录
            </span>
          </div>

          <h2 className="text-center text-lg font-medium" style={{ color: "var(--text-strong)" }}>
            {step === "verify" ? "验证邮箱" : "登录 PriceCRE"}
          </h2>

          {/* Tab */}
          {step !== "verify" && (
            <div className="flex rounded-lg p-0.5" style={{ background: "var(--panel)" }}>
              <button onClick={() => setStep("login")}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${step === "login" ? "bg-[var(--bg-surface)] text-[var(--text-strong)] shadow-sm" : "text-[var(--text-muted)]"}`}>
                邮箱登录
              </button>
              <button onClick={() => setStep("register")}
                className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${step === "register" ? "bg-[var(--bg-surface)] text-[var(--text-strong)] shadow-sm" : "text-[var(--text-muted)]"}`}>
                注册新账户
              </button>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="text-[11px] font-medium px-3 py-2 rounded-lg" style={{ background: "var(--negative-soft)", color: "var(--negative)" }}>
              {error}
            </div>
          )}

          {/* 验证码步骤 */}
          {step === "verify" ? (
            <form onSubmit={handleVerify} className="space-y-3">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                验证码已发送至 <strong>{form.email}</strong>{devCode ? `（开发模式：${devCode}）` : ""}
              </p>
              <input type="text" placeholder="输入 6 位验证码" value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="input-search text-center text-lg tracking-[0.3em]" style={{ paddingLeft: "12px", fontFamily: "var(--font-mono)" }}
                maxLength={6} />
              <button type="submit" disabled={loading} className="btn-primary w-full text-sm" style={{ paddingTop: 12, paddingBottom: 12 }}>
                {loading ? "验证中..." : "验证并登录"}
              </button>
              <button type="button" onClick={() => setStep("register")} className="w-full text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
                ← 返回修改邮箱
              </button>
            </form>
          ) : step === "register" ? (
            /* 注册表单 */
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>账户邮箱</span>
                  <span className="text-[9px] font-medium tracking-wider opacity-40" style={{ fontFamily: "var(--font-mono)" }}>EMAIL</span>
                </div>
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-search" style={{ paddingLeft: "12px" }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>设置密码</span>
                  <span className="text-[9px] font-medium tracking-wider opacity-40" style={{ fontFamily: "var(--font-mono)" }}>PASSWORD</span>
                </div>
                <input type="password" placeholder="至少 6 位" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-search" style={{ paddingLeft: "12px" }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>确认密码</span>
                  <span className="text-[9px] font-medium tracking-wider opacity-40" style={{ fontFamily: "var(--font-mono)" }}>CONFIRM</span>
                </div>
                <input type="password" placeholder="再次输入" value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="input-search" style={{ paddingLeft: "12px" }} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full text-sm" style={{ paddingTop: 12, paddingBottom: 12 }}>
                {loading ? "发送中..." : "发送验证码"}
                <span className="text-[9px] font-normal ml-1 opacity-60" style={{ fontFamily: "var(--font-mono)" }}>SEND CODE</span>
              </button>
            </form>
          ) : (
            /* 登录表单 */
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>账户邮箱</span>
                  <span className="text-[9px] font-medium tracking-wider opacity-40" style={{ fontFamily: "var(--font-mono)" }}>EMAIL</span>
                </div>
                <input type="email" placeholder="your@email.com" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="input-search" style={{ paddingLeft: "12px" }} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>访问密码</span>
                  <span className="text-[9px] font-medium tracking-wider opacity-40" style={{ fontFamily: "var(--font-mono)" }}>PASSWORD</span>
                </div>
                <input type="password" placeholder="········" value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-search" style={{ paddingLeft: "12px" }} />
              </div>
              <button type="submit" className="btn-primary w-full text-sm" style={{ paddingTop: 12, paddingBottom: 12 }}>
                登录 <span className="text-[9px] font-normal ml-1 opacity-60" style={{ fontFamily: "var(--font-mono)" }}>SIGN IN</span>
              </button>
            </form>
          )}

          {/* OR + 微信 */}
          {step !== "verify" && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                <span className="text-[10px] font-medium" style={{ color: "var(--text-hint)" }}>OR</span>
                <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
              </div>
              <button className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                style={{ background: "var(--positive-soft)", color: "var(--positive)", border: "1px solid var(--positive-border)" }}
                onClick={() => setLoggedIn(true)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348z"/><path d="M14.332 11.09a9.225 9.225 0 00-1.525.197c-1.961.36-3.717 1.525-4.775 3.053-.556.803-.858 1.69-.858 2.59 0 2.637 1.99 4.964 4.83 5.807a5.19 5.19 0 001.445.213c.506 0 1.007-.073 1.493-.213l1.086.636a.18.18 0 00.095.031.17.17 0 00.168-.168c0-.041-.017-.082-.027-.122l-.222-.846a.338.338 0 01.121-.38c1.822-1.209 2.922-3.083 2.922-5.314 0-3.26-2.95-5.684-6.278-5.684z"/></svg>
                微信登录 <span className="text-[9px] font-normal opacity-60" style={{ fontFamily: "var(--font-mono)" }}>WeChat Login</span>
              </button>
            </>
          )}

          {/* 微信公众号 */}
          <div className="flex flex-col items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#07C160">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path d="M8.5 9a1 1 0 100-2 1 1 0 000 2zm4 0a1 1 0 100-2 1 1 0 000 2z" fill="#fff"/>
              </svg>
              <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>关注微信公众号</span>
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--positive)" }}>PriceCRE</span>
            <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>获取最新资产数据推送与行业洞察</span>
          </div>

        </div>
      {publicCards}
    </div>
    );
  }

  /* ---- 已登录 ---- */
  return (
    <div className="max-w-sm mx-auto px-4 py-4 space-y-4">
      {/* 1. 用户信息卡片 */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--panel)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>用户</div>
            <div style={{ fontSize: 12, fontWeight: 400, fontFamily: "var(--font-sans)", color: "var(--text-muted)" }}>{form.email}</div>
          </div>
          <button onClick={() => { setLoggedIn(false); setStep("login"); }} style={{ fontSize: 12, fontWeight: 500, fontFamily: "var(--font-sans)", color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer" }}>退出登录</button>
        </div>
      </div>

      {/* CreditPanel — 统一额度面板 */}
      <CreditPanel
        credits={{
          shared: 0,
          referral: credits?.referral || 0,
          purchased: credits?.purchased || 0,
        }}
        chatTokens={chatTokens || { total: 0, used: 0 }}
        creditStats={creditStats || { viewCount: 0, unlockCount: 0, conversations: 0 }}
      />

      {/* 查看记录 */}
      {viewHistory.length > 0 && (
        <div className="card p-5">
          <div className="section-title" onClick={() => setShowHistory(!showHistory)} style={{ cursor: "pointer" }}>
            查看记录 ({viewHistory.length})
            <span className="ml-2 text-[10px]" style={{ color: "var(--text-hint)" }}>{showHistory ? "收起 ▲" : "展开 ▼"}</span>
          </div>
          {showHistory && (
            <div className="space-y-1.5 mt-3">
              {viewHistory.map((p, i) => (
                <div key={p.id || i} className="flex items-center justify-between py-2 px-2 rounded-lg" style={{ background: "var(--panel)" }}>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-strong)" }}>{p.projectName}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-hint)" }}>{p.city} · {p.district}</div>
                  </div>
                  <div className="text-xs font-mono font-medium ml-2 flex-shrink-0" style={{ color: "var(--accent)" }}>
                    ¥{Number(p.faceRent).toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. 付费 + 分享 + 公众号 */}
      {publicCards}

      <div className="space-y-2">
        {!activated && <button className="btn-primary w-full" onClick={() => { setActivated(true); document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "share" })); }}>提报交易</button>}
        {quota <= 0 && <button className="btn-secondary w-full" onClick={() => { document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "share" })); }}>购买权益</button>}
        <button
          className="btn-secondary w-full text-xs"
          onClick={() => {
            localStorage.removeItem("pricecre_user");
            setLoggedIn(false);
            setStep("login");
            setForm({ email: "", password: "", confirm: "", code: "" });
            showModal("已退出登录");
          }}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
