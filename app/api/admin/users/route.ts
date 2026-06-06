// app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, purchasedViewCount: true, referralViewCount: true, createdAt: true },
    });
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, password, role } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "email and password required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "用户已存在" }, { status: 409 });

    const { nanoid } = await import("nanoid");
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ 
      data: { email, password: hashed, role: role || "USER", myReferralCode: nanoid(8) },
      select: { id: true, email: true, role: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
