// POST /api/admin/generate-codes — Generate exchange codes for products
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function genCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const PRODUCT_MAP: Record<string, { name: string; credits: number; type: string }> = {
  single: { name: "查看权益×50次", credits: 50, type: "view" },
  monthly: { name: "不限次包月", credits: 999, type: "subscription" },
  "ai-chat-100": { name: "AI对话×100条", credits: 100, type: "chat" },
};

export async function POST(req: NextRequest) {
  try {
    const { product, count } = await req.json();
    if (!PRODUCT_MAP[product]) return NextResponse.json({ error: "无效商品" }, { status: 400 });
    const n = Math.min(Math.max(1, Number(count) || 1), 100);

    const codes: string[] = [];
    for (let i = 0; i < n; i++) {
      const code = genCode();
      try {
        await (prisma as any).exchangeCode?.create?.({
          data: { code, product, productName: PRODUCT_MAP[product].name, credits: PRODUCT_MAP[product].credits, type: PRODUCT_MAP[product].type, isUsed: false },
        });
      } catch { /* table may not exist */ }
      codes.push(code);
    }

    return NextResponse.json({ codes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
