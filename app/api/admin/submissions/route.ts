/**
 * 租金核验队列（统一审核入口）
 * GET  — 列出审核队列（用户提报 USER_SUBMISSION + 抓取入队数据）
 * POST — 通过/驳回：
 *   用户提报通过 → 生成随机兑换码（8次查看额度，绑定提交人邮箱）+ 邮件发送
 *   抓取数据通过 → upsert 到 CommercialProperty 主表
 * 存储：AgentReviewQueue（schema 无独立 Submission 表，此前接口指向不存在的表导致整页失效）
 */
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail, redeemCodeEmailTemplate } from "@/lib/email";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomCode(): string {
  const bytes = randomBytes(6);
  let code = "";
  for (let i = 0; i < 6; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return code;
}

export async function GET() {
  try {
    const rows = await prisma.agentReviewQueue.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      submissions: rows.map((s) => {
        const di = (s.dynamicIndicators as any) || {};
        return {
          id: s.id,
          projectName: s.projectName,
          email: di._submittedBy || "",
          city: s.city,
          district: s.district,
          netRent: Number(s.faceRent),
          propertyType: s.propertyType,
          status: s.status,
          dataSource: s.dataSource,
          isUserSubmission: s.dataSource === "USER_SUBMISSION",
          confidenceScore: s.confidenceScore,
          createdAt: s.createdAt,
        };
      }),
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

    const item = await prisma.agentReviewQueue.findUnique({ where: { id: submissionId } });
    if (!item) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

    const di = (item.dynamicIndicators as any) || {};
    const isUserSubmission = item.dataSource === "USER_SUBMISSION";
    let emailSent = false;

    if (action === "APPROVED") {
      if (isUserSubmission && di._submittedBy) {
        // 用户提报：生成随机兑换码（绑定提交人邮箱，8 次查看额度）+ 邮件
        const email = di._submittedBy as string;
        let code = "";
        for (let attempt = 0; attempt < 5; attempt++) {
          code = randomCode();
          try {
            await prisma.verificationCode.create({
              data: {
                key: `redeem:${code}`,
                value: JSON.stringify({ email, type: "view", credits: 8, label: "数据提报奖励" }),
                expiresAt: new Date(Date.now() + 365 * 86400000),
              },
            });
            break;
          } catch { code = ""; }
        }
        if (code) {
          await prisma.creditAuditLog.create({
            data: { email, type: "generate_code", amount: 8, balance: 0, note: `CODE:${code}|TYPE:view|LABEL:数据提报奖励|CREDITS:8` },
          }).catch(() => {});
          const sent = await sendEmail({
            to: email,
            subject: "PriceCRE 数据核验通过 · 兑换码已就绪",
            html: redeemCodeEmailTemplate(code, "8 次资产查看额度已就绪", "感谢您提交的租金数据！数据已通过核验，请使用以下兑换码领取奖励："),
          });
          emailSent = sent.success;
        }
      } else {
        // 抓取数据：通过 = 并入主资产表
        await prisma.commercialProperty.upsert({
          where: { projectName_rawAddress: { projectName: item.projectName, rawAddress: item.rawAddress } },
          create: {
            projectName: item.projectName,
            city: item.city,
            district: item.district,
            rawAddress: item.rawAddress,
            propertyType: item.propertyType,
            faceRent: item.faceRent,
            area: item.area,
            dataSource: item.dataSource,
            dynamicIndicators: item.dynamicIndicators as any,
            confidenceScore: item.confidenceScore,
            agentUpdatedAt: new Date(),
          },
          update: {
            faceRent: item.faceRent,
            area: item.area,
            dataSource: item.dataSource,
            dynamicIndicators: item.dynamicIndicators as any,
            confidenceScore: item.confidenceScore,
            agentUpdatedAt: new Date(),
          },
        }).catch(() => {});
      }
    }

    await prisma.agentReviewQueue.update({
      where: { id: submissionId },
      data: { status: action },
    });

    return NextResponse.json({ success: true, action, emailSent });
  } catch (err: any) {
    return NextResponse.json({ error: "操作失败：" + (err.message || "").slice(0, 100) }, { status: 500 });
  }
}
