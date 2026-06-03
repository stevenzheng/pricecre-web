"use client";

import { useEffect, useCallback } from "react";
import { PropertyType } from "@/types/indicators";
import { cityList, propertyTypeLabels } from "@/lib/mock-data";

/* ===== Unified SVG Icons ===== */

const IconBuilding = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 6h2M13 6h2M9 10h2M13 10h2M9 14h2M13 14h2" />
  </svg>
);

const IconStore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l1.5-5.5A2 2 0 016.5 2h11a2 2 0 012 1.5L21 9" />
    <path d="M3 9v11a2 2 0 002 2h14a2 2 0 002-2V9" />
    <path d="M9 22V12h6v10" />
  </svg>
);

const IconFactory = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 20a2 2 0 002 2h16a2 2 0 002-2V8l-7-6-7 6v12" />
    <path d="M9 18h2M13 18h2M9 14h2M13 14h2" />
  </svg>
);

const IconAll = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const propertyTypeIcons: Record<string, React.ReactNode> = {
  OFFICE: <IconBuilding />,
  SHOPS: <IconStore />,
  INDUSTRIAL: <IconFactory />,
};

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeCity: string;
  onCityChange: (city: string) => void;
  activeType: PropertyType | "ALL";
  onTypeChange: (type: PropertyType | "ALL") => void;
}

export default function HamburgerMenu({
  isOpen,
  onClose,
  activeCity,
  onCityChange,
  activeType,
  onTypeChange,
}: HamburgerMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleCitySelect = useCallback((city: string) => { onCityChange(city); }, [onCityChange]);
  const handleTypeSelect = useCallback((type: PropertyType | "ALL") => { onTypeChange(type); }, [onTypeChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] overflow-y-auto"
        style={{
          backgroundColor: "var(--bg)",
          borderRight: "1px solid var(--line)",
          animation: "slide-in-left 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <span className="font-medium text-[15px]" style={{ color: "var(--text-strong)" }}>PriceCRE</span>
            <span className="text-[12px] font-normal tracking-wide" style={{ color: "var(--text-muted)" }}>地产价值</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--panel)] transition-colors"
            aria-label="关闭"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Cities */}
        <div className="px-5 pt-5 pb-3">
          <div className="section-title">城市</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCitySelect("全部")}
              className={`chip ${activeCity === "全部" ? "active" : ""}`}
            >
              全部
            </button>
            {cityList.map((city) => (
              <button
                key={city}
                onClick={() => handleCitySelect(city)}
                className={`chip ${activeCity === city ? "active" : ""}`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Asset Classes */}
        <div className="px-5 pt-3 pb-5 border-b" style={{ borderColor: "var(--line)" }}>
          <div className="section-title">业态</div>
          <div className="space-y-1">
            <button
              onClick={() => handleTypeSelect("ALL")}
              className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeType === "ALL" ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--panel)]"
              }`}
            >
              <IconAll />
              <span>全部</span>
            </button>
            {Object.values(PropertyType).map((type) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeType === type ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--panel)]"
                }`}
              >
                {propertyTypeIcons[type]}
                <span>{propertyTypeLabels[type]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-5 py-5">
          <div className="section-title">快捷操作</div>
          <div className="space-y-1">
            <button onClick={onClose} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--panel)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              地图视图
            </button>
            <button onClick={onClose} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--panel)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              互享兑换
            </button>
            <button onClick={onClose} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--panel)] transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              个人中心
            </button>
          </div>
        </div>

        {/* Version */}
        <div className="px-5 py-4 border-t" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center justify-between">
            <span className="text-[10px]" style={{ color: "var(--text-hint)", fontFamily: "var(--font-mono)" }}>
              v3.0.0_MODULAR
            </span>
            <span className="flex items-center gap-1.5">
              <span className="badge-live-dot" />
              <span className="text-[10px] font-bold tracking-wider" style={{ color: "var(--positive)", fontFamily: "var(--font-mono)" }}>
                LIVE
              </span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
