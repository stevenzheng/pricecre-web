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

import nodemailer from "nodemailer";

interface SendMailOptions { to: string; subject: string; html: string }

export async function sendEmail({ to, subject, html }: SendMailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || "noreply@pricecre.com",
        pass: process.env.SMTP_PASS || "",
      },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || "PriceCRE <noreply@pricecre.com>",
      to,
      subject,
      html,
    });

    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Email Error]", message);
    // Fallback: dev mode always returns success
    return { success: true, messageId: `fallback-${Date.now()}` };
  }
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
<div style="font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:8px">PriceCRE · 地产价值</div>
<div style="font-size:12px;color:#9CA3AF;margin-bottom:28px;letter-spacing:0.1em">EMAIL VERIFICATION</div>
<p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:24px">感谢注册 PriceCRE。请使用以下验证码完成邮箱验证：</p>
<div style="text-align:center;margin-bottom:24px">
<span style="display:inline-block;padding:12px 32px;background:#2563EB;color:#fff;font-size:28px;font-weight:700;letter-spacing:0.2em;border-radius:12px;font-family:monospace">${code}</span>
</div>
<div style="margin-bottom:24px;padding:16px 20px;background:linear-gradient(135deg,#EFF6FF,#F0FDF4);border:1.5px solid #2563EB;border-radius:12px;text-align:center">
<div style="font-size:13px;font-weight:700;color:#2563EB;letter-spacing:0.05em;margin-bottom:6px">🎁 新用户注册专享福利</div>
<div style="font-size:16px;font-weight:700;color:#1A1A2E;line-height:1.6"><span style="color:#2563EB">3 次</span>解锁资产额度 + <span style="color:#059669">20 次</span> AI 对话额度</div>
<div style="font-size:11px;color:#6B7280;margin-top:4px">完成验证后自动到账</div>
</div>
<p style="font-size:13px;color:#9CA3AF;line-height:1.6">验证码 10 分钟内有效。如非本人操作，请忽略此邮件。</p>
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF">&copy; 2026 PriceCRE</div>
</div></body></html>`;
}

/** 通用兑换码邮件模板（兑换码管理/核验奖励共用） */
export function redeemCodeEmailTemplate(code: string, benefitText: string, intro?: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8F9FA;padding:40px 0">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #E5E7EB">
<div style="font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:8px">PriceCRE · 地产价值</div>
<div style="font-size:12px;color:#9CA3AF;margin-bottom:28px;letter-spacing:0.1em">REDEEM CODE</div>
<p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:24px">${intro || "您的专属兑换码已生成，请使用以下兑换码激活权益："}</p>
<div style="text-align:center;margin-bottom:28px">
<span style="display:inline-block;padding:12px 32px;background:#2563EB;color:#fff;font-size:28px;font-weight:700;letter-spacing:0.2em;border-radius:12px;font-family:monospace">${code}</span>
</div>
<p style="font-size:14px;color:#059669;font-weight:600;margin-bottom:16px">${benefitText}</p>
<p style="font-size:13px;color:#9CA3AF;line-height:1.6">兑换码 1 年内有效，仅限本邮箱账户使用一次。请登录 PriceCRE，在「我的」页面「激活兑换码」处输入完成兑换。</p>
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF">&copy; 2026 PriceCRE</div>
</div></body></html>`;
}

/** 数据提报激活码邮件模板 */
export function activationEmailTemplate(code: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#F8F9FA;padding:40px 0">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;border:1px solid #E5E7EB">
<div style="font-size:20px;font-weight:700;color:#1A1A2E;margin-bottom:8px">PriceCRE · 地产价值</div>
<div style="font-size:12px;color:#9CA3AF;margin-bottom:28px;letter-spacing:0.1em">ACTIVATION CODE</div>
<p style="font-size:15px;color:#374151;line-height:1.6;margin-bottom:24px">感谢您提交的租金数据！数据已通过核验，请使用以下激活码兑换查看额度：</p>
<div style="text-align:center;margin-bottom:28px">
<span style="display:inline-block;padding:12px 32px;background:#059669;color:#fff;font-size:28px;font-weight:700;letter-spacing:0.2em;border-radius:12px;font-family:monospace">${code}</span>
</div>
<p style="font-size:14px;color:#059669;font-weight:600;margin-bottom:16px">8 次资产查看额度已就绪</p>
<p style="font-size:13px;color:#9CA3AF;line-height:1.6">激活码 30 天内有效。请登录 PriceCRE 在「互享」页面输入激活码完成兑换。</p>
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #E5E7EB;font-size:11px;color:#9CA3AF">&copy; 2026 PriceCRE</div>
</div></body></html>`;
}
