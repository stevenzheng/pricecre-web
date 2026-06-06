// app/api/ai/chat-quota/route.ts — Chat token management (DB-backed)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — check remaining quota
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "anonymous";

  let token = await prisma.userChatToken.findUnique({ where: { email } });
  return NextResponse.json({ tokens: token?.tokens || 0, totalUsed: token?.totalUsed || 0 });
}

// POST — consume quota (client side already uses localStorage, this is server validation)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, assetId } = body;
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    // For now, just validate tokens exist — actual consumption tracked client-side
    let token = await prisma.userChatToken.findUnique({ where: { email } });
    const tokens = token?.tokens || 0;

    return NextResponse.json({ ok: true, source: tokens > 0 ? "token" : "free", tokens });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT — admin adds tokens
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, addTokens, setTokens, note, adminEmail } = body;
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    let token = await prisma.userChatToken.findUnique({ where: { email } });
    if (!token) token = await prisma.userChatToken.create({ data: { email, tokens: 100, totalUsed: 0 } });

    let newTokens = token.tokens;
    if (setTokens != null) {
      newTokens = setTokens;
      await prisma.userChatToken.update({ where: { email }, data: { tokens: newTokens } });
    } else if (addTokens) {
      newTokens = token.tokens + addTokens;
      await prisma.userChatToken.update({ where: { email }, data: { tokens: { increment: addTokens } } });
    }

    // Write audit log
    await prisma.creditAuditLog.create({
      data: { email, type: setTokens != null ? "set_tokens" : "add_tokens", amount: newTokens - token.tokens, balance: newTokens, adminEmail: adminEmail || null, note: note || null },
    });

    return NextResponse.json({ email, tokens: newTokens });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
