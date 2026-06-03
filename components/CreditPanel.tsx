"use client";

interface CreditPanelProps {
  credits: { referral: number; purchased: number };
  onClose: () => void;
}

export default function CreditPanel({ credits, onClose }: CreditPanelProps) {
  const total = credits.referral + credits.purchased;
  const isExhausted = total === 0;
  const isLow = total <= 3 && total > 0;

  return (
    <div className="w-80 rounded-xl border shadow-lg p-0 overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--line)" }}>
      {/* Warning Banner (when exhausted) */}
      {isExhausted && (
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: "var(--negative-soft)" }}>
          <span className="badge badge-negative text-[9px] tracking-wider font-bold" style={{ fontFamily: "var(--font-mono)" }}>
            LIMIT_WARNING
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--negative)" }}>
            // 额度超限
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3" style={{ background: "var(--panel)" }}>
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{
          background: isExhausted ? "var(--text-hint)" : isLow ? "var(--warning)" : "var(--positive)",
          boxShadow: isExhausted ? "none" : `0 0 8px ${isLow ? "var(--warning)" : "var(--positive)"}44`,
        }} />
        <div>
          <div className="text-sm font-bold" style={{ color: "var(--text-strong)" }}>
            {isExhausted ? "额度已用完" : isLow ? "额度即将耗尽" : "额度已激活"}
          </div>
          <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {isExhausted
              ? "裂变与付费额度均已用完"
              : isLow
              ? `剩余 ${total} 次确权额度 · 建议补充`
              : `可用额度：${total} 次`}
          </div>
        </div>
        <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-[var(--bg-hover)]" style={{ color: "var(--text-muted)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        </button>
      </div>

      {/* Pools */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--panel)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--positive-soft)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-strong)" }}>裂变池</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>邀请好友获得 · 上限100次</div>
            </div>
          </div>
          <span className="text-lg font-bold" style={{ color: credits.referral > 0 ? "var(--positive)" : "var(--text-hint)", fontFamily: "var(--font-mono)" }}>{credits.referral}</span>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--panel)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-soft)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <div className="text-xs font-semibold" style={{ color: "var(--text-strong)" }}>付费池</div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>直接购买 · ¥99/50次</div>
            </div>
          </div>
          <span className="text-lg font-bold" style={{ color: credits.purchased > 0 ? "var(--accent)" : "var(--text-hint)", fontFamily: "var(--font-mono)" }}>{credits.purchased}</span>
        </div>
      </div>

      {/* Total */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: isExhausted ? "var(--negative-soft)" : "var(--positive-soft)" }}>
          <span className="text-xs font-semibold" style={{ color: "var(--text-strong)" }}>可用额度</span>
          <span className="text-lg font-bold" style={{ color: isExhausted ? "var(--negative)" : "var(--positive)", fontFamily: "var(--font-mono)" }}>{total}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 py-3 border-t grid grid-cols-3 gap-2" style={{ borderColor: "var(--line)" }}>
        {[{ label: "累计提报", value: 0 }, { label: "累计购买", value: 0 }, { label: "已确权", value: 0 }].map((s) => (
          <div key={s.label} className="text-center">
            <div className="text-[13px] font-bold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>{s.value}</div>
            <div className="text-[10px]" style={{ color: "var(--text-hint)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-5 py-3 border-t flex gap-2" style={{ borderColor: "var(--line)" }}>
        <button className="btn-primary text-xs flex-1">提交数据获取额度</button>
        <button className="btn-secondary text-xs flex-1">购买额度</button>
      </div>
    </div>
  );
}
