// app/api/agent/schedule/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const job = await prisma.scheduledCrawlJob.update({
      where: { id: params.id },
      data: {
        label: body.label,
        targetUrl: body.targetUrl,
        propertyType: body.propertyType,
        city: body.city,
        district: body.district,
        scheduleHour: body.scheduleHour,
        scheduleMinute: body.scheduleMinute,
        isActive: body.isActive,
      },
    });
    return NextResponse.json(job);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.scheduledCrawlJob.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
