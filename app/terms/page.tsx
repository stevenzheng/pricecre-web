export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-strong)" }}>服务条款</h1>
        <div className="space-y-5 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <p>PriceCRE 是商业地产量化精算资产终端。本平台数据来源于公开市场信息与用户提交，仅供信息参考，不构成任何投资、租赁或交易建议。</p>
          <p>查看高阶精算指标需消耗额度。额度可通过邀请好友注册或直接购买获得。已消耗额度不予退还。</p>
          <p>用户注册时需提供真实邮箱地址。本平台保留随时修改本条款的权利，修改后即生效。</p>
          <div className="pt-6">
            <a href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
}
