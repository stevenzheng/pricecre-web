// app/admin/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
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
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm p-6 card-dark rounded-lg">
        <div className="text-center mb-6">
          <h1 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>PriceCRE Admin</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>数据管理后台</p>
        </div>

        {authError === "unauthorized" && (
          <div className="mb-4 px-3 py-2 text-xs rounded-sm" style={{ background: "var(--negative-soft)", color: "var(--negative)" }}>
            当前账号无管理权限
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>邮箱</label>
            <input type="email" className="w-full mt-1 px-3 py-2 text-sm rounded-sm border outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-input)", borderColor: "var(--line)", color: "var(--text)" }} value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>密码</label>
            <input type="password" className="w-full mt-1 px-3 py-2 text-sm rounded-sm border outline-none focus:border-[var(--accent)]" style={{ background: "var(--bg-input)", borderColor: "var(--line)", color: "var(--text)" }} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-[11px]" style={{ color: "var(--negative)" }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full rounded-sm text-sm">{loading ? "登录中..." : "登录"}</button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
