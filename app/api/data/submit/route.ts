// POST /api/data/submit — 用户提报租金成交数据（进入审核队列）
// 存储：AgentReviewQueue（dataSource = USER_SUBMISSION），schema 无独立 Submission 表
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, netRent, email, city, propertyType, rentFree, attachmentUrl } = body;

    if (!projectName || !email) {
      return NextResponse.json({ error: "项目名称和邮箱不能为空" }, { status: 400 });
    }

    await prisma.agentReviewQueue.create({
      data: {
        id: randomUUID(),
        projectName,
        city: city || "",
        district: "",
        rawAddress: `${city || ""}${projectName}`,
        propertyType: ["OFFICE", "SHOPS", "INDUSTRIAL"].includes(propertyType) ? propertyType : "OFFICE",
        faceRent: parseFloat(netRent) || 0,
        dataSource: "USER_SUBMISSION",
        dynamicIndicators: {
          _submittedBy: email,
          _rentFree: rentFree || null,
          _attachmentUrl: attachmentUrl || null,
        },
        status: "PENDING_REVIEW",
        confidenceScore: 0.5,
        agentTimestamp: new Date(),
        auditLog: JSON.stringify([{ action: "USER_SUBMIT", operator: email, timestamp: new Date().toISOString() }]),
      },
    });

    return NextResponse.json({
      success: true,
      message: "提报已提交，审核通过后激活码将发送至您的邮箱",
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "提交失败" }, { status: 500 });
  }
}
