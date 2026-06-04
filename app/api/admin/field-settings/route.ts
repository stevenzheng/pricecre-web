// app/api/admin/field-settings/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "OFFICE";
  try {
    const fields = await prisma.fieldMetadata.findMany({
      where: { moduleType: type as any },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ fields });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
