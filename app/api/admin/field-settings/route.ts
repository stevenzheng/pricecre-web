// app/api/admin/field-settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/admin-auth";

export async function GET(request: Request) {
  try {
    await adminAuth();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "OFFICE";
    const fields = await prisma.fieldMetadata.findMany({
      where: { moduleType: type as any },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ fields });
  } catch (err: any) {
    if (err?.status) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await adminAuth();
    const body = await request.json();
    const fields: any[] = body.fields || [];
    const moduleType = (body.moduleType || "OFFICE") as any;

    // Upsert each field to persist label, active state, etc.
    for (const f of fields) {
      await prisma.fieldMetadata.upsert({
        where: { fieldKey_moduleType: { fieldKey: f.key, moduleType } },
        create: {
          fieldKey: f.key,
          fieldName: f.label,
          fieldType: f.format || "text",
          moduleType,
          isDisplayed: f.isActive,
          isLocked: f.isPremium ?? true,
          sortOrder: 0,
        },
        update: {
          fieldName: f.label,
          isDisplayed: f.isActive,
          isLocked: f.isPremium ?? true,
        },
      });
    }

    return NextResponse.json({ success: true, count: fields.length });
  } catch (err: any) {
    if (err?.status) return err;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
