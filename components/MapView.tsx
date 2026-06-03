"use client";

import React, { useEffect, useRef, useState } from "react";
import { mockProperties, cityList } from "@/lib/mock-data";

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
  const [scriptReady, setScriptReady] = useState(false);

  /* Load Baidu Maps */
  useEffect(() => {
    if ((window as any).BMap) { setScriptReady(true); return; }
    const script = document.createElement("script");
    script.src = "https://api.map.baidu.com/getscript?v=3.0&ak=B8Yc5OGGfc12G5RMjzYGOFc05ZjRmXWO";
    script.onload = () => setScriptReady(true);
    script.onerror = () => setScriptReady(false);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  /* Init map */
  useEffect(() => {
    if (!scriptReady || !mapRef.current || !(window as any).BMap) return;
    if (mapInstance.current) { mapInstance.current.clearOverlays(); mapInstance.current.centerAndZoom(center, 14); setLoaded(true); return; }
    mapInstance.current = new BMap.Map(mapRef.current);
    mapInstance.current.centerAndZoom(center, 14);
    mapInstance.current.enableScrollWheelZoom();

    const BMap = (window as any).BMap;
    const userCenter = userCoords ? new BMap.Point(userCoords.lng, userCoords.lat) : null;
    const cityC = cityCenter[activeCity] || [121.47, 31.23];
    const center = userCenter || new BMap.Point(cityC[0], cityC[1]);

    );
      
      
    } else {
      
    }

    mapInstance.current.clearOverlays();

    // Add user location marker
    if (userCoords) {
      const userPoint = new BMap.Point(userCoords.lng, userCoords.lat);
      const userMarker = new BMap.Marker(userPoint);
      mapInstance.current.addOverlay(userMarker);
    }

    const cityProps = mockProperties.filter((p) => p.city === activeCity);
    cityProps.forEach((p, i) => {
      const offset = 0.015;
      const lng = cityC[0] + Math.cos(i * 1.8) * offset * (i + 1);
      const lat = cityC[1] + Math.sin(i * 1.8) * offset * (i + 1);
      const point = new BMap.Point(lng, lat);

      const label = new BMap.Label(`¥${p.faceRent.toFixed(0)}`, {
        position: point,
        offset: new BMap.Size(-25, -15),
      });
      label.setStyle({
        color: "var(--accent)",
        fontSize: "13px",
        fontWeight: "700",
        fontFamily: "var(--font-mono)",
        border: "none",
        background: "none",
        padding: "0",
      });
      mapInstance.current.addOverlay(label);

      const marker = new BMap.Marker(point);
      marker.addEventListener("click", () => {
        setSelectedProperty(p.id);
        onSelectProperty?.(p.id);
      });
      mapInstance.current.addOverlay(marker);
    });

    setLoaded(true);
  }, [scriptReady, activeCity, userCoords]);

  const cityProps = mockProperties.filter((p) => p.city === activeCity);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-1 px-3 py-2.5 overflow-x-auto border-b" style={{ borderColor: "var(--line)" }}>
        {["全部", ...cityList].map((city) => (
          <button
            key={city}
            onClick={() => city !== "全部" && setActiveCity(city)}
            className={`chip text-[11px] ${activeCity === city || (city === "全部" && activeCity === "上海") ? "active" : ""}`}
          >
            {city}
          </button>
        ))}
      </div>

      <div ref={mapRef} className="flex-1 w-full" style={{ minHeight: "320px", background: "#111" }}>
        {!loaded && (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "#1a1a2e" }}>
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>加载地图数据...</span>
            </div>
          </div>
        )}
      </div>

      {cityProps.length > 0 && (
        <div className="border-t" style={{ borderColor: "var(--line)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold" style={{ color: "var(--text-strong)" }}>{activeCity} · {cityProps.length} 资产</span>
          </div>
          <div className="px-4 pb-4 space-y-2">
            {cityProps.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                  selectedProperty === p.id ? "ring-1 bg-[var(--accent-soft)]" : "bg-[var(--panel)] hover:bg-[var(--bg-hover)]"
                }`}
                style={{ borderColor: selectedProperty === p.id ? "var(--accent)" : "transparent" }}
                onClick={() => { setSelectedProperty(p.id); onSelectProperty?.(p.id); }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
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
                  <div className="text-sm font-bold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>¥{p.faceRent.toFixed(1)}</div>
                  <div className="text-[12px]" style={{ color: "var(--text-hint)" }}>/㎡/天</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
