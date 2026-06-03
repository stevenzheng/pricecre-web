"use client";

import React, { useEffect, useRef, useState } from "react";
import { mockProperties, propertyTypeLabels, cityList } from "@/lib/mock-data";

/* Approximate coordinates for demo cities (center) */
const cityCenter: Record<string, [number, number]> = {
  "上海": [121.4737, 31.2304],
  "北京": [116.4074, 39.9042],
  "深圳": [114.0579, 22.5431],
  "苏州": [120.5954, 31.2989],
  "成都": [104.0665, 30.5728],
};

interface MapViewProps { onSelectProperty?: (id: string) => void; userCoords?: { lat: number; lng: number } | null }

export default function MapView({ onSelectProperty, userCoords }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [activeCity, setActiveCity] = useState<string>("上海");
  const [loaded, setLoaded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  /* Load AMap script */
  useEffect(() => {
    if ((window as any).AMap) { setLoaded(true); return; }
    const key = "c3a6d9e8f7b5a4c3d2e1f0a9b8c7d6e5";
    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`;
    script.onload = () => setLoaded(true);
    script.onerror = () => setLoaded(false);
    document.head.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  /* Init / update map */
  useEffect(() => {
    if (!loaded || !mapRef.current || !(window as any).AMap) return;

    const AMap = (window as any).AMap;
    const userCenter = userCoords ? [userCoords.lng, userCoords.lat] : null;
    const center = userCenter || cityCenter[activeCity] || [121.47, 31.23];

    if (!mapInstance.current) {
      mapInstance.current = new AMap.Map(mapRef.current, {
        zoom: userCoords ? 14 : 12, center, resizeEnable: true,
        mapStyle: "amap://styles/dark",
      });
    } else {
      mapInstance.current.setZoomAndCenter(userCoords ? 14 : 12, center);
    }

    /* Clear old markers */
    mapInstance.current.clearMap();

    /* City properties */
    const cityProps = mockProperties.filter((p) => p.city === activeCity);
    cityProps.forEach((p, i) => {
      /* Spread markers slightly around city center so they're all visible */
      const offset = 0.015;
      const lng = center[0] + (Math.cos(i * 1.8) * offset * (i + 1));
      const lat = center[1] + (Math.sin(i * 1.8) * offset * (i + 1));

      const marker = new AMap.Marker({
        position: [lng, lat],
        title: p.projectName,
        label: {
          content: `<span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent)">¥${p.faceRent.toFixed(0)}</span>`,
          offset: new AMap.Pixel(0, -28),
        },
      });

      marker.on("click", () => setSelectedProperty(p.id));
      mapInstance.current.add(marker);
    });

    return () => {
      if (mapInstance.current) mapInstance.current.destroy?.();
      mapInstance.current = null;
    };
  }, [loaded, activeCity]);

  const cityProps = mockProperties.filter((p) => p.city === activeCity);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      {/* City Tabs */}
      <div className="flex items-center gap-1 px-3 py-2.5 overflow-x-auto border-b" style={{ borderColor: "var(--line)" }}>
        {["全部", ...cityList].map((city) => (
          <button
            key={city}
            onClick={() => city === "全部" ? setActiveCity("上海") : setActiveCity(city)}
            className={`chip text-[11px] ${activeCity === city || (city === "全部" && activeCity === "上海") ? "active" : ""}`}
          >
            {city === "全部" ? "全部" : city}
          </button>
        ))}
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: "280px" }}>
        {!loaded && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--panel)" }}>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>加载地图数据...</span>
            </div>
          </div>
        )}
      </div>

      {/* Property List Below Map */}
      {cityProps.length > 0 && (
        <div className="border-t" style={{ borderColor: "var(--line)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>
              {activeCity} · {cityProps.length} 资产
            </span>
            <span className="text-[9px] font-mono" style={{ color: "var(--text-hint)" }}>
              点击查看详情
            </span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {cityProps.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedProperty === p.id ? "ring-1" : ""
                }`}
                style={{
                  background: selectedProperty === p.id ? "var(--accent-soft)" : "var(--panel)",
                  borderColor: selectedProperty === p.id ? "var(--accent)" : "transparent",
                }}
                onClick={() => { setSelectedProperty(p.id); onSelectProperty?.(p.id); }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
                    {p.propertyType === "OFFICE" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2"/></svg>
              ) : p.propertyType === "SHOPS" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9"/><path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9"/><path d="M9 22V12h6v10"/></svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12"/><path d="M9 18h2M13 18h2"/></svg>
              )}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold truncate" style={{ color: "var(--text-strong)" }}>
                      {p.projectName}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--text-hint)" }}>{p.district}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-bold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>
                    ¥{p.faceRent.toFixed(1)}
                  </div>
                  <div className="text-[9px]" style={{ color: "var(--text-hint)" }}>/㎡/天</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
