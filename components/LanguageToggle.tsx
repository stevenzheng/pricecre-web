"use client";

interface LanguageToggleProps {
  lang: "zh" | "en";
  onToggle: () => void;
}

export default function LanguageToggle({ lang, onToggle }: LanguageToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-colors hover:bg-[var(--panel)]"
      style={{
        color: "var(--text-muted)",
        fontFamily: "var(--font-mono)",
      }}
      aria-label="Switch language"
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
