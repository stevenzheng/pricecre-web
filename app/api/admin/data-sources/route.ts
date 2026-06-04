// app/api/admin/data-sources/route.ts
// GET — 列出所有数据源, POST — 创建
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  try {
    const where: any = {};
    if (type && type !== "all") where.sourceType = type;
    if (search) where.name = { contains: search, mode: "insensitive" };
    const sources = await prisma.dataSourceRegistry.findMany({
      where, orderBy: { priority: "desc" },
    });
    return NextResponse.json({ sources });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const source = await prisma.dataSourceRegistry.create({ data: body });
    return NextResponse.json(source, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
