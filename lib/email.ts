/**
 * Hostinger 邮件发送模块
 *
 * 开发/测试环境：邮件内容输出到控制台
 * 生产环境：需安装 nodemailer 后使用 SMTP 发送
 *
 *   npm install nodemailer
 *
 * .env 配置：
 *   SMTP_HOST=smtp.hostinger.com
 *   SMTP_PORT=465
 *   SMTP_USER=noreply@pricecre.com
 *   SMTP_PASS=your_password
 *   SMTP_FROM=PriceCRE <noreply@pricecre.com>
 */

interface SendMailOptions { to: string; subject: string; html: string }

export async function sendEmail({ to, subject, html }: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  /* ---- 开发模式：输出到控制台 ---- */
  console.log("=".repeat(60));
  console.log(`[EMAIL] To: ${to}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${html.replace(/<[^>]+>/g, "").slice(0, 100)}...`);
  console.log("=".repeat(60));

  // 生产环境部署时取消注释以下代码：
  // import nodemailer from "nodemailer";
  // const transporter = nodemailer.createTransport({
  //   host: process.env.SMTP_HOST || "smtp.hostinger.com",
  //   port: Number(process.env.SMTP_PORT) || 465,
  //   secure: true,
  //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  // });
  // const info = await transporter.sendMail({
  //   from: process.env.SMTP_FROM || "PriceCRE <noreply@pricecre.com>",
  //   to, subject, html,
  // });
  // return { success: true, messageId: info.messageId };

  return { success: true, messageId: `dev-${Date.now()}` };
}

/** 生成 6 位数字验证码 */
export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** 注册验证邮件模板 */
export function verificationEmailTemplate(code: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8F9FA;padding:40px 0">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #E5E7EB">
<div style="font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:8px">PriceCRE</div>
<div style="font-size:12px;color:#9CA3AF;margin-bottom:28px;letter-spacing:0.1em">EMAIL VERIFICATION</div>
<p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:24px">感谢注册 PriceCRE。请使用以下验证码完成邮箱验证：</p>
<div style="text-align:center;margin-bottom:28px">
<span style="display:inline-block;padding:12px 32px;background:#2563EB;color:#fff;font-size:28px;font-weight:700;letter-spacing:0.2em;border-radius:12px;font-family:monospace">${code}</span>
</div>
<p style="font-size:13px;color:#9CA3AF;line-height:1.6">验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF">&copy; 2026 PriceCRE</div>
</div></body></html>`;
}
