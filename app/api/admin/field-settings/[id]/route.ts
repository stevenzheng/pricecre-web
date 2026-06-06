// app/api/admin/field-settings/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const field = await prisma.fieldMetadata.update({
      where: { id: params.id },
      data: {
        isDisplayed: body.isDisplayed,
        isLocked: body.isLocked,
        sortOrder: body.sortOrder,
      },
    });
    return NextResponse.json(field);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
