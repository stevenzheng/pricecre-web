/**
 * POST /api/data/submit
 * 
 * 接收数据提报 → 生成激活码 → 发送邮件 → 存储激活码
 */
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, generateVerificationCode, activationEmailTemplate } from "@/lib/email";
import { setActivationCode } from "@/lib/codeStore";

function generateCode(): string {
  // Generate 6-char alphanumeric activation code
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { projectName, netRent, email } = await req.json();

    if (!projectName || !email) {
      return NextResponse.json({ error: "项目名称和邮箱不能为空" }, { status: 400 });
    }

    // Generate activation code
    const code = generateCode();
    setActivationCode(code, 8);

    // Send activation email
    await sendEmail({
      to: email,
      subject: "PriceCRE 数据核验通过 · 激活码",
      html: activationEmailTemplate(code),
    });

    return NextResponse.json({
      success: true,
      code,
      message: `激活码已发送至 ${email}`,
    });
  } catch (err: unknown) {
    console.error("[Submit Error]", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "提交失败" }, { status: 500 });
  }
}
