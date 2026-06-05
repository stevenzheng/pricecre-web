import { Metadata } from "next";
import { PrismaClient } from "@prisma/client";
import ReferralClient from "./ReferralClient";

const prisma = new PrismaClient();

export async function generateMetadata({
  params,
}: {
  params: { code: string };
}): Promise<Metadata> {
  const code = params.code;
  const title = `PriceCRE · 地产价值 — 解锁真实租金数据`;
  const description = `邀请你查看 ${code} 分享的商业地产精算指标 · 写字楼/商业零售/产业园全覆盖 · 47项指标实时解锁`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://pricecre.com/r/${code}`,
      images: [
        {
          url: "https://pricecre.com/og.png",
          width: 1200,
          height: 630,
          alt: "PriceCRE · 地产价值",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["https://pricecre.com/og.png"],
    },
  };
}

export default function ReferralPage({
  params,
}: {
  params: { code: string };
}) {
  return <ReferralClient code={params.code} />;
}
