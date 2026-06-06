import { Metadata } from "next";

export const metadata: Metadata = {
  title: "隐私政策 — PriceCRE · 地产价值",
  description: "PriceCRE 商业地产数据平台隐私保护政策",
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "var(--font-sans)", color: "var(--text)", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8 }}>隐私政策</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>最后更新：2026年6月5日</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>信息收集</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          注册时我们收集您的邮箱地址用于身份验证和权益管理。提交租金数据时收集的项目信息
          用于数据核验和行业分析。所有数据存储于加密数据库，不向第三方出售或转让。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>信息使用</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          邮箱地址仅用于发送验证码、激活码和重要账户通知。租金成交数据经脱敏聚合后
          用于行业统计和定价模型校准，不会披露具体项目来源方身份。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>数据安全</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          采用 Supabase 数据库加密存储 + Vercel 边缘函数处理，全站 HTTPS 传输。
          密码经 bcrypt 哈希后存储，任何人包括平台运营方均无法查看明文密码。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>Cookie 与追踪</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          我们使用 localStorage 保存用户的登录状态和浏览偏好，不使用第三方追踪 Cookie。
          爬取数据来源均来自公开网络信息，不涉及个人隐私数据采集。
        </p>
      </section>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--text-hint)" }}>
        © 2026 PriceCRE. All rights reserved.
      </div>
    </div>
  );
}
