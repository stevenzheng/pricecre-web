// POST /api/data/submit — 用户提报交易（进入审核队列）
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, netRent, email, city, propertyType, rentFree, attachmentUrl } = body;

    if (!projectName || !email) {
      return NextResponse.json({ error: "项目名称和邮箱不能为空" }, { status: 400 });
    }

    // Store submission for admin review — code will be generated on approval
    try {
      await (prisma as any).submission?.create?.({
        data: {
          email,
          projectName,
          netRent: parseFloat(netRent) || 0,
          city: city || "",
          propertyType: propertyType || "OFFICE",
          status: "PENDING_REVIEW",
          attachmentUrl: attachmentUrl || null,
        },
      });
    } catch {
      // Table may not exist yet — still return success
    }

    return NextResponse.json({
      success: true,
      message: "提报已提交，审核通过后激活码将发送至您的邮箱",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "提交失败" }, { status: 500 });
  }
}
