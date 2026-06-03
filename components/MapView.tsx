"use client";

import { useState } from "react";
import { mockProperties, cityList } from "@/lib/mock-data";

const cityCenter: Record<string, [number, number]> = {
  "上海": [121.47, 31.23],
  "北京": [116.41, 39.90],
  "深圳": [114.06, 22.54],
  "苏州": [120.60, 31.30],
  "成都": [104.07, 30.57],
};

interface MapViewProps { onSelectProperty?: (id: string) => void; userCoords?: { lat: number; lng: number } | null }

export default function MapView({ onSelectProperty, userCoords }: MapViewProps) {
  const [activeCity, setActiveCity] = useState<string>("上海");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  const center = userCoords ? [userCoords.lat, userCoords.lng] : cityCenter[activeCity] || [31.23, 121.47];
  const cityProps = mockProperties.filter((p) => p.city === activeCity);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto border-b" style={{ borderColor: "var(--line)" }}>
        {["全部", ...cityList].map((city) => (
          <button
            key={city}
            onClick={() => city !== "全部" && setActiveCity(city)}
            className={`chip text-[11px] ${activeCity === city ? "active" : ""}`}
          >
            {city}
          </button>
        ))}
      </div>

      {/* Map iframe - using OpenStreetMap free tiles */}
      <div className="flex-1 w-full" style={{ minHeight: "320px", position: "relative" }}>
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${center[1]-0.1},${center[0]-0.1},${center[1]+0.1},${center[0]+0.1}&layer=mapnik&marker=${center[0]},${center[1]}`}
          style={{ width: "100%", height: "100%", border: "none" }}
          title="地图"
        />
      </div>

      {cityProps.length > 0 && (
        <div className="border-t" style={{ borderColor: "var(--line)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{activeCity} · {cityProps.length} 资产</span>
          </div>
          <div className="px-4 pb-3 space-y-1.5">
            {cityProps.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer ${
                  selectedProperty === p.id ? "ring-1 bg-[var(--accent-soft)]" : "bg-[var(--panel)] hover:bg-[var(--bg-hover)]"
                }`}
                onClick={() => { setSelectedProperty(p.id); onSelectProperty?.(p.id); }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {p.propertyType === "OFFICE" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2"/></svg>
                  ) : p.propertyType === "SHOPS" ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9"/><path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9"/><path d="M9 22V12h6v10"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12"/><path d="M9 18h2M13 18h2"/></svg>
                  )}
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate" style={{ color: "var(--text-strong)" }}>{p.projectName}</div>
                    <div className="text-[10px]" style={{ color: "var(--text-hint)" }}>{p.district}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>¥{p.faceRent.toFixed(1)}</div>
                  <div className="text-[10px]" style={{ color: "var(--text-hint)" }}>/㎡/天</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
