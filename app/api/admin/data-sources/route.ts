import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const where: any = {};
  if (type && type !== "all") where.sourceType = type;
  const sources = await prisma.dataSourceRegistry.findMany({ where, orderBy: { priority: "desc" } });
  return NextResponse.json({ sources });
}

export async function POST(request: Request) {
  const source = await prisma.dataSourceRegistry.create({ data: await request.json() });
  return NextResponse.json(source, { status: 201 });
}
