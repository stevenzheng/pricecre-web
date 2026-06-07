// GET /api/ai/user-reports?email=xxx — List user's AI reports (file-based + Prisma)
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "ai-reports.json");

function readDB(): any[] {
  try { return JSON.parse(fs.readFileSync(DB_FILE, "utf-8")); } catch { return []; }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ reports: [] });

  try {
    const all = readDB();
    const reports = all.filter((r: any) => r.email === email).slice(0, 50);
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ reports: [] });
  }
}
