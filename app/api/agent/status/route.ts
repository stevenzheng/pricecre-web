// app/api/agent/status/route.ts
// GET /api/agent/status — 返回各城市×业态最后一次抓取状态
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CITIES = ["shanghai","beijing","shenzhen","guangzhou","hangzhou","chengdu","suzhou","changsha","xian"];
const TYPES = ["OFFICE","SHOPS","INDUSTRIAL"];
const CITY_ZH: Record<string,string> = { shanghai:"上海", beijing:"北京", shenzhen:"深圳", guangzhou:"广州", hangzhou:"杭州", chengdu:"成都", suzhou:"苏州", changsha:"长沙", xian:"西安" };
const TYPE_ZH: Record<string,string> = { OFFICE:"写字楼", SHOPS:"商铺", INDUSTRIAL:"产业园" };

export async function GET() {
  try {
    const cells: Array<{
      city: string; cityZh: string;
      type: string; typeZh: string;
      lastRunAt: string | null;
      lastCount: number;
      lastApproved: number;
    }> = [];

    for (const city of CITIES) {
      for (const type of TYPES) {
        // 从 agent_review_queue 查询最近一次
        const latest = await prisma.agentReviewQueue.findFirst({
          where: { city: CITY_ZH[city], propertyType: type as any },
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, status: true, confidenceScore: true },
        });

        // 从 scheduledCrawlJob 查最后运行状态（兼容旧数据）
        const job = await prisma.scheduledCrawlJob.findFirst({
          where: { city, propertyType: type },
          orderBy: { lastRunAt: "desc" },
          select: { lastRunAt: true, lastPipelineCount: true },
        });

        cells.push({
          city, cityZh: CITY_ZH[city],
          type, typeZh: TYPE_ZH[type],
          lastRunAt: job?.lastRunAt?.toISOString() || latest?.createdAt?.toISOString() || null,
          lastCount: job?.lastPipelineCount || 0,
          lastApproved: latest && latest.status === "APPROVED" ? 1 : 0,
        });
      }
    }

    // 汇总
    const totalCrawled = cells.reduce((s, c) => s + c.lastCount, 0);
    const totalApproved = cells.reduce((s, c) => s + c.lastApproved, 0);
    const neverRun = cells.filter((c) => !c.lastRunAt).length;
    const recentlyRun = cells.filter((c) => c.lastRunAt && Date.now() - new Date(c.lastRunAt).getTime() < 7 * 86400000).length;

    return NextResponse.json({
      cells,
      summary: { totalCrawled, totalApproved, neverRun, recentlyRun, total: cells.length },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
