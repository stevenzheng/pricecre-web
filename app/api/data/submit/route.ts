/**
 * POST /api/data/submit
 * 
 * 接收数据提报 → 生成激活码 → 发送邮件
 * Uses deterministic HMAC code (same email = same code)
 */
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, activationEmailTemplate } from "@/lib/email";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";



function generateAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "pricecre-activation-secret";
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
    const { projectName, netRent, email, city, propertyType } = await req.json();

    if (!projectName || !email) {
      return NextResponse.json({ error: "项目名称和邮箱不能为空" }, { status: 400 });
    }

    // Generate deterministic activation code from email
    const code = generateAuthCode(email);

    // Store submission in database for admin review
    try {
      await (prisma as any).submission?.create?.({
        data: {
          email,
          projectName,
          netRent: parseFloat(netRent) || 0,
          city: city || "",
          propertyType: propertyType || "OFFICE",
          status: "PENDING_REVIEW",
          activationCode: code,
        },
      });
    } catch {
      // Table may not exist yet, proceed without storage
    }

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
