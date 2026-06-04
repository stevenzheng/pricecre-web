"use client";

import { useState, useEffect, useRef } from "react";
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [activeCity, setActiveCity] = useState<string>("上海");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (document.getElementById("leaflet-css2")) { setLoaded(true); return; }
    const link = document.createElement("link");
    link.id = "leaflet-css2";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || !(window as any).L) return;
    const L = (window as any).L;
    const center: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : cityCenter[activeCity] || [31.23, 121.47];

    if (!mapRef.current.firstChild) {
      const map = L.map(mapRef.current, { center, zoom: 13, zoomControl: true, attributionControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { maxZoom: 18 }).addTo(map);
      setTimeout(() => map.invalidateSize(), 200);

      const cityProps = mockProperties.filter((p) => p.city === activeCity);
      cityProps.forEach((p, i) => {
        const offset = 0.012;
        const lat = center[0] + Math.cos(i * 1.8) * offset * (i + 1);
        const lng = center[1] + Math.sin(i * 1.8) * offset * (i + 1);
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`<b>${p.projectName}</b><br/>挂牌租金面价 ¥${p.faceRent.toFixed(1)}/㎡/天`)
          .on("click", () => { setSelectedProperty(p.id); onSelectProperty?.(p.id); });
      });
    }
  }, [loaded, activeCity, userCoords]);

  const cityProps = mockProperties.filter((p) => p.city === activeCity);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto border-b" style={{ borderColor: "var(--line)" }}>
        {["全部", ...cityList].map((city) => (
          <button key={city} onClick={() => city !== "全部" && setActiveCity(city)} className={`chip text-[11px] ${activeCity === city ? "active" : ""}`}>{city}</button>
        ))}
      </div>
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: "300px", background: "#e8e8e8" }}>
        {!loaded && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        )}
      </div>
      {cityProps.length > 0 && (
        <div className="border-t" style={{ borderColor: "var(--line)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>{activeCity} · {cityProps.length} 资产</span>
          </div>
          <div className="px-4 pb-3 space-y-1.5">
            {cityProps.map((p) => (
              <div key={p.id} className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer ${selectedProperty === p.id ? "ring-1 bg-[var(--accent-soft)]" : "bg-[var(--panel)] hover:bg-[var(--bg-hover)]"}`}
                onClick={() => { setSelectedProperty(p.id); onSelectProperty?.(p.id); }}>
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                    {p.propertyType === "OFFICE" ? <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2"/></>
                    : p.propertyType === "SHOPS" ? <><path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9"/><path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9"/><path d="M9 22V12h6v10"/></>
                    : <><path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12"/><path d="M9 18h2M13 18h2"/></>}
                  </svg>
                  <div className="min-w-0"><div className="text-[13px] font-medium truncate" style={{ color: "var(--text-strong)" }}>{p.projectName}</div><div className="text-[10px]" style={{ color: "var(--text-hint)" }}>{p.district}</div></div>
                </div>
                <div className="text-right flex-shrink-0 ml-2"><div className="text-sm font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>¥{p.faceRent.toFixed(1)}</div><div className="text-[10px]" style={{ color: "var(--text-hint)" }}>/㎡/天</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
