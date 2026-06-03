export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-strong)" }}>隐私政策</h1>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>1. 信息收集</h2>
            <p>本平台在注册环节收集用户的邮箱地址，在微信登录环节经用户授权后获取微信 OpenID 和用户头像信息。本平台不会主动收集用户的个人身份信息、位置信息或设备信息。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>2. 信息使用</h2>
            <p>用户提供的邮箱地址仅用于账户管理、额度变动通知及服务相关通信。用户的浏览行为数据仅用于平台功能优化和服务质量提升，不会与第三方分享可识别个人身份的信息。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>3. 信息存储</h2>
            <p>用户数据存储在 Supabase 云数据库中，采用加密传输和存储。用户密码使用 bcrypt 哈希加密，平台不会以明文形式存储任何密码信息。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>4. Cookie 使用</h2>
            <p>本平台使用必要的 Session Cookie 维持用户登录状态，使用本地存储（localStorage）保存用户的主题偏好设置。本平台不使用第三方追踪 Cookie。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>5. 用户权利</h2>
            <p>用户有权随时查询、更正或删除其个人账户信息。用户可通过联系平台客服提交数据删除请求，平台将在 7 个工作日内处理。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>6. 政策更新</h2>
            <p>本隐私政策可能不时更新，更新后的政策将在本页面发布后生效。上次更新日期：2026年6月3日。</p>
          </section>
          <div className="pt-6">
            <a href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>← 返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
}
