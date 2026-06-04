"use client";
import { showModal } from "@/components/Toast";

import { useState } from "react";

type Step = "login" | "register" | "verify" | "done";

export default function ProfilePanel() {
  const [step, setStep] = useState<Step>("login");
  const [form, setForm] = useState({ email: "", password: "", confirm: "", code: "" });
  const [loggedIn, setLoggedIn] = useState(false);
  const [activated, setActivated] = useState(false);
  const [quota, setQuota] = useState(0);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState("");

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
    setLoggedIn(true);
    setStep("done");
  };

  // Shared cards rendered in both logged-in and logged-out states
  const publicCards = (
    <div className="space-y-3">
      {/* 分享转发 */}
      <div className="card p-3">
        <div className="section-title">分享转发获得查看额度</div>
        <div className="mb-3 text-center">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>历史累计已获取确权额度</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>0</span>
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

      {/* 商业付费直通车 */}
      <div className="card p-3">
        <div className="section-title">商业付费直通车</div>
        <div className="space-y-2">
          <button className="w-full py-3 rounded-xl text-sm font-medium" style={{ background: "var(--accent)", color: "var(--text-inverse)" }} onClick={() => showModal("购买成功 · 50次查看额度已到账")}>立即购买查看额度 · 99元 / 50次</button>
          <button className="w-full py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--panel)", color: "var(--text)", border: "1px solid var(--line)" }} onClick={() => showModal("不限次包月即将上线")}>不限次包月 · 299元/月</button>
        </div>
      </div>
    </div>
  );

  /* ---- 登录 / 注册主界面 ---- */
  if (!loggedIn) {
    return (
      <div className="max-w-sm mx-auto px-4 py-4 space-y-4">
        {publicCards}
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
      </div>
    );
  }

  /* ---- 已登录 ---- */
  return (
    <div className="max-w-sm mx-auto px-4 py-4 space-y-4">
      {publicCards}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--panel)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>用户</div>
            <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{form.email}</div>
          </div>
          <button onClick={() => { setLoggedIn(false); setStep("login"); }} className="ml-auto text-[10px] font-medium hover:underline" style={{ color: "var(--text-muted)" }}>退出登录</button>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "var(--panel)" }}>
          <div className="w-3 h-3 rounded-full" style={{ background: activated && quota > 0 ? "var(--positive)" : "var(--text-hint)" }} />
          <div>
            <div className="text-[13px] font-medium" style={{ color: activated && quota > 0 ? "var(--positive)" : "var(--text-muted)" }}>
              {!activated ? "尚未激活额度" : quota > 0 ? `可用额度：${quota} 次` : "额度已用完"}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{!activated ? "提交数据或购买额度即可激活" : ""}</div>
          </div>
        </div>
      </div>
      <div className="card p-5">
        <div className="section-title">账户统计</div>
        <div className="grid grid-cols-3 gap-3">
          {[{ label: "提交", value: 0 }, { label: "购买", value: 0 }, { label: "查看", value: 0 }].map((s) => (
            <div key={s.label} className="text-center py-2 rounded-lg" style={{ background: "var(--panel)" }}>
              <div className="text-lg font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
              <div className="text-[10px] mt-0.5" style={{ color: "var(--text-hint)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>


      <div className="space-y-2">
        {!activated && <button className="btn-primary w-full" onClick={() => { setActivated(true); document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "share" })); }}>提交真实交易</button>}
        {quota <= 0 && <button className="btn-secondary w-full" onClick={() => { setQuota((q) => q + 8); document.dispatchEvent(new CustomEvent("nav-to-tab", { detail: "share" })); }}>购买额度</button>}
        <button className="btn-secondary w-full text-xs" onClick={() => showModal("即将上线")}>账户设置</button>
      </div>
    </div>
  );
}
