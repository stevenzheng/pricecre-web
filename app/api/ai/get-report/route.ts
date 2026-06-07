// GET /api/ai/get-report?id=xxx — Get full report content (file-based)
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "ai-reports.json");

function readDB(): any[] {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")); } catch { return []; }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "缺少ID" }, { status: 400 });
  const all = readDB();
  const report = all.find((r: any) => r.id === id);
  if (!report) return NextResponse.json({ error: "报告不存在" }, { status: 404 });
  return NextResponse.json(report);
}
