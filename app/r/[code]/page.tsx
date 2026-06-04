"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReferralPage({
  params,
}: {
  params: { code: string };
}) {
  const router = useRouter();

  useEffect(() => {
    const code = params.code;
    if (code && typeof window !== "undefined") {
      // Store referral code + referrer info
      try {
        const stored = JSON.parse(localStorage.getItem("pricecre_referral") || "{}");
        stored.code = code;
        stored.referredAt = Date.now();
        localStorage.setItem("pricecre_referral", JSON.stringify(stored));
      } catch {
        localStorage.setItem("pricecre_referral", code);
      }
    }
    // Redirect to homepage with referral context
    router.replace(`/?ref=${code}`);
  }, [params.code, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <div className="text-center space-y-3">
        <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center animate-pulse" style={{ background: "var(--accent)" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>正在进入 PriceCRE...</p>
        <p className="text-xs" style={{ color: "var(--text-hint)" }}>邀请码已验证</p>
      </div>
    </div>
  );
}
