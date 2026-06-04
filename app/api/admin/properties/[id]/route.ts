// app/api/admin/properties/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.commercialProperty.findUnique({ where: { id: params.id } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...item, faceRent: Number(item.faceRent) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const item = await prisma.commercialProperty.update({
      where: { id: params.id },
      data: {
        dynamicIndicators: body.dynamicIndicators,
        faceRent: body.faceRent,
        projectName: body.projectName,
        city: body.city,
        district: body.district,
        propertyType: body.propertyType,
        dataSource: body.dataSource,
      },
    });
    return NextResponse.json({ ...item, faceRent: Number(item.faceRent) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
