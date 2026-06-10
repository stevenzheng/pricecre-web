"use client";

import { useState, useEffect, useRef } from "react";
import { cityList } from "@/lib/property-constants";
import "leaflet/dist/leaflet.css";

// Leaflet uses [lat, lng] order — all coords stored as [lat, lng]
const cityCenter: Record<string, [number, number]> = {
  "上海": [31.23, 121.47],
  "北京": [39.90, 116.41],
  "深圳": [22.54, 114.06],
  "苏州": [31.30, 120.60],
  "成都": [30.57, 104.07],
  "广州": [23.13, 113.26],
  "杭州": [30.27, 120.15],
  "长沙": [28.23, 112.94],
  "西安": [34.26, 108.94],
};

const districtCoords: Record<string, [number, number]> = {
  // 上海
  "浦东新区": [31.24, 121.55], "静安区": [31.23, 121.45], "黄浦区": [31.23, 121.48],
  "徐汇区": [31.19, 121.44], "长宁区": [31.22, 121.42], "虹口区": [31.26, 121.50],
  "杨浦区": [31.27, 121.52], "普陀区": [31.25, 121.40], "闵行区": [31.11, 121.38], "松江区": [31.03, 121.23],
  // 北京
  "朝阳区": [39.92, 116.45], "海淀区": [39.96, 116.30], "西城区": [39.91, 116.37],
  "东城区": [39.93, 116.42], "丰台区": [39.86, 116.29], "大兴区": [39.73, 116.34],
  "通州区": [39.90, 116.66], "昌平区": [40.22, 116.23], "顺义区": [40.13, 116.65], "石景山区": [39.91, 116.22],
  // 深圳
  "南山区": [22.53, 113.93], "福田区": [22.53, 114.05], "罗湖区": [22.55, 114.13],
  "宝安区": [22.57, 113.88], "龙华区": [22.65, 114.03], "龙岗区": [22.72, 114.25],
  "光明区": [22.75, 113.93], "坪山区": [22.69, 114.35], "盐田区": [22.56, 114.23], "前海": [22.51, 113.89],
  // 苏州
  "苏州-工业园区": [31.32, 120.73], "苏州-姑苏区": [31.31, 120.62], "苏州-高新区": [31.33, 120.57],
  "吴中区": [31.26, 120.63], "相城区": [31.41, 120.64], "吴江区": [31.14, 120.65],
  "昆山市": [31.38, 120.98], "太仓市": [31.46, 121.11], "张家港市": [31.88, 120.55], "常熟市": [31.65, 120.75],
  // 成都
  "锦江区": [30.66, 104.08], "成都-高新区": [30.59, 104.05], "武侯区": [30.63, 104.03],
  "青羊区": [30.67, 104.02], "金牛区": [30.70, 104.05], "成华区": [30.67, 104.10],
  "天府新区": [30.49, 104.06], "双流区": [30.57, 103.92], "龙泉驿区": [30.56, 104.27], "温江区": [30.70, 103.83],
  // 广州
  "天河区": [23.13, 113.32], "越秀区": [23.13, 113.27], "海珠区": [23.10, 113.32],
  "荔湾区": [23.12, 113.24], "白云区": [23.17, 113.27], "番禺区": [22.94, 113.36],
  "黄埔区": [23.11, 113.46], "南沙区": [22.80, 113.53], "花都区": [23.44, 113.22], "增城区": [23.29, 113.83],
  // 杭州
  "上城区": [30.25, 120.17], "拱墅区": [30.32, 120.14], "西湖区": [30.27, 120.13],
  "滨江区": [30.20, 120.20], "余杭区": [30.40, 119.98], "萧山区": [30.18, 120.26],
  "钱塘区": [30.31, 120.48], "临平区": [30.43, 120.30], "富阳区": [30.05, 119.95], "临安区": [30.24, 119.71],
  // 长沙
  "芙蓉区": [28.19, 113.04], "天心区": [28.13, 112.99], "岳麓区": [28.23, 112.93],
  "开福区": [28.24, 113.00], "雨花区": [28.14, 113.04], "望城区": [28.36, 112.82],
  "长沙县": [28.25, 113.08], "宁乡市": [28.28, 112.55], "浏阳市": [28.16, 113.64],
  // 西安
  "雁塔区": [34.21, 108.93], "碑林区": [34.24, 108.95], "未央区": [34.30, 108.94],
  "莲湖区": [34.26, 108.91], "新城区": [34.27, 108.97], "长安区": [34.16, 108.91],
  "灞桥区": [34.27, 109.07], "高陵区": [34.53, 109.09], "临潼区": [34.37, 109.22], "西咸新区": [34.26, 108.77], "阎良区": [34.66, 109.23],
};

