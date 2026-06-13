import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const API_KEY = process.env.ANTHROPIC_API_KEY || "";
const API_BASE = process.env.ANTHROPIC_BASE_URL || "https://mydamoxing.cn";
const MODEL = process.env.ANTHROPIC_MODEL || "MiniMax-M3";

interface AnalyzeRequest {
  email?: string;
  projectName: string;
  city: string;
  district: string;
  propertyType: string;
  faceRent: number;
  netEffectiveRent: number | null;
  indicators: { label: string; value: string; key: string }[];
}

function buildPrompt(data: AnalyzeRequest): string {
  const rent = data.netEffectiveRent ?? data.faceRent;
  const indicatorLines = data.indicators
    .map((i) => `- ${i.label} (${i.key}): ${i.value}`)
    .join("\n");

  return `你是一位资深商业地产精算分析师。请基于以下资产数据，生成一份平衡客观的分析报告。

资产信息：
- 项目名称：${data.projectName}
- 城市/区域：${data.city} · ${data.district}
- 物业类型：${data.propertyType}
- 挂牌面价：¥${data.faceRent}/㎡/天
- 净有效租金：${rent}/㎡/天

精算指标：
${indicatorLines}

请严格按以下 JSON 格式输出分析结果（只输出 JSON，不要其他文字）：
{
  "score": <0-100整数>,
  "positives": ["利好1", "利好2", ...],
  "negatives": ["风险1", ...],
  "conclusion": "<80-120字总结>"
}

分析原则：实事求是，数据支撑，风险具体。
评分参考：>=75优秀，50-74稳健，<50审慎。
使用中文输出。`;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();

    // Require login
    if (!body.email) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) {
      return NextResponse.json({ error: "用户不存在，请先注册" }, { status: 401 });
    }

    if (!body.projectName || !body.indicators?.length) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY 未配置" }, { status: 500 });
    }

    const prompt = buildPrompt(body);

    const response = await fetch(`${API_BASE}/v1/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        temperature: 0.3,
        system:
          "你是一个商业地产精算AI。你必须严格输出纯JSON，不包含任何解释文字、markdown代码块或前后缀。直接输出JSON对象。",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      return NextResponse.json(
        { error: `AI 服务暂时不可用 (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // MiniMax-M3 returns content as array: [thinking, text, ...]
    // Find the text-type block, skip thinking blocks
    const contentList = data.content || data.message?.content || [];
    const textBlock = Array.isArray(contentList)
      ? contentList.find((c: any) => c.type === "text")
      : null;
    const rawContent = textBlock?.text || "";

    if (!rawContent) {
      console.error("No text content in response:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "AI 返回内容为空" }, { status: 502 });
    }

    // Parse JSON from response — robust multi-stage extraction
    let parsed: any;
    const text = rawContent.trim();

    const tryParse = (s: string): boolean => {
      try {
        parsed = JSON.parse(s);
        return true;
      } catch {
        return false;
      }
    };

    // Stage 1: direct parse
    if (tryParse(text)) { /* ok */ }
    // Stage 2: extract from markdown code block
    else {
      const md = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (md && tryParse(md[1].trim())) { /* ok */ }
    }
    // Stage 3: find first { ... } block
    if (!parsed) {
      const objMatch = text.match(/\{[\s\S]*\}/);
      if (objMatch && tryParse(objMatch[0])) { /* ok */ }
    }
    // Stage 4: fix common AI JSON mistakes (trailing commas, unquoted keys)
    if (!parsed) {
      let fixed = text
        .replace(/,\s*}/g, "}")       // remove trailing commas
        .replace(/,\s*]/g, "]")       // remove trailing commas in arrays
        .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3'); // quote unquoted keys
      const objMatch = fixed.match(/\{[\s\S]*\}/);
      if (!objMatch || !tryParse(objMatch[0])) {
        return NextResponse.json(
          { error: "AI 返回格式异常" },
          { status: 502 }
        );
      }
    }

    if (!parsed) {
      return NextResponse.json(
        { error: "AI 返回格式异常" },
        { status: 502 }
      );
    }

    const result = {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 50)),
      positives: (parsed.positives || []).slice(0, 6),
      negatives: (parsed.negatives || []).slice(0, 4),
      conclusion: parsed.conclusion || "数据不足，无法生成有效分析。",
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("AI analyze error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }
}
