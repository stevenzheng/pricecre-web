"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReferralClient({ code }: { code: string }) {
  const router = useRouter();

  useEffect(() => {
    if (code && typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("pricecre_referral") || "{}");
        stored.code = code;
        stored.referredAt = Date.now();
        localStorage.setItem("pricecre_referral", JSON.stringify(stored));
      } catch {
        localStorage.setItem("pricecre_referral", code);
      }
    }
    router.replace(`/?ref=${code}`);
  }, [code, router]);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "var(--bg)",
      color: "var(--text)", fontFamily: "var(--font-sans)", gap: 16, padding: 24
    }}>
      <div style={{ fontSize: 48 }}>🏢</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text-strong)", margin: 0 }}>
        PriceCRE · 地产价值
      </h1>
      <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0, textAlign: "center", maxWidth: 320 }}>
        正在跳转至资产数据面板...
      </p>
      <div style={{
        width: 32, height: 32, border: "3px solid var(--panel)",
        borderTopColor: "var(--accent)", borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }} />
    </div>
  );
}
