import { Metadata } from "next";

export const metadata: Metadata = {
  title: "联系我们 — PriceCRE · 地产价值",
  description: "联系 PriceCRE 商业地产数据平台团队",
};

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "var(--font-sans)", color: "var(--text)", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8 }}>联系我们</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>商务合作 · 数据提交 · 技术反馈</p>

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", marginBottom: 40 }}>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📧</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--text-strong)" }}>商务合作</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>biz@pricecre.com</p>
        </div>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--text-strong)" }}>数据提交</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>data@pricecre.com</p>
        </div>
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🛠️</div>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: "var(--text-strong)" }}>技术支持</h3>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>tech@pricecre.com</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: "var(--text-strong)" }}>关注我们</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
            🌐 官网：<a href="https://pricecre.com" style={{ color: "var(--accent)" }}>pricecre.com</a>
          </span>
          <span style={{ fontSize: 14, color: "var(--text-muted)" }}>
            📱 微信公众号：PriceCRE 地产价值
          </span>
        </div>
      </div>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--text-hint)" }}>
        © 2026 PriceCRE. All rights reserved.
      </div>
    </div>
  );
}
