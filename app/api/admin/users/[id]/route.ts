// app/api/admin/users/[id]/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { role } = await request.json();
    if (!role || !["USER", "ADMIN_DATA", "SUPER_ADMIN"].includes(role)) {
      return NextResponse.json({ error: "invalid role" }, { status: 400 });
    }
    await prisma.user.update({ where: { id: params.id }, data: { role } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
