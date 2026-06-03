import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PriceCRE · 地产价值 — 商业地产量化精算终端",
  description:
    "基于金融终端美学的商业地产量化精算平台，覆盖写字楼、商业零售、产业园三大赛道，提供 18 维 47 项资产精算指标。",
  keywords: [
    "商业地产",
    "量化精算",
    "租金分析",
    "资产估值",
    "写字楼",
    "产业园",
    "商业零售",
  ],
  authors: [{ name: "PriceCRE" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
        style={{
          fontFamily: "var(--font-sans)",
        }}
      >
        {children}
      </body>
    </html>
  );
}
