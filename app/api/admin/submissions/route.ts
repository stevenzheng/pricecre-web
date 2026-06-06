/**
 * GET /api/admin/submissions — list all submissions
 * POST /api/admin/submissions — approve/reject a submission
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, activationEmailTemplate } from "@/lib/email";
import { createHash } from "crypto";

function generateAuthCode(email: string): string {
  const secret = process.env.NEXTAUTH_SECRET || "pricecre-activation-secret";
  const hash = createHash("sha256").update(`${email}:${secret}:activate`).digest("hex");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[parseInt(hash.slice(i * 2, i * 2 + 2), 16) % chars.length];
  }
  return code;
}

export async function GET(request: NextRequest) {
  try {
    // Try the submissions table, fall back to an empty list
    let submissions: any[] = [];
    try {
      submissions = await (prisma as any).submission?.findMany?.({
        orderBy: { createdAt: "desc" },
        take: 50,
      }) || [];
    } catch {
      // Table doesn't exist, return empty
      return NextResponse.json({ submissions: [] });
    }

    return NextResponse.json({
      submissions: submissions.map((s: any) => ({
        id: s.id,
        projectName: s.projectName,
        email: s.email,
        city: s.city,
        netRent: s.netRent,
        propertyType: s.propertyType,
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch {
    return NextResponse.json({ submissions: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { submissionId, action } = await request.json();

    if (!submissionId || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ error: "无效操作" }, { status: 400 });
    }

    const submission = await (prisma as any).submission?.findUnique?.({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json({ error: "提交记录不存在" }, { status: 404 });
    }

    if (action === "APPROVED") {
      // Send activation email
      const code = generateAuthCode(submission.email);
      await sendEmail({
        to: submission.email,
        subject: "PriceCRE 数据核验通过 · 激活码已就绪",
        html: activationEmailTemplate(code),
      });
    }

    await (prisma as any).submission?.update?.({
      where: { id: submissionId },
      data: { status: action, reviewedAt: new Date() },
    });

    return NextResponse.json({ success: true, action });
  } catch (err: unknown) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}
