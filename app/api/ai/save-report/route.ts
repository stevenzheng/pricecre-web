// POST /api/ai/save-report — Save AI analysis report using AiAnalysisCache model
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  // 🔒 安全修复：添加鉴权检查（Issue #1 - P0-Security）
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { email, propertyId, projectName, city, district, propertyType, content, summary } = await req.json();
    
    // 🔒 安全修复：验证email与session一致，防止伪造他人身份
    if (email !== session.user.email) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!email || !propertyId || !content) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

    await prisma.aiAnalysisCache.create({
      data: {
        cacheKey: `${email}:${propertyId}:${Date.now()}`,
        projectName: projectName || "",
        city: city || "",
        district: district || "",
        propertyType: propertyType || "OFFICE",
        analysisData: {
          email, propertyId, summary: summary || "",
          content: typeof content === "string" ? content : JSON.stringify(content),
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("save-report error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
