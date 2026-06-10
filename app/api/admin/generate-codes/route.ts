// /api/admin/generate-codes — 生成兑换码（POST）+ 生成历史（GET）
// 每次生成的码都是随机且唯一的，存入 VerificationCode 表（key 前缀 redeem:），单次使用
// 历史记录持久化到 CreditAuditLog（type = "generate_code"）
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, redeemCodeEmailTemplate } from "@/lib/email";

export const dynamic = "force-dynamic";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 去除易混淆字符

function randomCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { email, credits, type, label } = await req.json();
    if (!email) return NextResponse.json({ error: "邮箱必填" }, { status: 400 });

    const amount = Number(credits) || 8;
    const codeType = type || "view";

    // 生成随机唯一码（key 唯一约束兜底，碰撞则重试）
    let code = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      code = randomCode();
      try {
        await prisma.verificationCode.create({
          data: {
            key: `redeem:${code}`,
            value: JSON.stringify({ email, type: codeType, credits: amount, label: label || "" }),
            expiresAt: new Date(Date.now() + 365 * 86400000), // 1年有效
          },
        });
        break;
      } catch {
        code = "";
      }
    }
    if (!code) return NextResponse.json({ error: "生成失败，请重试" }, { status: 500 });

    // 历史记录
    await prisma.creditAuditLog.create({
      data: {
        email,
        type: "generate_code",
        amount,
        balance: 0,
        note: `CODE:${code}|TYPE:${codeType}|LABEL:${label || ""}|CREDITS:${amount}`,
      },
    }).catch(() => {});

    // 邮件发送兑换码给用户
    const benefit =
      codeType === "ai200" ? `${amount} 条 AI 对话额度` :
      codeType === "monthly" ? "包月不限次查看权益" :
      `${amount} 次资产查看额度`;
    const sent = await sendEmail({
      to: email,
      subject: `PriceCRE 兑换码 · ${label || benefit}`,
      html: redeemCodeEmailTemplate(code, `${benefit}待激活`),
    });

    return NextResponse.json({ success: true, code, credits: amount, type: codeType, emailSent: sent.success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET — 兑换码生成历史（最近 200 条）
export async function GET() {
  try {
    const logs = await prisma.creditAuditLog.findMany({
      where: { type: "generate_code" },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const records = logs.map((l) => {
      const note = l.note || "";
      const get = (k: string) => (note.match(new RegExp(`${k}:([^|]*)`)) || [])[1] || "";
      return {
        id: l.id,
        code: get("CODE"),
        email: l.email,
        credits: l.amount,
        type: get("LABEL") || get("TYPE") || "查看额度",
        createdAt: l.createdAt,
      };
    });
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ records: [] });
  }
}
