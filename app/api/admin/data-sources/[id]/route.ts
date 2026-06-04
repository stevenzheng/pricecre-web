// app/api/admin/data-sources/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const source = await prisma.dataSourceRegistry.update({ where: { id: params.id }, data: body });
    return NextResponse.json(source);
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.dataSourceRegistry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err: any) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
