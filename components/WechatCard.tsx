"use client";

import { useState, useEffect } from "react";

interface WechatCardProps {
  projectName: string;
  city: string;
  district: string;
  faceRent: number;
  propertyType: string;
  propertyId: string;
  indicators: { label: string; value: string }[];
  onClose: () => void;
}

export default function WechatCard({ projectName, city, district, faceRent, propertyType, propertyId, indicators, onClose }: WechatCardProps) {
  const propertyUrl = `https://pricecre.com/?p=${encodeURIComponent(propertyId)}`;
  const url = propertyUrl;
  const [copied, setCopied] = useState(false);
  const [isWechat, setIsWechat] = useState(false);

  useEffect(() => {
    // Detect if running inside WeChat browser
    const ua = navigator.userAgent.toLowerCase();
    setIsWechat(ua.includes("micromessenger"));
  }, []);

  const shareData = {
    title: `PriceCRE · ${projectName}`,
    desc: `${city} · ${district} · ${propertyType} | ¥${faceRent.toFixed(1)}/㎡/天 | ${indicators.length}项精算指标`,
    link: propertyUrl,
    imgUrl: "https://pricecre.com/og.png",
  };

  const handleWechatFriend = () => {
    if (!isWechat) {
      handleCopyCard();
      return;
    }
    // Use WeixinJSBridge for WeChat in-app browser sharing
    try {
      (window as any).WeixinJSBridge?.invoke("sendAppMessage", {
        ...shareData,
        img_url: shareData.imgUrl,
        link: shareData.link,
        desc: shareData.desc,
        title: shareData.title,
      });
    } catch {
      // Fallback: guide user to use ... menu
      handleCopyCard();
    }
  };

  const handleWechatMoments = () => {
    if (!isWechat) {
      handleCopyCard();
      return;
    }
    try {
      (window as any).WeixinJSBridge?.invoke("shareTimeline", {
        img_url: shareData.imgUrl,
        link: shareData.link,
        desc: shareData.desc,
        title: shareData.title,
      });
    } catch {
      handleCopyCard();
    }
  };

  const handleCopyCard = async () => {
    try {
      // Try to use the Clipboard API to copy the card as an image
      const cardEl = document.querySelector(".wechat-card-inner");
      if (cardEl) {
        // Use html2canvas if available, or fallback to text copy
        const shareText = `【PriceCRE · 地产价值】\n${projectName}\n${city} · ${district} · ${propertyType}\n挂牌租金面价: ¥${faceRent.toFixed(1)}/㎡/天\n共 ${indicators.length} 项精算指标\n查看详情: ${propertyUrl}`;
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // Fallback
      const shareText = `【PriceCRE · 地产价值】\n${projectName}\n${city} · ${district} · ${propertyType}\n挂牌租金面价: ¥${faceRent.toFixed(1)}/㎡/天\n共 ${indicators.length} 项精算指标\n了解更多: ${url}`;
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="wechat-card-inner relative max-w-[360px] w-[92vw] rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
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
        <div className="text-[10px] mb-2 px-5" style={{ color: "var(--text-hint)" }}>该资产共 {indicators.length} 项精算指标已展示</div>
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

        {/* Share Actions */}
        <div className="px-5 pb-4">
          <div className="text-[10px] mb-2" style={{ color: "var(--text-hint)" }}>分享至</div>
          <div className="flex gap-2">
            {/* WeChat Friend - 微信好友 */}
            <button
              onClick={handleWechatFriend}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: "var(--success-soft, #e8f5e9)", color: "var(--success, #2e7d32)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045c.135 0 .243-.11.243-.245 0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.178-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.952-7.062-6.122zm-2.18 1.326c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.36 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
              </svg>
              微信好友
            </button>

            {/* WeChat Moments - 朋友圈 */}
            <button
              onClick={handleWechatMoments}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105"
              style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
            >
              {copied ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                  已复制
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                    <circle cx="8" cy="10" r="1.5"/>
                    <circle cx="16" cy="8" r="1.5"/>
                    <circle cx="12" cy="16" r="1.5"/>
                    <circle cx="10" cy="7" r="1"/>
                    <circle cx="14" cy="5.5" r="0.8"/>
                    <line x1="8" y1="12" x2="12" y2="14.5" stroke="currentColor" strokeWidth="0.8"/>
                    <line x1="16" y1="10" x2="12" y2="14.5" stroke="currentColor" strokeWidth="0.8"/>
                  </svg>
                  朋友圈
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code + Footer */}
        <div className="px-5 pb-5 flex items-center gap-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(url)}&margin=8`}
            alt="QR"
            className="w-20 h-20 rounded-lg flex-shrink-0"
            style={{ background: "#fff", padding: 4 }}
          />
          <div className="text-[10px] leading-relaxed" style={{ color: "var(--text-hint)" }}>
            <p>扫码查看完整数据 · 分享好友</p>
            <p className="mt-1">长按保存图片分享</p>
            <p className="mt-2 font-bold" style={{ color: "var(--text-strong)" }}>pricecre.com</p>
            <p className="mt-0.5">数据来源：公开市场 · 2026-06-04</p>
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
