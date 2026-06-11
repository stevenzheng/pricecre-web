// app/forgot-password/page.tsx
"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!email) { setMsg("请输入邮箱"); return; }
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await res.json();
      setMsg(d.message || "已发送"); setStep(2);
    } catch { setMsg("发送失败"); }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (!code || !password) { setMsg("请填写验证码和新密码"); return; }
    if (password.length < 6) { setMsg("密码至少6位"); return; }
    setLoading(true); setMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const d = await res.json();
      if (d.success) setMsg("密码已重置！即将跳转到登录页...");
      else setMsg(d.error || "重置失败");
    } catch { setMsg("网络错误"); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC" }}>
      <div style={{ width: 360, background: "#FFF", borderRadius: 12, padding: 32, boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#0070F3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1"/><rect x="8" y="10" width="8" height="4" rx="1"/><rect x="8" y="18" width="8" height="4" rx="1"/></svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>忘记密码</h2>
          <p style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)", margin: 0 }}>{step === 1 ? "输入注册邮箱获取验证码" : "输入验证码和新密码"}</p>
        </div>

        {step === 1 ? (
          <>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="注册邮箱" type="email" autoFocus onKeyDown={e => e.key === "Enter" && sendCode()}
              style={{ width: "100%", padding: "12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
            <button onClick={sendCode} disabled={loading}
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#0070F3", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              {loading ? "发送中..." : "发送验证码"}
            </button>
          </>
        ) : (
          <>
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="6位验证码" maxLength={6} autoFocus
              style={{ width: "100%", padding: "12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-mono)", outline: "none", marginBottom: 12, boxSizing: "border-box", letterSpacing: 4 }} />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="新密码（至少6位）" type="password" onKeyDown={e => e.key === "Enter" && resetPassword()}
              style={{ width: "100%", padding: "12px", border: "1px solid #D4D4D4", borderRadius: 8, fontSize: 14, fontFamily: "var(--font-sans)", outline: "none", marginBottom: 16, boxSizing: "border-box" }} />
            <button onClick={resetPassword} disabled={loading}
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#10B981", color: "#FFF", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)", marginBottom: 12 }}>
              {loading ? "重置中..." : "重置密码"}
            </button>
            <button onClick={() => { setStep(1); setMsg(""); }}
              style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: "none", color: "#737373", fontSize: 12, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
              ← 返回上一步
            </button>
          </>
        )}

        {msg && <div style={{ marginTop: 14, padding: "8px 12px", borderRadius: 6, fontSize: 12, fontFamily: "var(--font-sans)", background: msg.includes("已发送") || msg.includes("已重置") ? "rgba(16,185,129,0.06)" : "rgba(238,0,0,0.06)", color: msg.includes("已发送") || msg.includes("已重置") ? "#10B981" : "#EE0000" }}>{msg}</div>}

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link href="/admin/login" style={{ fontSize: 12, color: "#0070F3", textDecoration: "none", fontFamily: "var(--font-sans)" }}>← 返回登录</Link>
        </div>
      </div>
    </div>
  );
}
