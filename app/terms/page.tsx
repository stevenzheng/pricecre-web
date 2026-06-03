export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8" style={{ color: "var(--text-strong)" }}>服务条款</h1>
        <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>1. 服务说明</h2>
            <p>PriceCRE（以下简称"本平台"）是商业地产量化精算资产终端，为用户提供商业地产租金数据、精算指标及市场分析服务。本平台数据来源于公开市场信息、行业机构数据汇总及用户自愿提交，仅供信息参考。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>2. 数据免责</h2>
            <p>本平台展示的所有商业地产租金及精算指标数据不构成任何投资建议、租赁建议或交易建议。用户基于本平台数据作出的任何决策，风险自担。本平台不对数据的完整性、准确性或时效性作任何明示或默示的保证。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>3. 用户注册</h2>
            <p>用户注册时需提供真实有效的邮箱地址。用户应对其账户安全负责，不得将账户转让或授权他人使用。本平台有权在发现异常注册行为时暂停或终止相关账户。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>4. 额度使用</h2>
            <p>查看高阶精算指标需消耗额度。额度可通过邀请好友注册、直接购买或参与平台活动获得。已消耗的额度不予退还。VIP 订阅用户在有效期内可无限次查看指标数据。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>5. 知识产权</h2>
            <p>本平台的所有内容，包括但不限于文字、图表、数据、界面设计、软件源代码，均受知识产权法律保护。未经本平台书面许可，任何单位和个人不得以任何形式复制、转载或用于商业用途。</p>
          </section>
          <section>
            <h2 className="text-base font-semibold mb-2" style={{ color: "var(--text-strong)" }}>6. 条款变更</h2>
            <p>本平台保留随时修改本服务条款的权利。修改后的条款将在本页面发布后立即生效。用户继续使用本平台服务即视为接受修改后的条款。上次更新日期：2026年6月3日。</p>
          </section>
          <div className="pt-6">
            <a href="/" className="text-sm font-medium" style={{ color: "var(--accent)" }}>← 返回首页</a>
          </div>
        </div>
      </div>
    </div>
  );
}
