"use client";

interface CorrectionRecord {
  id: string;
  fieldKey: string;
  fieldLabel: string;
  oldValue: string;
  newValue: string;
  reason: string;
  status: string;
  submittedBy: string;
  reviewedBy?: string;
  createdAt: string;
}

interface FieldCorrectionBadgeProps {
  fieldKey: string;
  corrections?: CorrectionRecord[];
  onCorrect: () => void;
}

export default function FieldCorrectionBadge({ fieldKey, corrections, onCorrect }: FieldCorrectionBadgeProps) {
  const related = (corrections || []).filter(c => c?.fieldKey === fieldKey);
  if (related.length === 0) {
    return (
      <button onClick={onCorrect} title="纠正此字段" style={{ border: "none", background: "none", cursor: "pointer", padding: "1px 4px", fontSize: 10, color: "var(--text-hint)", fontFamily: "var(--font-sans)", opacity: 0.5, lineHeight: 1 }}
        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "0.5"; }}>
        ✎
      </button>
    );
  }

  const latest = related[0];
  const statusColor = latest.status === "APPROVED" ? "#10B981" : latest.status === "REJECTED" ? "#EF4444" : "#F5A623";
  const statusIcon = latest.status === "APPROVED" ? "✓" : latest.status === "REJECTED" ? "✕" : "ⓘ";
  const statusBg = latest.status === "APPROVED" ? "rgba(16,185,129,0.12)" : latest.status === "REJECTED" ? "rgba(239,68,68,0.12)" : "rgba(245,166,35,0.12)";

  const tooltip = related.slice(0, 3).map(c =>
    `${c.submittedBy || "匿名"} · ${new Date(c.createdAt).toLocaleDateString("zh-CN")}\n${c.oldValue} → ${c.newValue}\n${c.status === "APPROVED" ? "✅ 已通过" : c.status === "REJECTED" ? "❌ 已拒绝" : "⏳ 待审核"}`
  ).join("\n---\n");

  return (
    <span className="correction-badge" title={tooltip} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 2 }}>
      <button onClick={onCorrect} style={{ border: "none", background: "none", cursor: "pointer", padding: "1px 3px", fontSize: 10, color: "var(--text-hint)", fontFamily: "var(--font-sans)", opacity: 0.5, lineHeight: 1 }}
        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = "1"; }}
        onMouseLeave={e => { (e.target as HTMLElement).style.opacity = "0.5"; }}>
        ✎
      </button>
      <span style={{
        width: 14, height: 14, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: statusBg, color: statusColor, fontSize: 9, fontWeight: 700, cursor: "help", flexShrink: 0,
      }} title={tooltip}>{statusIcon}</span>
    </span>
  );
}
