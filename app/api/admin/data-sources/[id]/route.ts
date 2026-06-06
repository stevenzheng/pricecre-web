import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json();
  const source = await prisma.dataSourceRegistry.update({ where: { id: params.id }, data: body });
  return NextResponse.json(source);
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  await prisma.dataSourceRegistry.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
