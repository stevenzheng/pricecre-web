// POST /api/ai/save-report — Save AI analysis report (file-based + Prisma fallback)
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "ai-reports.json");

function readDB(): any[] {
  try {
    if (!fs.existsSync(DB_FILE)) return [];
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch { return []; }
}

function writeDB(records: any[]) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(records, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const { email, propertyId, projectName, city, content, summary } = await req.json();
    if (!email || !propertyId) return NextResponse.json({ error: "缺少参数" }, { status: 400 });

    const record = {
      id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email, propertyId, projectName, city,
      content: content || "", summary: summary || "",
      createdAt: new Date().toISOString(),
    };

    // Try Prisma first (silent fail if table doesn't exist)
    try {
      await (prisma as any).aIAnalysis?.create?.({ data: { ...record, createdAt: new Date() } });
    } catch {}

    // Always save to file-based DB as reliable fallback
    const db = readDB();
    db.unshift(record);
    if (db.length > 500) db.length = 500; // Keep max 500 records
    writeDB(db);

    return NextResponse.json({ success: true, id: record.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
