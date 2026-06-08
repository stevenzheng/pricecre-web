// POST /api/admin/generate-codes — Generate activation code for a user
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

function generateAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  const hash = createHash("sha256").update(`${email}:${secret}:activate`).digest("hex");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[parseInt(hash.slice(i*2,i*2+2),16) % chars.length];
  return code;
}

export async function POST(req: NextRequest) {
  try {
    const { email, credits } = await req.json();
    if (!email) return NextResponse.json({ error: "邮箱必填" }, { status: 400 });

    const code = generateAuthCode(email);

    // Log to audit
    await prisma.creditAuditLog.create({
      data: {
        email,
        type: "add_credits",
        amount: credits || 8,
        balance: 0,
        note: `管理后台生成激活码: ${code} · 互享额度+${credits || 8}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, code, credits: credits || 8 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
