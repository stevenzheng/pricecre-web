/**
 * POST /api/data/redeem
 *
 * 验证激活码 → 返回额度
 * Uses deterministic HMAC-based codes so no DB storage needed
 */
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function generateAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "pricecre-activation-secret";
  const hash = createHash("sha256").update(`${email}:${secret}:activate`).digest("hex");
  // Convert hex to uppercase alphanumeric (A-Z, 2-9, no 0/1 to avoid confusion)
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
      // Without email, can't verify - but allow the test-submit-generated code
      return NextResponse.json({ error: "请先登录以兑换激活码" }, { status: 400 });
    }

    const expectedCode = generateAuthCode(email);
    if (code.toUpperCase() !== expectedCode) {
      return NextResponse.json({ error: "激活码无效或与注册邮箱不匹配" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      credits: 8,
      message: "8 次查看额度已到账",
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "兑换失败" }, { status: 500 });
  }
}
