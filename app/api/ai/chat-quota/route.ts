// app/api/ai/chat-quota/route.ts — Chat token management (session-authorized)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { adminAuth } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET — returns current user's quota (self only)
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ tokens: 0, totalUsed: 0 });
  }

  const token = await prisma.userChatToken.findUnique({ where: { email: session.user.email } });
  return NextResponse.json({ tokens: token?.tokens || 0, totalUsed: token?.totalUsed || 0 });
}

// POST — verify current user has quota (no cross-user access)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const token = await prisma.userChatToken.findUnique({ where: { email: session.user.email } });
  return NextResponse.json({
    ok: true,
    source: (token?.tokens || 0) > 0 ? "token" : "free",
    tokens: token?.tokens || 0,
  });
}

// PUT — admin operation: add/set tokens for a specific user
export async function PUT(request: NextRequest) {
  try {
    await adminAuth();

    const { email, addTokens, setTokens, note } = await request.json();
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    let token = await prisma.userChatToken.findUnique({ where: { email } });

    if (setTokens !== undefined) {
      token = await prisma.userChatToken.upsert({
        where: { email },
        create: { email, tokens: setTokens, totalUsed: 0 },
        update: { tokens: setTokens },
      });
    } else if (addTokens !== undefined) {
      token = await prisma.userChatToken.upsert({
        where: { email },
        create: { email, tokens: addTokens, totalUsed: 0 },
        update: { tokens: { increment: addTokens } },
      });
    }

    return NextResponse.json({ success: true, tokens: token?.tokens || 0 });
  } catch (err: any) {
    if (err?.status) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
