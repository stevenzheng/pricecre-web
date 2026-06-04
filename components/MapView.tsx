"use client";

import { useState, useEffect, useRef } from "react";
import { mockProperties, cityList } from "@/lib/mock-data";

const cityCenter: Record<string, [number, number]> = {
  "上海": [121.47, 31.23],
  "北京": [116.41, 39.90],
  "深圳": [114.06, 22.54],
  "苏州": [120.60, 31.30],
  "成都": [104.07, 30.57],
  "广州": [113.26, 23.13],
  "杭州": [120.15, 30.27],
  "长沙": [112.94, 28.23],
  "西安": [108.94, 34.26],
};

// Real district coordinates for accurate marker placement
const districtCoords: Record<string, [number, number]> = {
  // 上海
  "浦东新区": [121.55, 31.24], "静安区": [121.45, 31.23], "黄浦区": [121.48, 31.23],
  "徐汇区": [121.44, 31.19], "长宁区": [121.42, 31.22], "虹口区": [121.50, 31.26],
  "杨浦区": [121.52, 31.27], "普陀区": [121.40, 31.25], "闵行区": [121.38, 31.11], "松江区": [121.23, 31.03],
  // 北京
  "朝阳区": [116.45, 39.92], "海淀区": [116.30, 39.96], "西城区": [116.37, 39.91],
  "东城区": [116.42, 39.93], "丰台区": [116.29, 39.86], "大兴区": [116.34, 39.73],
  "通州区": [116.66, 39.90], "昌平区": [116.23, 40.22], "顺义区": [116.65, 40.13], "石景山区": [116.22, 39.91],
  // 深圳
  "南山区": [113.93, 22.53], "福田区": [114.05, 22.53], "罗湖区": [114.13, 22.55],
  "宝安区": [113.88, 22.57], "龙华区": [114.03, 22.65], "龙岗区": [114.25, 22.72],
  "光明区": [113.93, 22.75], "坪山区": [114.35, 22.69], "盐田区": [114.23, 22.56], "前海": [113.89, 22.51],
  // 苏州
  "苏州-工业园区": [120.73, 31.32], "苏州-姑苏区": [120.62, 31.31], "苏州-高新区": [120.57, 31.33],
  "吴中区": [120.63, 31.26], "相城区": [120.64, 31.41], "吴江区": [120.65, 31.14],
  "昆山市": [120.98, 31.38], "太仓市": [121.11, 31.46], "张家港市": [120.55, 31.88], "常熟市": [120.75, 31.65],
  // 成都
  "锦江区": [104.08, 30.66], "成都-高新区": [104.05, 30.59], "武侯区": [104.03, 30.63],
  "青羊区": [104.02, 30.67], "金牛区": [104.05, 30.70], "成华区": [104.10, 30.67],
  "天府新区": [104.06, 30.49], "双流区": [103.92, 30.57], "龙泉驿区": [104.27, 30.56], "温江区": [103.83, 30.70],
  // 广州
  "天河区": [113.32, 23.13], "越秀区": [113.27, 23.13], "海珠区": [113.32, 23.10],
  "荔湾区": [113.24, 23.12], "白云区": [113.27, 23.17], "番禺区": [113.36, 22.94],
  "黄埔区": [113.46, 23.11], "南沙区": [113.53, 22.80], "花都区": [113.22, 23.44], "增城区": [113.83, 23.29],
  // 杭州
  "上城区": [120.17, 30.25], "拱墅区": [120.14, 30.32], "西湖区": [120.13, 30.27],
  "滨江区": [120.20, 30.20], "余杭区": [119.98, 30.40], "萧山区": [120.26, 30.18],
  "钱塘区": [120.48, 30.31], "临平区": [120.30, 30.43], "富阳区": [119.95, 30.05], "临安区": [119.71, 30.24],
  // 长沙
  "芙蓉区": [113.04, 28.19], "天心区": [112.99, 28.13], "岳麓区": [112.93, 28.23],
  "开福区": [113.00, 28.24], "雨花区": [113.04, 28.14], "望城区": [112.82, 28.36],
  "长沙县": [113.08, 28.25], "宁乡市": [112.55, 28.28], "浏阳市": [113.64, 28.16],
  // 西安
  "雁塔区": [108.93, 34.21], "碑林区": [108.95, 34.24], "未央区": [108.94, 34.30],
  "莲湖区": [108.91, 34.26], "新城区": [108.97, 34.27], "长安区": [108.91, 34.16],
  "灞桥区": [109.07, 34.27], "高陵区": [109.09, 34.53], "临潼区": [109.22, 34.37], "西咸新区": [108.77, 34.26], "阎良区": [109.23, 34.66],
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
      const usedCoords = new Set<string>();
      cityProps.forEach((p, i) => {
        // Use district coordinates with jitter to avoid overlap
        const baseCoord = districtCoords[`${p.city}-${p.district}`] || districtCoords[p.district] || cityCenter[activeCity] || [39.90, 116.41];
        const jitter = 0.005;
        let lat = baseCoord[0] + (Math.random() - 0.5) * jitter;
        let lng = baseCoord[1] + (Math.random() - 0.5) * jitter;
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
        if (usedCoords.has(key)) {
          lat += (Math.random() - 0.5) * jitter * 2;
          lng += (Math.random() - 0.5) * jitter * 2;
        }
        usedCoords.add(`${lat.toFixed(4)},${lng.toFixed(4)}`);

        // Custom label icon with project name + rent
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="background:var(--bg-surface);border:1px solid var(--line);border-radius:8px;padding:3px 8px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:11px;cursor:pointer">
            <span style="font-weight:700;color:var(--text-strong)">${p.projectName}</span>
            <span style="margin-left:6px;font-family:var(--font-mono);font-weight:600;color:var(--accent)">¥${p.faceRent.toFixed(0)}</span>
            <span style="font-size:9px;color:var(--text-hint)">/㎡/天</span>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [0, 12],
        });

        L.marker([lat, lng], { icon: labelIcon })
          .addTo(map)
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
