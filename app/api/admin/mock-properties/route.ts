// GET /api/admin/mock-properties — serve mock data from server (no client-side dynamic import issues)
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const m = await import("@/lib/mock-data");
    const props = m.mockProperties.map((p: any) => ({
      id: String(p.id || ""),
      projectName: String(p.projectName || ""),
      city: String(p.city || ""),
      district: String(p.district || ""),
      propertyType: typeof p.propertyType === "number" ? ["OFFICE","SHOPS","INDUSTRIAL"][p.propertyType] || "OFFICE" : String(p.propertyType || "OFFICE"),
      faceRent: Number(p.faceRent) || 0,
      dataSource: String(p.dataSource || "mock"),
      confidenceScore: Number(p.confidenceScore) || 0.85,
      createdAt: String(p.createdAt || p.updatedAt || ""),
    }));
    return NextResponse.json({ properties: props });
  } catch {
    return NextResponse.json({ properties: [] });
  }
}
