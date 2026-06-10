/**
 * POST /api/data/redeem
 *
 * 验证激活码 → 按管理后台生成时指定的类型发放：
 *   view*   → UserCredit.referralCredits（查看额度）
 *   monthly → UserCredit.referralCredits +999（包月近似实现）
 *   ai200   → UserChatToken.tokens（AI 对话额度）
 * 未找到生成记录时回退为 +8 次查看额度（兼容旧码）
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function generateAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  const hash = createHash("sha256").update(`${email}:${secret}:activate`).digest("hex");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    const idx = parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length;
    code += chars[idx];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { code, email } = await req.json();

    if (!code || typeof code !== "string" || code.length !== 6) {
      return NextResponse.json({ error: "无效的激活码，请输入6位字母数字码" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "请先登录以兑换激活码" }, { status: 400 });
    }

    const expectedCode = generateAuthCode(email);
    if (code.toUpperCase() !== expectedCode) {
      return NextResponse.json({ error: "激活码无效或与注册邮箱不匹配" }, { status: 400 });
    }

    // 防重复兑换：同一邮箱同一码只能兑换一次
    const already = await prisma.creditAuditLog.findFirst({
      where: { email, type: "redeem_code", note: { contains: `CODE:${code.toUpperCase()}` } },
    }).catch(() => null);
    if (already) {
      return NextResponse.json({ error: "该激活码已兑换过" }, { status: 400 });
    }

    // 读取生成记录，确定类型与额度
    const genLog = await prisma.creditAuditLog.findFirst({
      where: { email, type: "generate_code" },
      orderBy: { createdAt: "desc" },
    }).catch(() => null);

    const note = genLog?.note || "";
    const codeType = (note.match(/TYPE:([^|]*)/) || [])[1] || "view";
    const amount = genLog?.amount || 8;

    let message = "";
    let balance = 0;

    if (codeType === "ai200") {
      // AI 对话额度
      const tk = await prisma.userChatToken.upsert({
        where: { email },
        update: { tokens: { increment: amount } },
        create: { email, tokens: 100 + amount },
      });
      balance = tk.tokens;
      message = `${amount} 条 AI 对话额度已到账`;
    } else {
      // 查看额度（view10 / view50 / monthly）
      const uc = await prisma.userCredit.upsert({
        where: { email },
        update: { referralCredits: { increment: amount } },
        create: { email, referralCredits: 10 + amount, purchasedCredits: 0, totalUsed: 0 },
      });
      balance = (uc.referralCredits || 0) + (uc.purchasedCredits || 0);
      message = codeType === "monthly" ? "包月权益已开通（不限次查看）" : `${amount} 次查看额度已到账`;
    }

    // 兑换日志
    await prisma.creditAuditLog.create({
      data: {
        email,
        type: "redeem_code",
        amount,
        balance,
        note: `CODE:${code.toUpperCase()}|TYPE:${codeType}|激活码兑换成功`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, credits: amount, message });
  } catch (err: unknown) {
    return NextResponse.json({ error: "兑换失败" }, { status: 500 });
  }
}
