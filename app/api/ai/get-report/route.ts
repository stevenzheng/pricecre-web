// GET /api/ai/get-report?id=xxx — Get full report content
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });

  try {
    const { prisma } = await import("@/lib/prisma").catch(() => ({ prisma: null }));
    if (!prisma) {
      return NextResponse.json({ id, projectName: "", city: "", createdAt: "", content: "", summary: "" });
    }

    const r = await prisma.aiAnalysisCache.findUnique({ where: { id } }).catch(() => null);
    if (!r) {
      return NextResponse.json({ id, projectName: "", city: "", createdAt: "", content: "", summary: "" });
    }

    const a = (r.analysisData as any) || {};
    const toText = (v: any) => v == null ? "" : typeof v === "string" ? v : (() => { try { return JSON.stringify(v); } catch { return String(v); } })();
    // content 兼容两种存储格式：save-report 的 content，analysis-cache 的 conclusion(+positives/negatives)
    let content = toText(a.content);
    if (!content && a.conclusion) {
      const pos = Array.isArray(a.positives) ? a.positives.map((p: any) => `+ ${toText(p)}`).join("\n") : "";
      const neg = Array.isArray(a.negatives) ? a.negatives.map((n: any) => `- ${toText(n)}`).join("\n") : "";
      content = [a.score !== undefined ? `综合评分：${a.score}/100` : "", pos && `【利好因素】\n${pos}`, neg && `【风险提示】\n${neg}`, `【结论】\n${toText(a.conclusion)}`].filter(Boolean).join("\n\n");
    }
    return NextResponse.json({
      id: r.id,
      projectName: toText(r.projectName),
      city: toText(r.city),
      createdAt: r.createdAt,
      content,
      summary: toText(a.summary),
    });
  } catch {
    return NextResponse.json({ id, projectName: "", city: "", createdAt: "", content: "", summary: "" });
  }
}
