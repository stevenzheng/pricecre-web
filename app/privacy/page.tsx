export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-strong)" }}>隐私政策</h1>
        <div className="space-y-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>本平台收集用户的邮箱地址(注册所需)和经授权获取的微信 OpenID。</p>
          <p>用户数据存储在加密云数据库中，密码使用 bcrypt 哈希加密，不以明文存储。</p>
          <p>本平台不使用第三方追踪 Cookie。用户可随时联系平台删除个人账户信息。</p>
          <div className="pt-6">
            <a href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
}
