export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-strong)" }}>联系我们</h1>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <div className="p-5 rounded-xl space-y-3" style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }}>
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold" style={{ color: "var(--text-strong)" }}>📧 邮箱</span>
              <span>contact@pricecre.com</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-base font-semibold" style={{ color: "var(--text-strong)" }}>💬 微信公众号</span>
              <span>PriceCRE</span>
            </div>
          </div>
          <p>我们会在 1-2 个工作日内回复您的邮件。</p>
          <div className="pt-6">
            <a href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>← 返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
}
