import { Metadata } from "next";

export const metadata: Metadata = {
  title: "服务条款 — PriceCRE · 地产价值",
  description: "PriceCRE 商业地产数据平台服务条款",
};

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px", fontFamily: "var(--font-sans)", color: "var(--text)", lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text-strong)", marginBottom: 8 }}>服务条款</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>最后更新：2026年6月5日</p>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>1. 用户登记与正式商业合作登记</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          通过官网主站 <strong>https://pricecre.com</strong> 注册和提交商业计划登记的用户，即表示同意授权 PriceCRE 
          商业业务运营部门使用您提交的联系、交流及业务需求信息进行主动联络、业务匹配和商业沟通。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>2. 用户责任与披露责任</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          在社区博客及互动区域发言讨论时，用户本人须对自己的陈述承担法律责任，不得虚构或恶意发布不实租赁、
          经营数据或敏感性内幕信息，不得造谣传谣，或以任何形式骚扰、威胁或侵犯他人合法权益。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>3. 中立性与内容</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          我们在社区建设的全链条中始终保持第三方的客观中立。发布的文章、分析及调研数据旨在提供行业信息概要，
          不构成任何投资、法律或税务建议。PriceCRE 不对因依赖本平台信息而产生的任何决策后果承担责任。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>4. 版权及知识产权</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          PriceCRE 平台原创性文章、数据分析、信息图表享有版权。未经书面许可，任何机构和个人不得转载、引用、
          翻译及用于商业范畴。用户上传的评论和内容授予 PriceCRE 非独家的全球永久使用权。
        </p>
      </section>

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: "var(--text-strong)" }}>5. 费用及会员权益</h2>
        <p style={{ fontSize: 14, color: "var(--text)", marginBottom: 8 }}>
          平台提供免费基础浏览与付费深度解锁相结合的服务模式。用户可通过提交真实租金数据、
          邀请好友注册等方式获取额度，也可直接购买查询权益（99元/50次）或包月不限次查看（299元/月）。
          所有费用支付后不支持退款，权益有效期自获取之日起180天内有效。
        </p>
      </section>

      <div style={{ marginTop: 40, paddingTop: 20, borderTop: "1px solid var(--line)", fontSize: 12, color: "var(--text-hint)" }}>
        © 2026 PriceCRE. All rights reserved.
      </div>
    </div>
  );
}
