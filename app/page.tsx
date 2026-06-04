"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import PropertyCard from "@/components/PropertyCard";
import ThemeToggle from "@/components/ThemeToggle";
import HamburgerMenu from "@/components/HamburgerMenu";
import MobileNav from "@/components/MobileNav";
import CreditPanel from "@/components/CreditPanel";
import Modal from "@/components/Toast";
import WechatCard from "@/components/WechatCard";
import AIAnalysis from "@/components/AIAnalysis";
import { showModal } from "@/components/Toast";

import MapView from "@/components/MapView";
import ShareCenter from "@/components/ShareCenter";
import ProfilePanel from "@/components/ProfilePanel";
import { mockProperties } from "@/lib/mock-data";
import { PropertyType } from "@/types/indicators";

export default function Home() {
  // Filters
  const [activeCity, setActiveCity] = useState<string>("全部");
  const [activeType, setActiveType] = useState<PropertyType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"market" | "map" | "share" | "profile">("market");
  const [showCreditPanel, setShowCreditPanel] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const [wechatCardData, setWechatCardData] = useState<any>(null);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);

  useEffect(() => {
    const h = (e: Event) => setWechatCardData((e as CustomEvent).detail);
    document.addEventListener("open-wechat-card", h);
    return () => document.removeEventListener("open-wechat-card", h);
  }, []);

  useEffect(() => {
    const h = (e: Event) => setAiAnalysisData((e as CustomEvent).detail);
    document.addEventListener("open-ai-analysis", h);
    return () => document.removeEventListener("open-ai-analysis", h);
  }, []);

  // Listen for hamburger menu nav events
  useEffect(() => {
    const handler = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (["map", "share", "market", "profile"].includes(tab)) setMobileTab(tab as "map" | "share" | "market" | "profile");
    };
    document.addEventListener("nav-to-tab", handler);
    return () => document.removeEventListener("nav-to-tab", handler);
  }, []);

  // Referral detection — check for invite code on load
  const [referralToast, setReferralToast] = useState<string | null>(null);
  useEffect(() => {
    // Check URL param first (fresh redirect from /r/[code])
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get("ref");
    if (refFromUrl) {
      setReferralToast(`好友邀请你加入 PriceCRE，注册后双方各得 3 次查看额度`);
    } else {
      // Check localStorage for previously stored referral
      try {
        const stored = JSON.parse(localStorage.getItem("pricecre_referral") || "null");
        if (stored?.code) {
          setReferralToast(`你已通过邀请链接进入，注册后双方各得 3 次查看额度`);
        }
      } catch {}
    }
  }, []);
  const [copied, setCopied] = useState(false);

  // Credits
  const [credits, setCredits] = useState({
    referral: 3,
    purchased: 5,
  });

  const totalCredits = credits.referral + credits.purchased;
  const { lang } = useLanguage();

  // Nearby city mapping for geo-location fallback (HK→深圳, 杭州→上海, etc.)
  // Also maps English IP API returns to Chinese
  const CITY_EN_TO_CN: Record<string, string> = {
    "Shanghai": "上海", "Beijing": "北京", "Shenzhen": "深圳",
    "Guangzhou": "广州", "Hangzhou": "杭州", "Chengdu": "成都",
    "Suzhou": "苏州", "Changsha": "长沙", "Xi'an": "西安", "Xian": "西安",
    "Nanjing": "苏州", "Wuxi": "苏州",
    "Hong Kong": "深圳", "Macau": "深圳",
  };
  const NEARBY_CITY: Record<string, string> = {
    "香港": "深圳", "广州": "深圳", "东莞": "深圳", "惠州": "深圳", "珠海": "深圳", "佛山": "深圳",
    "澳门": "深圳",
    "天津": "北京", "廊坊": "北京", "保定": "北京",
    "南京": "苏州", "无锡": "苏州", "常州": "苏州", "南通": "苏州",
    "杭州": "上海", "宁波": "上海", "嘉兴": "上海", "绍兴": "上海",
    "重庆": "成都", "绵阳": "成都",
  };
  const resolveCity = (raw: string) => {
    let c = raw.replace("市", "");
    // Try English→Chinese first
    if (CITY_EN_TO_CN[c]) c = CITY_EN_TO_CN[c];
    const covered = ["上海", "北京", "深圳", "苏州", "成都", "广州", "杭州", "长沙", "西安"];
    if (covered.includes(c)) return c;
    return NEARBY_CITY[c] || NEARBY_CITY[raw] || "";
  };

  // Geolocation — auto-detect user city on initial load
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoDetected, setGeoDetected] = useState(false);
  const [userCity, setUserCity] = useState<string>("");
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined" || geoDetected) return;

    const detectByIP = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error("ipapi failed");
        const d = await res.json();
        const cityName = d.city || "";
        setUserCity(cityName);
        const resolved = resolveCity(cityName);
        if (resolved) { setActiveCity(resolved); setUserCity(resolved); }
      } catch {
        // Fallback: try ip-api.com
        try {
          const res = await fetch("http://ip-api.com/json/?lang=zh-CN");
          const d = await res.json();
          const cityName = (d.city || "").replace("市", "");
          setUserCity(cityName);
          const resolved = resolveCity(cityName);
          if (resolved) { setActiveCity(resolved); setUserCity(resolved); }
        } catch {
          // Silently fail — show all cities
        }
      }
      setGeoDetected(true);
      setGeoLoading(false);
    };

    // Try browser GPS first (more accurate), fall back to IP
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          // Use Nominatim reverse geocode (free, no key)
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=10&accept-language=zh`
          )
            .then((r) => r.json())
            .then((d) => {
              const city =
                d.address?.city || d.address?.town || d.address?.county || "";
              const cityName = city.replace("市", "");
              setUserCity(cityName);
              const resolved = resolveCity(cityName);
              if (resolved) { setActiveCity(resolved); setUserCity(resolved); }
              setGeoDetected(true);
              setGeoLoading(false);
            })
            .catch(() => {
              detectByIP();
            });
        },
        () => {
          // GPS denied → fall back to IP
          detectByIP();
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      detectByIP();
    }
  }, [geoDetected]);

  // Filtered data
  const filteredProperties = useMemo(() => {
    return mockProperties.filter((p) => {
      if (activeCity !== "全部" && p.city !== activeCity) return false;
      if (activeType !== "ALL" && p.propertyType !== activeType) return false;
      if (
        searchQuery &&
        !p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.city.includes(searchQuery) &&
        !p.district.includes(searchQuery)
      )
        return false;
      return true;
    });
  }, [activeCity, activeType, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const unlocked = mockProperties.filter((p) => p.isUnlocked).length;
    const cities = new Set(mockProperties.map((p) => p.city)).size;
    const volume = unlocked * 8 + 12; // 模拟成交量
    return { total: mockProperties.length, unlocked, cities, volume };
  }, []);

  // Handlers
  const handleUnlock = useCallback((propertyId: string) => {
    setCredits((prev) => {
      if (prev.referral > 0) return { ...prev, referral: prev.referral - 1 };
      if (prev.purchased > 0) return { ...prev, purchased: prev.purchased - 1 };
      return prev;
    });
  }, []);

  const handleCityChange = useCallback((city: string) => {
    setActiveCity(city);
    setMenuOpen(false);
  }, []);

  const handleTypeChange = useCallback((type: PropertyType | "ALL") => {
    setActiveType(type);
    setMenuOpen(false);
  }, []);

  const handleTabChange = useCallback(
    (tab: "market" | "map" | "share" | "profile") => {
      setMobileTab(tab);
      if (tab === "market") setFocusedPropertyId(null);
    },
    []
  );

  const handleMapSelectProperty = useCallback((id: string) => {
    setFocusedPropertyId(id);
    setMobileTab("market");
  }, []);

  // Scroll to focused property
  useEffect(() => {
    if (focusedPropertyId) {
      setTimeout(() => {
        document.getElementById(`property-${focusedPropertyId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    }
  }, [focusedPropertyId]);

  // Active filter label
  const activeFilterLabel =
    activeCity === "全部" && activeType === "ALL"
      ? "全部资产"
      : [
          activeCity !== "全部" ? activeCity : "",
          activeType !== "ALL"
            ? (() => {
                const labels: Record<string, string> = {
                  OFFICE: "写字楼",
                  SHOPS: "商业零售",
                  INDUSTRIAL: "产业园",
                };
                return labels[activeType];
              })()
            : "",
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <div
      className="min-h-screen relative"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      {/* ====== Hamburger Menu ====== */}
      <HamburgerMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeCity={activeCity}
        onCityChange={handleCityChange}
        activeType={activeType}
        onTypeChange={handleTypeChange}
      />

      {/* ====== Top Header ====== */}
      <header
        className="fixed top-0 left-0 right-0 z-30 border-b"
        style={{
          background: "var(--bg-nav)",
          borderColor: "var(--line)",
          backdropFilter: "blur(20px) saturate(180%)",
          height: "var(--nav-height)",
        }}
      >
        <div className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          {/* Left: Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={`flex flex-col items-center justify-center w-9 h-9 rounded-lg hover:bg-[var(--panel)] transition-colors ${
                menuOpen ? "hamburger-open" : ""
              }`}
              aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
            >
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
              <span className="hamburger-bar" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: "var(--accent)" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <rect x="8" y="10" width="8" height="4" rx="1" />
                  <rect x="8" y="18" width="8" height="4" rx="1" />
                  <rect x="2" y="6" width="6" height="3" rx="1" />
                  <rect x="2" y="14" width="6" height="3" rx="1" />
                  <rect x="2" y="22" width="6" height="3" rx="1" />
                  <rect x="16" y="6" width="6" height="3" rx="1" />
                  <rect x="16" y="14" width="6" height="3" rx="1" />
                </svg>
              </div>
              <div>
                <a
                  href="https://pricecre.com"
                  className="text-[13px] sm:text-[14px] font-bold leading-tight tracking-tight whitespace-nowrap hover:opacity-80 transition-opacity"
                  style={{ color: "var(--text-strong)", textDecoration: "none" }}
                >
                  PriceCRE · 地产价值
                </a>
              </div>
            </div>

            {/* LIVE Badge */}
            <span className="badge-live hidden sm:inline-flex">
              <span className="badge-live-dot" />
              LIVE
            </span>
            {/*
            {userCity && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium ml-1" style={{ color: "var(--text-muted)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {userCity}
              </span>
            )}
            */}
          </div>

          {/* Center: Search (Desktop) */}
          <div className="hidden sm:block flex-1 max-w-sm mx-4">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-hint)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="搜索项目名称、城市..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-search"
              />
            </div>
          </div>

          {/* Right: Credits + Theme + User */}
          <div className="flex items-center gap-2">
            {/* Credit Button */}
            <button
              onClick={() => setShowCreditPanel(!showCreditPanel)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:bg-[var(--panel)]"
              style={{ color: "var(--text)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="font-semibold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>
                {totalCredits}
              </span>
            </button>

            {(activeCity !== "全部" || userCity) && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium ml-1" style={{ color: "var(--accent)" }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {activeCity !== "全部" ? activeCity : resolveCity(userCity) || userCity}
              </span>
            )}

            <ThemeToggle />

            <div
              className="hidden sm:flex w-8 h-8 rounded-full items-center justify-center cursor-pointer hover:ring-2 transition-all"
              style={{ background: "var(--panel)" }}
              onClick={() => setMobileTab("profile")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Credit Panel Popover */}
        {showCreditPanel && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowCreditPanel(false)} />
            <div className="absolute right-4 top-[calc(var(--nav-height)+4px)] z-50 animate-slide-up">
              <CreditPanel
              credits={credits}
              onClose={() => setShowCreditPanel(false)}
              />
            </div>
          </>
        )}
      </header>

      {/* ====== Main Content ====== */}
      <main className="pt-[var(--nav-height)] pb-[calc(var(--bottom-nav-h)+env(safe-area-inset-bottom)+40px)] lg:pb-8">
        {/* Referral Welcome Toast */}
        {referralToast && (
          <div className="max-w-7xl mx-auto px-4 pt-3">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium animate-slide-up"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)", borderColor: "var(--accent)", opacity: 0.9 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5.5L19 4l-3.5 4.5L22 12l-6.5 1.5L19 20l-5.5-4L12 22l-1.5-6L4 20l4-7L2 12l6-2.5L4 4l6.5 4.5L12 2z"/></svg>
              {referralToast}
              <button onClick={() => setReferralToast(null)} className="ml-auto text-[var(--text-hint)] hover:text-[var(--text)]">&times;</button>
            </div>
          </div>
        )}
        {mobileTab === "market" && (
          <>
        {/* Stats Bar */}
        <div className="border-b" style={{ background: "var(--bg-surface)", borderColor: "var(--line)" }}>
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="grid grid-cols-4 gap-0">
              <div className="stat-item">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="inline-block mr-1 align-middle"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>覆盖资产</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2" className="inline-block mr-1 align-middle"><path d="M11 1a2 2 0 012 2v3.5a.5.5 0 01-.5.5H10V3a2 2 0 012-2z"/><path d="M5 1a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2v-.5a.5.5 0 00-.5-.5H6V3a2 2 0 00-2-2z"/></svg>已解锁</div>
                <div className="stat-value" style={{ color: "var(--positive)" }}>{stats.unlocked}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" className="inline-block mr-1 align-middle"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>覆盖城市</div>
                <div className="stat-value">{stats.cities}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="inline-block mr-1 align-middle"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>成交量</div>
                <div className="stat-value">{stats.volume}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden px-4 pt-3 pb-2">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "var(--text-hint)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="搜索项目、城市..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-search"
            />
          </div>
        </div>

        {/* Active Filter + Type Chips + Filter Button — sticky */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between sticky top-[56px] z-20" style={{ background: "var(--bg)", borderBottom: "1px solid var(--line)" }}>
          <div className="flex items-center gap-2">
            {/* Property Type Filter Chips */}
            <div className="flex items-center gap-2">
              {[
                { key: "OFFICE", label: "写字楼" },
                { key: "SHOPS", label: "商业零售" },
                { key: "INDUSTRIAL", label: "产业园" },
              ].map((t) => {
                const isActive = activeType === t.key;
                const count = mockProperties.filter(p =>
                  (activeCity === "全部" || p.city === activeCity) && p.propertyType === t.key
                ).length;
                return (
                  <button
                    key={t.key}
                    onClick={() => handleTypeChange(t.key === activeType ? "ALL" : (t.key as PropertyType))}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                      isActive
                        ? "text-[var(--accent)] ring-1 ring-[var(--accent)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--panel)]"
                    }`}
                    style={isActive ? { background: "var(--accent-soft)" } : {}}
                  >
                    {t.label} <span style={{ fontSize: "10px", fontWeight: 300, color: "var(--text-hint)" }}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Geo location indicator */}
            {userCity && activeCity === userCity && (
              <button
                onClick={() => { setActiveCity("全部"); }}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors hover:bg-[var(--panel)]"
                style={{ color: "var(--accent)" }}
                title="点击查看全部城市"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                {userCity} · 查看全部
              </button>
            )}
            {geoLoading && !geoDetected && (
              <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--text-hint)" }}>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                定位中
              </span>
            )}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--panel)]"
              style={{ color: "var(--text-muted)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
              </svg>
              筛选
            </button>
          </div>
        </div>

        {/* Property Cards */}
        <div className="max-w-7xl mx-auto px-4 pb-4">
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  remainingCredits={totalCredits}
                  onUnlock={handleUnlock}
                  autoExpand={property.id === focusedPropertyId}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "var(--panel)", border: "1px solid var(--line)" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>未找到匹配资产</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-hint)" }}>调整筛选条件或搜索关键词</p>
            </div>
          )}
        </div>

        {/* Share CTA */}
        <div id="share-section" className="max-w-7xl mx-auto px-4 pb-8">
          <div
            className="max-w-lg mx-auto rounded-2xl p-4 sm:p-5 text-center overflow-hidden relative"
            style={{
              background: "var(--accent)",
              backgroundImage: "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 70%, #000) 100%)",
              boxShadow: "0 8px 40px var(--accent-soft)",
            }}
          >
            {/* Decorative dots */}
            <div className="absolute top-3 right-4 flex gap-1 opacity-20">
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-inverse)" }} />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-inverse)" }} />
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--text-inverse)" }} />
            </div>
            <div className="absolute bottom-4 left-6 opacity-15 text-4xl font-bold" style={{ color: "var(--text-inverse)" }}>+3</div>

            {/* Gift icon */}
            <div className="w-8 h-8 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12" />
                <rect x="2" y="7" width="20" height="5" />
                <line x1="12" y1="22" x2="12" y2="7" />
                <path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" />
              </svg>
            </div>

            <h3 className="text-base font-bold mb-1.5" style={{ color: "var(--text-inverse)" }}>
              邀请好友 · 双方各得查看额度
            </h3>
            <p className="text-xs mb-4 opacity-80" style={{ color: "var(--text-inverse)" }}>
              好友通过你的专属链接注册，双方各获得 3 次免费查看额度
            </p>

            <div className="flex items-center gap-2 max-w-xs mx-auto">
              <code
                className="flex-1 px-4 py-2.5 rounded-lg text-xs font-medium truncate"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "var(--text-inverse)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                https://pricecre.com/r/sz2026
              </code>
              <button
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "var(--text-inverse)",
                  color: "var(--accent)",
                }}
                onClick={() => {
                  navigator.clipboard.writeText("https://pricecre.com/r/sz2026");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    已复制
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    一键邀约
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
          </>
        )}

        {/* Map Tab */}
        {mobileTab === "map" && <MapView onSelectProperty={handleMapSelectProperty} userCoords={userCoords} />}

        {/* Share Tab */}
        {mobileTab === "share" && <ShareCenter />}

        {/* Profile Tab */}
        {mobileTab === "profile" && <ProfilePanel />}
      </main>

      {/* ====== Footer ====== */}
      <footer className="border-t" style={{ borderColor: "var(--line)", background: "var(--bg-surface)" }}>
        <div className="max-w-7xl mx-auto px-4 py-3 text-center">
          <span className="text-[12px]" style={{ color: "var(--text-hint)" }}>
            &copy; 2026 PriceCRE 商业地产量化精算资产终端
          </span>
        </div>
      </footer>

      {/* ====== Mobile Bottom Nav ====== */}
      <Modal />
      {wechatCardData && <WechatCard {...wechatCardData} onClose={() => setWechatCardData(null)} />}
      {aiAnalysisData && <AIAnalysis {...aiAnalysisData} onClose={() => setAiAnalysisData(null)} />}
      <MobileNav activeTab={mobileTab} onTabChange={handleTabChange} />
    </div>
  );
}
