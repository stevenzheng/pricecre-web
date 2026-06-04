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
      background: "var(--bg)",
    }}>
      <div style={{
        width: 380,
        maxWidth: "90vw",
        padding: "40px 32px",
        borderRadius: 12,
        background: "var(--bg-surface)",
        border: "1px solid var(--line)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40,
            background: "var(--accent)",
            borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2">
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
            fontSize: 18, fontWeight: 600, color: "var(--text-strong)", margin: "0 0 4px"
          }}>
            PriceCRE 管理后台
          </h2>
          <p style={{ fontSize: 12, color: "var(--text-hint)", margin: 0 }}>
            数据治理中心 · 登录
          </p>
        </div>

        {authError && (
          <div style={{
            background: "var(--negative-soft)", color: "var(--negative)",
            padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 16, textAlign: "center"
          }}>
            登录已过期，请重新登录
          </div>
        )}

        {error && (
          <div style={{
            background: "var(--negative-soft)", color: "var(--negative)",
            padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 16, textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 500,
              color: "var(--text-muted)", marginBottom: 6
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
                width: "100%", padding: "10px 12px",
                borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--panel)", color: "var(--text)",
                fontSize: 14, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block", fontSize: 12, fontWeight: 500,
              color: "var(--text-muted)", marginBottom: 6
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
                width: "100%", padding: "10px 12px",
                borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--panel)", color: "var(--text)",
                fontSize: 14, outline: "none", boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 16px",
              borderRadius: 8, border: "none",
              background: loading ? "var(--text-hint)" : "var(--accent)",
              color: "var(--text-inverse)", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "验证中..." : "登录"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-hint)", fontSize: 14 }}>加载中...</div>
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  );
}
