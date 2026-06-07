// app/api/ai/chat/route.ts — Asset AI Chat (session-based token consumption)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const apiKey = (process.env.ANTHROPIC_API_KEY || "").replace(/^"|"$/g, "");
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.ANTHROPIC_MODEL || "gpt-4o-mini";

  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json({ role: "assistant", content: "AI 服务未配置。" }, { status: 200 });
  }

  // Authenticate — session first, fallback to body email
  const session = await getServerSession(authOptions);
  let email = session?.user?.email || "";
  if (!email) {
    try {
      const body = await request.clone().json();
      email = body.email || "";
    } catch {}
    // Validate email is in DB
    if (!email) {
      return NextResponse.json({ role: "assistant", content: "请先登录以使用 AI 对话功能。" }, { status: 200 });
    }
  }

  try {
    const body = await request.json() as any;
    const { messages, property } = body;

    // Token consumption
    let token = await prisma.userChatToken.findUnique({ where: { email } });
    if (!token) {
      token = await prisma.userChatToken.create({ data: { email, tokens: 100, totalUsed: 0 } });
    }

    if (token.tokens <= 0) {
      return NextResponse.json({ role: "assistant", content: "您的 AI 对话额度已用完。请前往个人中心购买更多额度。" }, { status: 200 });
    }

    // Deduct one token
    await prisma.userChatToken.update({
      where: { email },
      data: { tokens: { decrement: 1 }, totalUsed: { increment: 1 } },
    });

    // Build system prompt from property data
    const systemPrompt = property
      ? `你是 PriceCRE 商业地产 AI 分析师。当前你正在分析以下资产：\n${JSON.stringify(property, null, 2)}\n请用专业、简洁的中文回答，重点分析租金水平、投资回报和商圈竞争力。`
      : "你是 PriceCRE 商业地产 AI 分析师。请用专业、简洁的中文回答用户关于商业地产的问题。";

    const allMessages = [{ role: "system", content: systemPrompt }, ...(messages || [])];

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages: allMessages, max_tokens: 2000 }),
    });

    if (!response.ok) {
      // Refund token on error
      await prisma.userChatToken.update({
        where: { email },
        data: { tokens: { increment: 1 }, totalUsed: { decrement: 1 } },
      });
      const errText = await response.text().catch(() => "");
      throw new Error(`AI API ${response.status}: ${errText.slice(0, 200)}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || "抱歉，AI 暂时无法生成回复。";

    return NextResponse.json({ role: "assistant", content });
  } catch (err: any) {
    console.error("[AI Chat Error]", err.message);
    return NextResponse.json({ role: "assistant", content: "AI 服务暂时不可用，请稍后重试。" }, { status: 200 });
  }
}
