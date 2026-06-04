"use client";

interface WechatCardProps {
  projectName: string;
  city: string;
  district: string;
  faceRent: number;
  propertyType: string;
  indicators: { label: string; value: string }[];
  onClose: () => void;
}

export default function WechatCard({ projectName, city, district, faceRent, propertyType, indicators, onClose }: WechatCardProps) {
  const url = `https://pricecre.com`;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative max-w-[360px] w-[92vw] rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2"><rect x="8" y="2" width="8" height="4" rx="1"/><rect x="8" y="10" width="8" height="4" rx="1"/><rect x="8" y="18" width="8" height="4" rx="1"/><rect x="2" y="6" width="6" height="3" rx="1"/><rect x="2" y="14" width="6" height="3" rx="1"/><rect x="2" y="22" width="6" height="3" rx="1"/><rect x="16" y="6" width="6" height="3" rx="1"/><rect x="16" y="14" width="6" height="3" rx="1"/></svg>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>PriceCRE · 地产价值</span>
          </div>

          {/* Project Info */}
          <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text-strong)" }}>{projectName}</h3>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{city} · {district} · {propertyType}</p>

          {/* Rent Highlight */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>挂牌租金面价</span>
            <span className="text-2xl font-medium ml-2" style={{ color: "var(--accent)", fontFamily: "var(--font-mono)" }}>¥{faceRent.toFixed(1)}</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>/㎡/天</span>
          </div>
        </div>

        {/* Indicator Grid */}
        {indicators.length > 0 && (
          <div className="px-5 pb-4">
            <div className="grid grid-cols-3 gap-1.5">
              {indicators.slice(0, 9).map((ind) => (
                <div key={ind.label} className="p-2 rounded-lg text-center" style={{ background: "var(--panel)" }}>
                  <div className="text-[10px] mb-0.5" style={{ color: "var(--text-hint)" }}>{ind.label}</div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>{ind.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code + Footer */}
        <div className="px-5 pb-5 flex items-center gap-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(url)}&margin=8`}
            alt="QR"
            className="w-20 h-20 rounded-lg flex-shrink-0"
            style={{ background: "#fff", padding: 4 }}
          />
          <div className="text-[10px] leading-relaxed" style={{ color: "var(--text-hint)" }}>
            <p>扫码查看完整数据</p>
            <p className="mt-1">长按保存图片分享</p>
            <p className="mt-2 font-bold" style={{ color: "var(--text-strong)" }}>pricecre.com</p>
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--panel)]"
          style={{ background: "rgba(0,0,0,0.3)", color: "var(--text-inverse)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  );
}
