// GET /api/admin/ai-reports — Admin: list all AI reports (file-based)
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "ai-reports.json");

function readDB(): any[] {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")); } catch { return []; }
}

export async function GET(req: NextRequest) {
  const all = readDB();
  return NextResponse.json({ reports: all });
}
