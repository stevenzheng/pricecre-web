"use client";

import { useState, useEffect } from "react";

interface AIAnalysisProps {
  projectName: string;
  city: string;
  district: string;
  propertyType: string;
  faceRent: number;
  netEffectiveRent: number | null;
  indicators: { label: string; value: string; key: string }[];
  onClose: () => void;
}

export default function AIAnalysis({
  projectName,
  city,
  district,
  propertyType,
  faceRent,
  netEffectiveRent,
  indicators,
  onClose,
}: AIAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    score: number;
    positives: string[];
    negatives: string[];
    conclusion: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectName,
        city,
        district,
        propertyType,
        faceRent,
        netEffectiveRent,
        indicators,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error);
        } else {
          setAnalysis(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message || "网络异常");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectName, city, district, propertyType, faceRent, netEffectiveRent, indicators]);

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative max-w-[420px] w-[92vw] max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-slide-up"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b" style={{ background: "var(--bg-surface)", borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 014 4c0 1.1-.4 2.1-1.2 2.8l1.2 1.2c1.5-1 3.5-1.2 5.2-.4-1.1 1.6-2.3 3.1-3.7 4.4A12 12 0 0121 17.6c-1.7-1-3.7-1.4-5.6-.8l-2.4 2.4V22h-2v-2.8l-2.4-2.4c-1.9-.6-3.9-.2-5.6.8A12 12 0 016.3 14c1.4-1.3 2.6-2.8 3.7-4.4 1.7-.8 3.7-.6 5.2.4l1.2-1.2A3.9 3.9 0 0112 6a4 4 0 010-4z"/>
                <circle cx="12" cy="4" r="1.5" fill="#fff"/>
              </svg>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>AI 精算分析</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--panel)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {/* Asset Header */}
          <div className="mb-4">
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-strong)" }}>{projectName}</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{city} · {district} · {propertyType}</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>面价</span>
              <span className="text-lg font-medium" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>¥{faceRent.toFixed(1)}</span>
              {netEffectiveRent !== null && (
                <>
                  <span className="text-xs mx-1" style={{ color: "var(--text-hint)" }}>|</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>净有效</span>
                  <span className="text-lg font-medium" style={{ color: "var(--positive)", fontFamily: "var(--font-mono)" }}>¥{netEffectiveRent.toFixed(1)}</span>
                </>
              )}
              <span className="text-xs" style={{ color: "var(--text-hint)" }}>/㎡/天</span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse" style={{ background: "var(--accent)" }}>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" />
                  <path className="opacity-75" fill="#fff" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="text-xs" style={{ color: "var(--text-hint)" }}>AI 正在实时分析 {indicators.length} 项精算指标...</p>
              <p className="text-[10px]" style={{ color: "var(--text-hint)", opacity: 0.6 }}>基于 MiniMax-M2.7 大模型 · 实时精算</p>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--negative-soft)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--negative)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <p className="text-xs" style={{ color: "var(--negative)" }}>分析失败：{error}</p>
              <button
                onClick={() => { setLoading(true); setError(null); window.location.reload(); }}
                className="text-xs px-4 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--panel)", color: "var(--text-muted)" }}
              >
                重试
              </button>
            </div>
          )}

          {/* Analysis Result */}
          {!loading && analysis && (
            <div className="animate-fade-in">
              {/* Score */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-2" style={{
                  background: analysis.score >= 75 ? "var(--positive-soft)" : analysis.score >= 50 ? "var(--accent-soft)" : "var(--negative-soft)",
                  border: `3px solid ${analysis.score >= 75 ? "var(--positive)" : analysis.score >= 50 ? "var(--accent)" : "var(--negative)"}`
                }}>
                  <span className="text-xl font-bold" style={{
                    color: analysis.score >= 75 ? "var(--positive)" : analysis.score >= 50 ? "var(--accent)" : "var(--negative)",
                    fontFamily: "var(--font-mono)"
                  }}>{analysis.score}</span>
                </div>
                <p className="text-[11px]" style={{ color: "var(--text-hint)" }}>
                  {analysis.score >= 75 ? "🌟 优质资产" : analysis.score >= 50 ? "📊 稳健资产" : "⚠️ 审慎关注"}
                  {" · "}综合精算评分
                </p>
              </div>

              {/* Positive Factors */}
              {analysis.positives.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    <span className="text-xs font-medium" style={{ color: "var(--positive)" }}>利好因素</span>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.positives.map((p, i) => (
                      <li key={i} className="text-xs pl-4 relative leading-relaxed" style={{ color: "var(--text)" }}>
                        <span className="absolute left-0 top-[6px] w-1.5 h-1.5 rounded-full" style={{ background: "var(--positive)" }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Factors */}
              {analysis.negatives.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--negative)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    <span className="text-xs font-medium" style={{ color: "var(--negative)" }}>风险提示</span>
                  </div>
                  <ul className="space-y-1.5">
                    {analysis.negatives.map((n, i) => (
                      <li key={i} className="text-xs pl-4 relative leading-relaxed" style={{ color: "var(--text)" }}>
                        <span className="absolute left-0 top-[6px] w-1.5 h-1.5 rounded-full" style={{ background: "var(--negative)" }} />
                        {n}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conclusion */}
              <div className="p-3 rounded-xl mb-4" style={{ background: "var(--panel)", border: "1px solid var(--line)" }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <span className="text-xs font-medium" style={{ color: "var(--accent)" }}>综合分析</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text)" }}>
                  {analysis.conclusion}
                </p>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-center leading-relaxed" style={{ color: "var(--text-hint)" }}>
                * 以上分析基于公开市场数据与 AI 精算模型生成，仅供参考，不构成投资建议。投资决策请结合专业顾问意见。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
