"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
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
import PropertyChat from "@/components/PropertyChat";
import ShareCenter from "@/components/ShareCenter";
import ProfilePanel from "@/components/ProfilePanel";
import { mockProperties } from "@/lib/mock-data";
import { PropertyType } from "@/types/indicators";

// Fetch real properties alongside mock data
function useRealProperties() {
  const [real, setReal] = useState<any[]>([]);
  useEffect(() => {
    fetch("/api/properties").then(r => r.json()).then(d => {
      if (d.properties?.length) setReal(d.properties);
    }).catch(() => {});
  }, []);
  return real;
}

export default function Home() {
  const realProperties = useRealProperties();
  // Filters
  const [activeCity, setActiveCity] = useState<string>("全部");
  const [activeType, setActiveType] = useState<PropertyType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statFilter, setStatFilter] = useState<string | null>(null);

  // Global Property Chat — mounted at page level, not inside cards
  const [chatProp, setChatProp] = useState<any>(null);
  useEffect(() => {
    const handler = (e: Event) => setChatProp((e as CustomEvent).detail);
    document.addEventListener("open-property-chat", handler);
    return () => document.removeEventListener("open-property-chat", handler);
  }, []);

  // UI State
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState(() => {
    try { return (sessionStorage.getItem("pricecre_tab") as any) || "market"; }
    catch { return "market"; }
  });
  const [showCreditPanel, setShowCreditPanel] = useState(false);
  const [focusedPropertyId, setFocusedPropertyId] = useState<string | null>(null);
  const [wechatCardData, setWechatCardData] = useState<any>(null);
  const [aiAnalysisData, setAiAnalysisData] = useState<any>(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);

  useEffect(() => {
    const h = (e: Event) => {
      if (!userEmailRef.current) { showModal("请先登录"); return; }
      setWechatCardData((e as CustomEvent).detail);
    };
    document.addEventListener("open-wechat-card", h);
    return () => document.removeEventListener("open-wechat-card", h);
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      if (!userEmailRef.current) { showModal("请先登录以使用 AI 分析"); return; }
      const detail = (e as CustomEvent).detail;
      setAiAnalysisData({ ...detail, email: userEmailRef.current });
    };
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

  // Listen for user logout event
  useEffect(() => {
    const handler = () => {
      setUserEmail(null);
      setCredits({ shared: 0, referral: 0, purchased: 0 });
      setChatTokens({ total: 0, used: 0 });
      setCreditStats({ viewCount: 0, unlockCount: 0, conversations: 0 });
      try { localStorage.removeItem("pricecre_user"); } catch {}
    };
    document.addEventListener("user-logout", handler);
    return () => document.removeEventListener("user-logout", handler);
  }, []);

  // Listen for user login event from ProfilePanel
  useEffect(() => {
    const handler = (e: Event) => {
      const { email } = (e as CustomEvent).detail;
      if (email) setUserEmail(email);
    };
    document.addEventListener("user-login", handler);
    return () => document.removeEventListener("user-login", handler);
  }, []);

  // Referral detection — check for invite code on load
  const [referralToast, setReferralToast] = useState<string | null>(null);
  useEffect(() => {
    // Check URL param first (fresh redirect from /r/[code])
    const urlParams = new URLSearchParams(window.location.search);
    const refFromUrl = urlParams.get("ref");
    if (refFromUrl) {
      setReferralToast(`好友邀请你加入 PriceCRE，注册后双方各得 10 次查询权益`);
    } else {
      // Check localStorage for previously stored referral
      try {
        const stored = JSON.parse(localStorage.getItem("pricecre_referral") || "null");
        if (stored?.code) {
          setReferralToast(`你已通过邀请链接进入，注册后双方各得 10 次查询权益`);
        }
      } catch {}
    }
  }, []);
  const [copied, setCopied] = useState(false);

  // Persistent state via localStorage
  const loadPersisted = <T,>(key: string, fallback: T): T => {
    try {
      const stored = localStorage.getItem(`pricecre_${key}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return fallback;
  };
  const savePersisted = (key: string, value: any) => {
    try { localStorage.setItem(`pricecre_${key}`, JSON.stringify(value)); } catch {}
  };

  // Credits + user state
  const [credits, setCredits] = useState(() =>
    loadPersisted("credits", { shared: 0, referral: 3, purchased: 5 })
  );
  const [chatTokens, setChatTokens] = useState(() =>
    loadPersisted("chatTokens", { total: 0, used: 0 })
  );
  const [creditStats, setCreditStats] = useState(() =>
    loadPersisted("creditStats", { viewCount: 0, unlockCount: 0, conversations: 0 })
  );
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(() => {
    const arr = loadPersisted<string[]>("unlockedIds", []);
    return new Set(arr);
  });
  const [unlockedData, setUnlockedData] = useState<Record<string, any>>({});
  const [myReferralCode, setMyReferralCode] = useState(() =>
    loadPersisted("referralCode", "sz2026")
  );
  const [userEmail, setUserEmail] = useState(() =>
    loadPersisted<string | null>("userEmail", null)
  );
  const userEmailRef = useRef<string | null>(null);
  useEffect(() => { userEmailRef.current = userEmail; }, [userEmail]);

  // Persist on change
  useEffect(() => { savePersisted("credits", credits); }, [credits]);
  useEffect(() => { savePersisted("chatTokens", chatTokens); }, [chatTokens]);
  useEffect(() => { savePersisted("creditStats", creditStats); }, [creditStats]);
  useEffect(() => { savePersisted("unlockedIds", [...unlockedIds]); }, [unlockedIds]);
  useEffect(() => { savePersisted("referralCode", myReferralCode); }, [myReferralCode]);

  // Handle ?p=prop-001 parameter from QR code / shared links
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const propId = params.get("p");
      if (propId) {
        setTimeout(() => {
          const el = document.getElementById(`property-${propId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 500);
      }
    } catch {}
  }, []);

  // Restore user login state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pricecre_user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.referralCode) setMyReferralCode(user.referralCode);
        if (user.email) setUserEmail(user.email);
        // Sync credits if stored from registration
        if (user.totalCredits) {
          setCredits({ shared: 0, referral: user.totalCredits, purchased: 0 });
        }
      }
    } catch {}
  }, []);

  // Fetch real credit/token/stats from server when logged in
  useEffect(() => {
    if (!userEmail) return;
    const fetchQuota = async () => {
      try {
        const [cr, tk, ud] = await Promise.all([
          fetch(`/api/admin/user-credits?email=${encodeURIComponent(userEmail)}`).then(r => r.json()),
          fetch(`/api/ai/chat-quota?email=${encodeURIComponent(userEmail)}&assetId=__page__`).then(r => r.json()),
          fetch(`/api/admin/user-detail?email=${encodeURIComponent(userEmail)}`).then(r => r.json()),
        ]);
        if (cr && !cr.error) {
          setCredits({ shared: 0, referral: cr.referralCredits || 0, purchased: cr.purchasedCredits || 0 });
        }
        if (tk && !tk.error) {
          setChatTokens({ total: tk.tokens || 0, used: tk.totalUsed || 0 });
        }
        if (ud && !ud.error) {
          setCreditStats({ viewCount: ud.viewCount || 0, unlockCount: ud.viewCount || 0, conversations: ud.totalConversations || 0 });
        }
      } catch {}
    };
    fetchQuota();
  }, [userEmail]);

  // Handle CreditPanel quick actions
  useEffect(() => {
    const h = (e: Event) => {
      const action = (e as CustomEvent).detail;
      if (action === "chats" && userEmail) {
        fetch(`/api/admin/user-detail?email=${encodeURIComponent(userEmail)}`).then(r => r.json()).then(d => {
          setChatHistory(d.chatLogs || []);
          setShowChatHistory(true);
        }).catch(() => {});
      } else if (action === "orders" && userEmail) {
        fetch(`/api/admin/user-detail?email=${encodeURIComponent(userEmail)}`).then(r => r.json()).then(d => {
          setOrderHistory(d.orders || []);
          setShowOrderHistory(true);
        }).catch(() => {});
      } else if (action === "assets") {
        setMobileTab("market");
      }
    };
    document.addEventListener("credit-panel-action", h);
    return () => document.removeEventListener("credit-panel-action", h);
  }, [userEmail]);

  const totalCredits = credits.shared + credits.referral + credits.purchased;
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
          // Fallback: default to Shanghai if all geo APIs fail
          setActiveCity("上海");
          setUserCity("上海");
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

  // Merge real + mock properties (real data takes priority)
  const allProperties = useMemo(() => {
    const merged = [...realProperties, ...mockProperties.filter(m => !realProperties.some(r => r.projectName === m.projectName))];
    return merged.map(p => ({
      ...p,
      id: p.id || "",
      projectName: p.projectName || "",
      city: p.city || "",
      district: p.district || "",
      propertyType: p.propertyType || "OFFICE",
      faceRent: Number(p.faceRent) || 0,
      dataSource: p.dataSource || "",
      dynamicIndicators: p.dynamicIndicators || {},
    }));
  }, [realProperties]);

  // Filtered data
  const filteredProperties = useMemo(() => {
    return allProperties.filter((p) => {
      if (activeCity !== "全部" && p.city !== activeCity) return false;
      if (activeType !== "ALL" && p.propertyType !== activeType) return false;
      if (statFilter === "unlocked") {
        const unlockedIds = new Set(JSON.parse(localStorage.getItem("pricecre_unlocked") || "[]"));
        if (!unlockedIds.has(p.id as any)) return false;
      }
      if (statFilter === "recent" && p.dataSource !== "成交量") return false;
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

  // Stats (reactive to unlocks)
  const [serverStats, setServerStats] = useState({ total: mockProperties.length, cities: 0, volume: 0 });

  const stats = useMemo(() => {
    const cities = new Set(mockProperties.map((p) => p.city)).size;
    return {
      total: mockProperties.length,
      unlocked: unlockedIds.size,
      cities,
      volume: serverStats.volume || 12,
    };
  }, [unlockedIds, serverStats.volume, mockProperties.length]);

  // Fetch real stats from API
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => setServerStats((prev) => ({
        ...prev,
        volume: d.viewCount || d.propertyCount || 12,
      })))
      .catch(() => {});
  }, []);

  // Handlers
  const handleUnlock = useCallback(async (propertyId: string) => {
    try {
      const prop = mockProperties.find(p => p.id === propertyId);
      const res = await fetch("/api/assets/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          propertyId,
          ...(prop ? { projectName: prop.projectName, city: prop.city } : {}),
          ...(userEmail ? { email: userEmail } : {}),
        }),
      });
      const data = await res.json();
      if (data.unlocked) {
        setUnlockedIds((prev) => new Set(prev).add(propertyId));
        // Store real indicators from server
        if (data.property?.dynamicIndicators) {
          setUnlockedData((prev) => ({ ...prev, [propertyId]: data.property.dynamicIndicators }));
        }
        // Sync credits from server response
        setCredits((prev) => {
          const total = data.remainingCredits ?? (prev.referral + prev.purchased - 1);
          // Prefer referral pool deduction logic
          if (prev.referral > 0) return { shared: prev.shared, referral: prev.referral - 1, purchased: prev.purchased };
          return { shared: prev.shared, referral: 0, purchased: Math.max(0, total) };
        });
      } else if (data.error) {
        showModal(data.error);
      }
    } catch {
      showModal("网络异常，请稍后重试");
    }
  }, []);

  const handleCityChange = useCallback((city: string) => {
    setActiveCity(city);
    setMobileTab("market");
    setMenuOpen(false);
  }, []);

  const handleTypeChange = useCallback((type: PropertyType | "ALL") => {
    setActiveType(type);
    setMobileTab("market");
    setMenuOpen(false);
  }, []);

  const handleTabChange = useCallback(
    (tab: "market" | "map" | "share" | "profile") => {
      setMobileTab(tab);
      try { sessionStorage.setItem("pricecre_tab", tab); } catch {}
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
              <span style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)", fontWeight: 300, fontSize: 14, letterSpacing: "-0.03em" }}>
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
              chatTokens={chatTokens}
              creditStats={creditStats}
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
            <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium animate-slide-up max-w-lg mx-auto"
              style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)", borderColor: "var(--accent)", opacity: 0.9 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 5.5L19 4l-3.5 4.5L22 12l-6.5 1.5L19 20l-5.5-4L12 22l-1.5-6L4 20l4-7L2 12l6-2.5L4 4l6.5 4.5L12 2z"/></svg>
              {referralToast}
              <a href="/?tab=profile"
                style={{
                  marginLeft: 4, padding: "3px 12px", borderRadius: 9999, background: "var(--accent)", color: "#FFFFFF",
                  fontSize: 11, fontWeight: 600, textDecoration: "none", whiteSpace: "nowrap", cursor: "pointer",
                }}>
                立即注册
              </a>
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
              <div className="stat-item" onClick={() => { setActiveCity("全部"); setActiveType("ALL"); setSearchQuery(""); setStatFilter(null); }}
                style={{ cursor: "pointer" }} title="点击查看全部资产">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" className="inline-block mr-1 align-middle"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>覆盖资产</div>
                <div className="stat-value">{stats.total}</div>
              </div>
              <div className="stat-item" onClick={() => setStatFilter(statFilter === "unlocked" ? null : "unlocked")}
                style={{ cursor: "pointer", background: statFilter === "unlocked" ? "rgba(0,197,112,0.06)" : undefined, borderRadius: statFilter === "unlocked" ? 8 : undefined }}
                title="点击筛选已解锁资产">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2" className="inline-block mr-1 align-middle"><path d="M11 1a2 2 0 012 2v3.5a.5.5 0 01-.5.5H10V3a2 2 0 012-2z"/><path d="M5 1a2 2 0 00-2 2v10a2 2 0 002 2h6a2 2 0 002-2v-.5a.5.5 0 00-.5-.5H6V3a2 2 0 00-2-2z"/></svg>已解锁</div>
                <div className="stat-value" style={{ color: statFilter === "unlocked" ? "#0D9488" : "var(--positive)" }}>{stats.unlocked}</div>
              </div>
              <div className="stat-item" onClick={() => setMobileTab("market")}
                style={{ cursor: "pointer" }} title="点击查看城市分布">
                <div className="stat-label"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" className="inline-block mr-1 align-middle"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>覆盖城市</div>
                <div className="stat-value">{stats.cities}</div>
              </div>
              <div className="stat-item" onClick={() => setStatFilter(statFilter === "recent" ? null : "recent")}
                style={{ cursor: "pointer", background: statFilter === "recent" ? "rgba(0,112,243,0.06)" : undefined, borderRadius: statFilter === "recent" ? 8 : undefined }}
                title="点击筛选近期成交">
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
                { key: "OFFICE", label: "写字楼", icon: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-0.5"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2"/></svg>) },
                { key: "SHOPS", label: "商业零售", icon: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-0.5"><path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9"/><path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9"/><path d="M9 22V12h6v10"/></svg>) },
                { key: "INDUSTRIAL", label: "产业园", icon: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-0.5"><path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12"/><path d="M9 18h2M13 18h2"/></svg>) },
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
                    {t.icon}
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
        <div className="max-w-7xl mx-auto px-4 pt-2 pb-4">
          {filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ alignItems: "start" }}>
              {filteredProperties.map((property) => {
                const isRealUnlocked = unlockedIds.has(property.id);
                const realIndicators = unlockedData[property.id];
                return (
                <PropertyCard
                  key={property.id}
                  property={{
                    ...property,
                    isUnlocked: property.isUnlocked || isRealUnlocked,
                    dynamicIndicators: realIndicators ? { ...property.dynamicIndicators, ...realIndicators } : property.dynamicIndicators,
                  }}
                  remainingCredits={totalCredits}
                  onUnlock={handleUnlock}
                  autoExpand={property.id === focusedPropertyId}
                />
              )})}
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
              邀请好友 · 双方各得查询权益
            </h3>
            <p className="text-xs mb-4 opacity-80" style={{ color: "var(--text-inverse)" }}>
              好友通过你的专属链接注册，双方各获得 10 次免费查询权益
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
                https://pricecre.com/r/{myReferralCode}
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
        {mobileTab === "map" && <MapView properties={allProperties} onSelectProperty={handleMapSelectProperty} userCoords={userCoords} />}

        {/* Share Tab */}
        {mobileTab === "share" && <ShareCenter />}

        {/* Profile Tab */}
        {mobileTab === "profile" && <ProfilePanel credits={credits} totalCredits={totalCredits} chatTokens={chatTokens} creditStats={creditStats} />}
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
      {chatProp && <PropertyChat property={chatProp} email={userEmail || undefined} onClose={() => setChatProp(null)} />}

      {/* Chat History Panel */}
      {showChatHistory && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} onClick={() => setShowChatHistory(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#FFF", borderRadius: 12, width: 480, maxWidth: "92vw", maxHeight: "70vh", overflow: "auto", zIndex: 201, border: "1px solid #E5E5E5", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E5E5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#171717", margin: 0, fontFamily: "var(--font-sans)" }}>AI 对话记录</h3>
              <button onClick={() => setShowChatHistory(false)} style={{ padding: "2px 8px", border: "none", background: "none", fontSize: 18, color: "#A3A3A3", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: 12 }}>
              {chatHistory.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "55vh", overflow: "auto" }}>
                  {chatHistory.map((c: any, i: number) => (
                    <div key={i} style={{ padding: "8px 12px", background: "#FAFAFA", borderRadius: 8, border: "1px solid #F0F0F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>
                          {new Date(c.createdAt).toLocaleString("zh-CN")}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono)", color: "#EE0000" }}>-{Math.abs(c.amount)} 条</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#737373", fontFamily: "var(--font-sans)" }}>{c.note || "AI 对话消费"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 20, color: "#A3A3A3", fontSize: 12 }}>暂无对话记录</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Order History Panel */}
      {showOrderHistory && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 200 }} onClick={() => setShowOrderHistory(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#FFF", borderRadius: 12, width: 480, maxWidth: "92vw", maxHeight: "70vh", overflow: "auto", zIndex: 201, border: "1px solid #E5E5E5", boxShadow: "0 4px 24px rgba(0,0,0,0.12)" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #E5E5E5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: "#171717", margin: 0, fontFamily: "var(--font-sans)" }}>我的订单</h3>
              <button onClick={() => setShowOrderHistory(false)} style={{ padding: "2px 8px", border: "none", background: "none", fontSize: 18, color: "#A3A3A3", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ padding: 12 }}>
              {orderHistory.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "55vh", overflow: "auto" }}>
                  {orderHistory.map((o: any, i: number) => (
                    <div key={i} style={{ padding: "10px 12px", background: "#FAFAFA", borderRadius: 8, border: "1px solid #F0F0F0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>{o.orderNo || "—"}</span>
                        <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono)", fontWeight: 600, color: "#0070F3" }}>¥{Number(o.amount || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 10, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>
                          {new Date(o.createdAt).toLocaleString("zh-CN")} · {o.status === 1 ? "已支付" : o.status === 0 ? "待支付" : o.status === 3 ? "已退款" : "—"}
                        </span>
                        <span style={{ fontSize: 10, color: "#737373", fontFamily: "var(--font-sans)" }}>{o.paymentMethod === "wechat" ? "微信" : o.paymentMethod === "alipay" ? "支付宝" : "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: 20, color: "#A3A3A3", fontSize: 12 }}>暂无订单记录</div>
              )}
            </div>
          </div>
        </>
      )}

      <MobileNav activeTab={mobileTab} onTabChange={handleTabChange} />
    </div>
  );
}