// Precise coordinates for known properties (projectName → [lat, lng])
const propertyCoords: Record<string, [number, number]> = {
  "上海中心大厦": [31.235, 121.501],
  "上海环球金融中心": [31.237, 121.503],
  "金茂大厦": [31.237, 121.502],
  "上海国金中心": [31.236, 121.501],
  "恒隆广场": [31.230, 121.451],
  "上海来福士广场": [31.233, 121.477],
  "港汇恒隆广场": [31.195, 121.437],
  "上海嘉里中心": [31.226, 121.450],
  "上海太平金融大厦": [31.237, 121.504],
  "上海东亚银行大厦": [31.238, 121.504],
  "长泰国际金融中心": [31.234, 121.515],
  "上海会德丰国际广场": [31.224, 121.447],
  "上海企业天地": [31.231, 121.472],
  "上海环贸广场": [31.209, 121.451],
  "上海新天地": [31.219, 121.474],
  "上海K11购物艺术中心": [31.228, 121.473],
  "上海太古汇": [31.226, 121.453],
  "上海大悦城": [31.242, 121.469],
  "上海正大广场": [31.239, 121.495],
  "上海龙之梦购物中心": [31.221, 121.420],
  "上海月星环球港": [31.234, 121.412],
  "上海万象城": [31.165, 121.371],
  "上海张江高科技园": [31.205, 121.598],
  "上海漕河泾开发区": [31.165, 121.395],
  "上海金桥出口加工区": [31.263, 121.619],
  "上海外高桥保税区": [31.347, 121.590],
  "上海紫竹科学园区": [31.022, 121.448],
  "上海临港产业区": [30.910, 121.920],
  "上海康桥工业园": [31.130, 121.583],
  "上海松江经济技术开发区": [31.033, 121.223],
  "紫荆广场": [31.229, 121.545],
};

interface Property {
  id: string;
  projectName: string;
  city: string;
  district: string;
  propertyType: string;
  faceRent: number;
}

interface MapViewProps {
  properties?: Property[];
  onSelectProperty?: (id: string) => void;
  userCoords?: { lat: number; lng: number } | null;
}

// Hash the project name to a deterministic seed for jitter
function seedFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h << 5) - h + name.charCodeAt(i)) | 0;
  return h;
}

