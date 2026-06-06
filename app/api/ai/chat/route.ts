// app/api/ai/chat/route.ts — Asset AI Chat (server-side token consumption)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let apiKey = (process.env.ANTHROPIC_API_KEY || "").replace(/^"|"$/g, "");
  const baseUrl = (process.env.ANTHROPIC_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.ANTHROPIC_MODEL || "gpt-4o-mini";

  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json({ role: "assistant", content: "AI 服务未配置。" }, { status: 200 });
  }

  try {
    const body = await request.json() as any;
    const { messages, property, email } = body;

    // Server-side token consumption
    if (email) {
      let token = await prisma.userChatToken.findUnique({ where: { email } });
      if (!token) {
        // New user: give default 100 tokens
        token = await prisma.userChatToken.create({ data: { email, tokens: 100, totalUsed: 0 } });
      }

      const remaining = token.tokens - token.totalUsed;
      if (remaining <= 0) {
        return NextResponse.json({ role: "assistant", content: "您的 AI 对话额度已用完，请联系管理员或购买额度。" }, { status: 200 });
      }

      // Consume 1 token
      await prisma.userChatToken.update({
        where: { email },
        data: { totalUsed: { increment: 1 } },
      });

      // Audit log
      await prisma.creditAuditLog.create({
        data: {
          email,
          type: "consume_chat",
          amount: -1,
          balance: token.tokens - token.totalUsed - 1,
          note: `AI对话消费`,
        },
      });
    }

    const indicators = (property?.indicators || []).filter((i: any) => i.value && i.value !== "undefined" && i.value !== "null");
    const kv = indicators.map((i: any) => `- ${i.label}: ${i.value}`).join("\n");

    const systemPrompt = `你是 PriceCRE 商业地产平台的 AI 助理，正在与用户讨论「${property?.projectName || "某项目"}」这一资产。

## 关于这个资产的真实信息
项目名称：${property?.projectName || "未知"}
位置：${property?.city} · ${property?.district}
业态：${property?.propertyType || "写字楼"}
挂牌租金面价：¥${property?.faceRent || 0}/㎡/天

量化指标数据：
${kv || "暂无更多指标数据"}

## 行为准则
- 用自然、亲切的语气对话，像一位专业的朋友在聊天
- 回答问题时，结合上述真实数据进行分析，但不局限于这些数据——你作为大模型，可以补充行业常识和市场趋势
- 如果你需要加粗某个关键词，用 **关键内容** 格式包裹
- 每次回答控制在合理篇幅，避免冗长
- 在涉及投资决策时，温和提醒用户进行独立判断
- 如果用户问的问题超出你的知识范围，诚实告知，但可以尝试提供相关的分析视角`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: apiMessages, temperature: 0.7, max_tokens: 800, stream: false }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      return NextResponse.json({ role: "assistant", content: `AI 响应异常 (${response.status})${errText ? "：" + errText.substring(0, 100) : ""}` }, { status: 200 });
    }

    const data = await response.json() as any;
    const content = data.choices?.[0]?.message?.content || data.reply || "未能获取分析结果。";

    return NextResponse.json({ role: "assistant", content });
  } catch (err: any) {
    return NextResponse.json({ role: "assistant", content: `请求失败：${err.message?.substring(0, 60) || "未知错误"}` }, { status: 200 });
  }
}
