// app/api/admin/user-credits/route.ts — Admin credit management (DB-backed)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function writeLog(email: string, type: string, amount: number, balance: number, adminEmail?: string, note?: string) {
  await prisma.creditAuditLog.create({
    data: { email, type, amount, balance, adminEmail: adminEmail || null, note: note || null },
  });
}

// GET — query user credits
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "";
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  let uc = await prisma.userCredit.findUnique({ where: { email } });
  if (!uc) {
    // 从 legacy User 迁移初始值
    const user = await prisma.user.findUnique({ where: { email }, select: { referralViewCount: true, purchasedViewCount: true } });
    const referralVal = user?.referralViewCount ?? 10;
    const purchasedVal = user?.purchasedViewCount ?? 0;
    uc = await prisma.userCredit.create({ data: { email, referralCredits: referralVal, purchasedCredits: purchasedVal, totalUsed: 0 } });
  }

  return NextResponse.json({
    email: uc.email,
    referralCredits: uc.referralCredits,
    purchasedCredits: uc.purchasedCredits,
    totalUsed: uc.totalUsed,
    total: uc.referralCredits + uc.purchasedCredits,
  });
}

// POST — add/set credits
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, addCredits, setCredits, note, adminEmail } = body;
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    let uc = await prisma.userCredit.findUnique({ where: { email } });
    if (!uc) {
      const user = await prisma.user.findUnique({ where: { email }, select: { referralViewCount: true, purchasedViewCount: true } });
      const referralVal = user?.referralViewCount ?? 10;
      const purchasedVal = user?.purchasedViewCount ?? 0;
      uc = await prisma.userCredit.create({ data: { email, referralCredits: referralVal, purchasedCredits: purchasedVal } });
    }

    if (setCredits != null) {
      const oldTotal = uc.referralCredits + uc.purchasedCredits;
      const delta = setCredits - oldTotal;
      await prisma.userCredit.update({ where: { email }, data: { purchasedCredits: Math.max(0, setCredits - uc.referralCredits) } });
      await writeLog(email, "set_credits", delta, setCredits, adminEmail, note);
    } else if (addCredits) {
      await prisma.userCredit.update({ where: { email }, data: { purchasedCredits: { increment: addCredits } } });
      const newTotal = uc.referralCredits + uc.purchasedCredits + addCredits;
      await writeLog(email, "add_credits", addCredits, newTotal, adminEmail, note);
    }

    uc = await prisma.userCredit.findUnique({ where: { email } })!;
    return NextResponse.json({ email: uc!.email, referralCredits: uc!.referralCredits, purchasedCredits: uc!.purchasedCredits, totalUsed: uc!.totalUsed, total: uc!.referralCredits + uc!.purchasedCredits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
