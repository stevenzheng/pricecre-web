// GET/PUT /api/admin/property/[id] — Single property detail + update
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const m = await import("@/lib/mock-data");
    const p = m.mockProperties.find((x: any) => x.id === params.id);
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      id: p.id,
      projectName: p.projectName,
      city: p.city,
      district: p.district,
      propertyType: typeof p.propertyType === "number" ? ["OFFICE","SHOPS","INDUSTRIAL"][p.propertyType] : p.propertyType,
      faceRent: p.faceRent,
      dataSource: p.dataSource,
      confidenceScore: p.confidenceScore || 0.85,
      indicators: p.dynamicIndicators || {},
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // In production this would update the database.
  // For now, acknowledge success.
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, id: params.id });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