export default function MapView({ properties, onSelectProperty, userCoords }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const [activeCity, setActiveCity] = useState<string>("上海");
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Mock dataset lazy-loaded out of the initial bundle (see lib/mock-data.ts)
  const [mockProperties, setMockProperties] = useState<Property[]>([]);
  useEffect(() => {
    let alive = true;
    import("@/lib/mock-data").then((m) => {
      if (alive) setMockProperties(m.mockProperties);
    });
    return () => { alive = false; };
  }, []);

  // Use provided properties or fallback to mock data
  const displayProperties = properties && properties.length > 0 ? properties : mockProperties;

  // Load Leaflet from the npm bundle (no external CDN — works in China)
  useEffect(() => {
    let alive = true;
    import("leaflet")
      .then((mod: any) => {
        if (!alive) return;
        leafletRef.current = mod.default ?? mod;
        setLoaded(true);
      })
      .catch(() => { if (alive) { setLoadFailed(true); setLoaded(true); } });
    return () => { alive = false; };
  }, []);

  // Create map instance
  useEffect(() => {
    if (!loaded || !mapRef.current || !leafletRef.current || mapInstanceRef.current) return;
    const L = leafletRef.current;

    const center: [number, number] = userCoords
      ? [userCoords.lat, userCoords.lng]
      : cityCenter[activeCity] || [31.23, 121.47];

    const map = L.map(mapRef.current, {
      center,
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // 高德地图瓦片（国内可直接访问，无需 key）；海外/失败时自动回退 OSM
    const amap = L.tileLayer(
      "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      { maxZoom: 18, subdomains: ["1", "2", "3", "4"] }
    );
    amap.on("tileerror", () => {
      if ((map as any)._fallbackApplied) return;
      (map as any)._fallbackApplied = true;
      map.removeLayer(amap);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
    });
    amap.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Fix map size on resize / tab switch
    setTimeout(() => map.invalidateSize(), 100);
    window.addEventListener("resize", () => map.invalidateSize());
  }, [loaded]);

  // Update markers when city or data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletRef.current) return;
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    // Shift center
    const center: [number, number] = cityCenter[activeCity] || [31.23, 121.47];
    map.setView(center, 13);

    // Clear old markers (LayerGroup — no leaks, circles included)
    markersLayer.clearLayers();

    const cityProps = displayProperties.filter((p) => p.city === activeCity);
    const usedCoords = new Set<string>();

    cityProps.forEach((p) => {
      // Use precise coordinate if available, otherwise fall back to district center
      let lat: number, lng: number;
      const exact = propertyCoords[p.projectName];
      const jitter = 0.004;
      if (exact) {
        [lat, lng] = exact;
      } else {
        [lat, lng] = districtCoords[p.district] || cityCenter[activeCity] || [31.23, 121.47];
        // Deterministic jitter based on project name (not random)
        const seed = seedFromName(p.projectName);
        lat += ((seed % 100) / 100 - 0.5) * jitter;
        lng += (((seed >> 8) % 100) / 100 - 0.5) * jitter;
      }

      const coordKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (usedCoords.has(coordKey)) {
        lat += (Math.random() - 0.5) * jitter * 2;
        lng += (Math.random() - 0.5) * jitter * 2;
      }
      usedCoords.add(`${lat.toFixed(5)},${lng.toFixed(5)}`);

      // Build label HTML with hardcoded dark-theme fallback colors
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const bg = isDark ? "#13171C" : "#FFFFFF";
      const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
      const textStrong = isDark ? "#FAFAFA" : "#1A1A2E";
      const accent = isDark ? "#00C570" : "#2563EB";
      const textHint = isDark ? "#71717A" : "#9CA3AF";

      const labelHtml = `<div style="background:${bg};border:1px solid ${border};border-radius:10px;padding:6px 12px;box-shadow:0 2px 10px rgba(0,0,0,0.18);cursor:pointer;font-family:var(--font-sans),sans-serif;pointer-events:auto;text-align:center;line-height:1.35">
          <div style="font-weight:600;color:${textStrong};white-space:nowrap;font-size:12px">${p.projectName}</div>
          <div style="font-family:monospace;font-weight:700;color:${accent};font-size:13px">¥${p.faceRent.toFixed(0)}<span style="font-size:10px;font-weight:400;color:${textHint}">/㎡/天</span></div>
        </div>`;

      const icon = L.divIcon({
        className: "pricecre-map-marker",
        html: labelHtml,
        iconSize: [140, 42],
        iconAnchor: [70, 14],
      });

      L.marker([lat, lng], { icon })
        .addTo(markersLayer)
        .on("click", () => {
          setSelectedProperty(p.id);
          onSelectProperty?.(p.id);
        });

      // Add a larger click target (circle) for easier tapping
      L.circle([lat, lng], {
        radius: 120,
        color: "transparent",
        fillColor: "transparent",
        fillOpacity: 0,
        interactive: true,
      }).addTo(markersLayer).on("click", () => {
        setSelectedProperty(p.id);
        onSelectProperty?.(p.id);
      });
    });
  }, [activeCity, loaded, displayProperties]);

  // 底部列表与地图标记使用同一数据源（真实数据优先）
  const cityProps = displayProperties.filter((p) => p.city === activeCity);

  return (
    <div className="h-full flex flex-col" style={{ background: "var(--bg)" }}>
      {/* City tabs */}
      <div
        className="flex items-center gap-1 px-3 py-2 overflow-x-auto border-b"
        style={{ borderColor: "var(--line)" }}
      >
        {cityList.map((city) => (
          <button
            key={city}
            onClick={() => setActiveCity(city)}
            className={`chip text-[11px] ${activeCity === city ? "active" : ""}`}
          >
            {city}
          </button>
        ))}
        <button onClick={() => setFullscreen(!fullscreen)} className="ml-auto w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--panel)]" title={fullscreen ? "退出全屏" : "全屏显示"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
            {fullscreen ? <><polyline points="4 14 4 20 10 20"/><polyline points="20 10 20 4 14 4"/><line x1="14" y1="10" x2="20" y2="4"/><line x1="4" y1="20" x2="10" y2="14"/></> : <><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></>}
          </svg>
        </button>
      </div>

      {/* Map container */}
      <div
        ref={mapRef}
        className="flex-1 w-full"
        style={{ minHeight: fullscreen ? "100vh" : "300px", background: "#d5d5d5", ...(fullscreen ? { position: "fixed", inset: 0, zIndex: 2000 } : {}) }}
      >
        {!loaded && (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }}
            />
          </div>
        )}
        {loadFailed && (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>地图组件加载失败，请刷新页面重试</span>
          </div>
        )}
      </div>

      {/* Bottom list */}
      {cityProps.length > 0 && (
        <div className="border-t" style={{ borderColor: "var(--line)", background: "var(--bg-surface)" }}>
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: "var(--text-strong)" }}>
              {activeCity} · {cityProps.length} 资产
            </span>
          </div>
          <div className="px-4 pb-3 space-y-1.5">
            {cityProps.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer ${
                  selectedProperty === p.id
                    ? "ring-1 bg-[var(--accent-soft)]"
                    : "bg-[var(--panel)] hover:bg-[var(--bg-hover)]"
                }`}
                onClick={() => {
                  setSelectedProperty(p.id);
                  onSelectProperty?.(p.id);
                }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                    {p.propertyType === "OFFICE" ? (
                      <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2" /></>
                    ) : p.propertyType === "SHOPS" ? (
                      <><path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9" /><path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9" /><path d="M9 22V12h6v10" /></>
                    ) : (
                      <><path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12" /><path d="M9 18h2M13 18h2" /></>
                    )}
                  </svg>
                  <div className="min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: "var(--text-strong)" }}>{p.projectName}</div>
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
