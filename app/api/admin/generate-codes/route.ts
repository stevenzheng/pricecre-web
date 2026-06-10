// /api/admin/generate-codes — 生成兑换码（POST）+ 生成历史（GET）
// 历史记录持久化到 CreditAuditLog（type = "generate_code"），不再依赖浏览器 localStorage
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
    const { email, credits, type, label } = await req.json();
    if (!email) return NextResponse.json({ error: "邮箱必填" }, { status: 400 });

    const code = generateAuthCode(email);
    const amount = Number(credits) || 8;
    const codeType = type || "view";

    // 持久化生成记录（结构化 note，供 GET 历史与 redeem 按类型发放使用）
    await prisma.creditAuditLog.create({
      data: {
        email,
        type: "generate_code",
        amount,
        balance: 0,
        note: `CODE:${code}|TYPE:${codeType}|LABEL:${label || ""}|CREDITS:${amount}`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, code, credits: amount, type: codeType });
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
