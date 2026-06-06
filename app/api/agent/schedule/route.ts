// app/api/agent/schedule/route.ts
// GET /api/agent/schedule — 列出所有计划
// POST /api/agent/schedule — 创建新计划
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    const jobs = await prisma.scheduledCrawlJob.findMany({
      orderBy: [{ scheduleHour: "asc" }, { scheduleMinute: "asc" }],
    });
    return NextResponse.json(jobs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { label, targetUrl, propertyType, city, district, scheduleHour, scheduleMinute } = body;
    if (!label || !targetUrl || !propertyType) {
      return NextResponse.json({ error: "label, targetUrl, propertyType 必填" }, { status: 400 });
    }
    const job = await prisma.scheduledCrawlJob.create({
      data: {
        label, targetUrl, propertyType,
        city: city ?? "shanghai",
        district: district ?? "pudong",
        scheduleHour: scheduleHour ?? 2,
        scheduleMinute: scheduleMinute ?? 0,
      },
    });
    return NextResponse.json(job, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
