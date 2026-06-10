"use client";

import { useState, useEffect } from "react";

interface AIAnalysisProps {
  projectName: string; city: string; district: string; propertyType: string;
  faceRent: number; netEffectiveRent: number | null;
  indicators: { label: string; value: string; key: string }[];
  email?: string; propertyId?: string;
  onClose: () => void;
}

export default function AIAnalysis({
  projectName, city, district, propertyType, faceRent, netEffectiveRent, indicators, email, propertyId, onClose,
}: AIAnalysisProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{ id?: string; score: number; positives: string[]; negatives: string[]; conclusion: string } | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, city, district, propertyType, faceRent, netEffectiveRent, indicators, email }),
    }).then(r => r.json()).then(async data => {
      if (cancelled) return;
      if (data.error) { setError(data.error); setLoading(false); return; }
      setAnalysis({ score: data.score, positives: data.positives || [], negatives: data.negatives || [], conclusion: data.conclusion });
      setLoading(false);
      // Auto-save report
      try { fetch("/api/ai/save-report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email || "anonymous", propertyId: propertyId || "", projectName, city, district, propertyType, content: data.conclusion, summary: data.score + "分 · " + (data.positives || []).slice(0, 2).join("; ") }) }); } catch {}
      // Pre-generate share cache so "分享" is instant
      if (data.score) {
        try {
          const cr = await fetch("/api/ai/analysis-cache", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectName, city, district, propertyType, faceRent, netEffectiveRent, analysis: { score: data.score, positives: data.positives || [], negatives: data.negatives || [], conclusion: data.conclusion }, indicators }),
          });
          const cd = await cr.json();
          if (cd.id) setShareId(cd.id);
        } catch {}
      }
    }).catch(() => {
      if (!cancelled) { setError("分析失败"); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [projectName, city, district, propertyType, faceRent, netEffectiveRent, indicators]);

  const saveCacheAndGetId = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/ai/analysis-cache", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectName, city, district, propertyType, faceRent, netEffectiveRent, analysis, indicators }),
      });
      const d = await res.json();
      return d.id || null;
    } catch { return null; }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.share) { await navigator.share({ title: `${projectName} - 资产全维度价值指标`, url: text }); return; }
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.opacity = "0"; ta.style.position = "fixed";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); document.body.removeChild(ta);
    }
  };

  // 短链接：报告页支持前 8 位短编号访问
  const getShareUrl = (id: string) => `${window.location.origin}/a/${id.slice(0, 8)}`;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative sm:max-w-[580px] lg:max-w-[680px] max-w-[92vw] w-full max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl animate-slide-up"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--line)" }} onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b" style={{ background: "var(--bg-surface)", borderColor: "var(--line)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2a4 4 0 014 4c0 1.1-.4 2.1-1.2 2.8l1.2 1.2c1.5-1 3.5-1.2 5.2-.4-1.1 1.6-2.3 3.1-3.7 4.4A12 12 0 0121 17.6c-1.7-1-3.7-1.4-5.6-.8l-2.4 2.4V22h-2v-2.8l-2.4-2.4c-1.9-.6-3.9-.2-5.6.8A12 12 0 016.3 14c1.4-1.3 2.6-2.8 3.7-4.4 1.7-.8 3.7-.6 5.2.4l1.2-1.2A3.9 3.9 0 0112 6a4 4 0 010-4z"/><circle cx="12" cy="4" r="1.5" fill="#fff"/></svg>
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>资产全维度价值指标</span>
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <button onClick={async () => {
                const id = shareId || await saveCacheAndGetId();
                if (id) { setShareId(id); await copyToClipboard(getShareUrl(id)); setShared(true); setTimeout(() => setShared(false), 2000); }
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium"
              style={{ background: shared ? "#0D9488" : "#F7F7F7", color: shared ? "#FFF" : "#525252", border: `1px solid ${shared ? "#0D9488" : "#E5E5E5"}` }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {shared ? <path d="M20 6L9 17l-5-5"/> : <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>}
                </svg>
                {shared ? "已复制" : "分享"}
              </button>
            )}
            {analysis && (
              <button onClick={async () => {
                const id = shareId || await saveCacheAndGetId();
                if (!id) return;
                setShareId(id);
                window.open(`/a/${id}?print=1`, "_blank");
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors font-medium"
              style={{ background: "#F7F7F7", color: "#525252", border: "1px solid #E5E5E5" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                导出报告
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-[var(--panel)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="mb-4">
            <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-strong)" }}>{projectName}</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{city} · {district} · {propertyType}</p>
          </div>

          {loading && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>AI 正在分析资产数据...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm mb-3" style={{ color: "var(--negative)" }}>{error}</p>
              <button onClick={() => { setError(null); setLoading(true); window.location.reload(); }}
                className="px-4 py-2 rounded-xl text-xs font-medium" style={{ background: "var(--accent)", color: "#FFF" }}>重试</button>
            </div>
          )}

          {analysis && (
            <>
              <div className="flex items-center justify-center mb-5">
                <div style={{ width: 80, height: 80, borderRadius: "50%", background: "conic-gradient(var(--positive) 0deg, var(--positive) calc(var(--pct) * 3.6deg), var(--panel) calc(var(--pct) * 3.6deg))", display: "flex", alignItems: "center", justifyContent: "center", ["--pct" as any]: analysis.score }}>
                  <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--positive)", fontFamily: "var(--font-mono)" }}>{analysis.score}</span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--positive)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>利好因素
                </h4>
                <ul className="space-y-1.5">
                  {analysis.positives.map((p, i) => <li key={i} className="text-xs pl-4 relative" style={{ color: "var(--text-muted)" }}><span className="absolute left-0" style={{ color: "var(--positive)" }}>•</span>{p}</li>)}
                </ul>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-bold mb-2 flex items-center gap-1.5" style={{ color: "var(--negative)" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>风险提示
                </h4>
                <ul className="space-y-1.5">
                  {analysis.negatives.map((n, i) => <li key={i} className="text-xs pl-4 relative" style={{ color: "var(--text-muted)" }}><span className="absolute left-0" style={{ color: "var(--negative)" }}>•</span>{n}</li>)}
                </ul>
              </div>

              <div className="p-3 rounded-xl mb-4" style={{ background: "var(--panel)" }}>
                <h4 className="text-xs font-bold mb-1.5" style={{ color: "var(--text-strong)" }}>结束语</h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{analysis.conclusion}</p>
              </div>

              <p className="text-[10px] text-center mb-4" style={{ color: "var(--text-hint)" }}>
                资产全维度价值指标基于大模型生成，内容仅供参考，不构成投资建议
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
