"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginFormInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const authError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("账号或密码错误");
      setLoading(false);
    } else {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bw-panel)",
    }}>
      <div style={{
        width: 380,
        maxWidth: "90vw",
        padding: "40px 32px",
        borderRadius: 6,
        background: "var(--bw-surface)",
        border: "1px solid var(--bw-line)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          {/* 与前台一致的蓝色 Logo */}
          <div style={{ width: 40, height: 40, borderRadius: 9, background: "#0070F3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <rect x="8" y="10" width="8" height="4" rx="1" />
              <rect x="8" y="18" width="8" height="4" rx="1" />
              <rect x="2" y="6" width="6" height="3" rx="1" />
              <rect x="2" y="14" width="6" height="3" rx="1" />
              <rect x="2" y="22" width="6" height="3" rx="1" />
              <rect x="16" y="6" width="6" height="3" rx="1" />
              <rect x="16" y="14" width="6" height="3" rx="1" />
            </svg>
          </div>
          <h2 style={{
            fontSize: 16, fontWeight: 600, color: "var(--bw-text)", margin: "0 0 4px",
            fontFamily: "var(--font-sans)", letterSpacing: "-0.02em",
          }}>
            PriceCRE · 地产价值
          </h2>
          <p style={{ fontSize: 12, color: "var(--bw-muted)", margin: 0, fontFamily: "var(--font-sans)", letterSpacing: "-0.01em" }}>
            Admin Console · 数据治理中心
          </p>
        </div>

        {authError && (
          <div style={{
            background: "rgba(238,0,0,0.06)", color: "#EE0000",
            padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 16, textAlign: "center",
            fontFamily: "var(--font-sans)", letterSpacing: "-0.01em"
          }}>
            登录已过期，请重新登录
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(238,0,0,0.06)", color: "#EE0000",
            padding: "8px 12px", borderRadius: 6, fontSize: 12, marginBottom: 16, textAlign: "center",
            fontFamily: "var(--font-sans)", letterSpacing: "-0.01em"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 500,
              color: "var(--bw-muted)", marginBottom: 6,
              fontFamily: "var(--font-sans)", letterSpacing: "-0.01em"
            }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pricecre.com"
              required
              style={{
                width: "100%", padding: "8px 12px",
                borderRadius: 6, border: "1px solid var(--bw-line-strong)",
                background: "var(--bw-surface)", color: "var(--bw-text)",
                fontSize: 14, outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)", letterSpacing: "-0.01em",
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 500,
              color: "var(--bw-muted)", marginBottom: 6,
              fontFamily: "var(--font-sans)", letterSpacing: "-0.01em"
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%", padding: "8px 12px",
                borderRadius: 6, border: "1px solid var(--bw-line-strong)",
                background: "var(--bw-surface)", color: "var(--bw-text)",
                fontSize: 14, outline: "none", boxSizing: "border-box",
                fontFamily: "var(--font-sans)", letterSpacing: "-0.01em",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "8px 16px",
              borderRadius: 6, border: "none",
              background: loading ? "var(--bw-hint)" : "#0070F3",
              color: "#FFFFFF", fontSize: 14, fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "var(--font-sans)", letterSpacing: "-0.01em",
              transition: "background 0.12s ease",
            }}
          >
            {loading ? "验证中..." : "登录"}
          </button>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <a href="/forgot-password" style={{ fontSize: 11, color: "#0070F3", textDecoration: "none", fontFamily: "var(--font-sans)" }}>忘记密码？</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bw-panel)" }}>
        <div style={{ color: "var(--bw-muted)", fontSize: 14, fontFamily: "var(--font-sans)" }}>加载中...</div>
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  );
}
