import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  display: "swap",
  preload: true,
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "PriceCRE · 地产价值 — 商业地产量化精算终端",
  description:
    "基于金融终端美学的商业地产量化精算平台，覆盖写字楼、商业零售、产业园三大赛道，提供18维47项资产精算指标。实时行情·地图定位·AI精算分析·社交裂变增长飞轮。",
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
  openGraph: {
    title: "PriceCRE · 地产价值 — 商业地产量化精算资产终端",
    description:
      "基于金融终端美学的商业地产量化精算平台。覆盖写字楼/商业零售/产业园三大赛道，47项精算指标，AI智能分析，实时行情。打开即用，无需下载。",
    url: "https://pricecre.com",
    siteName: "PriceCRE · 地产价值",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "https://pricecre.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PriceCRE · 地产价值 — 商业地产量化精算终端",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PriceCRE · 地产价值 — 商业地产量化精算终端",
    description:
      "基于金融终端美学的商业地产量化精算平台。47项精算指标，AI智能分析，实时行情。",
    images: ["https://pricecre.com/og-image.png"],
  },
  other: {
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
  },
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
    <html lang="zh-CN" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
