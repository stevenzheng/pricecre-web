// scripts/seed-crawl-targets.ts
// 预置爬取目标站点 — 基于 MD 文档定义的四大平台 + 上海核心商圈
// 运行: npx tsx scripts/seed-crawl-targets.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGETS = [
  // 贝壳商办 — 上海核心商圈
  { label: "贝壳·陆家嘴写字楼", targetUrl: "https://office.ke.com/shanghai/lujiazui", propertyType: "OFFICE" as const, city: "shanghai", district: "lujiazui" },
  { label: "贝壳·静安写字楼", targetUrl: "https://office.ke.com/shanghai/jingan", propertyType: "OFFICE" as const, city: "shanghai", district: "jing_an" },
  { label: "贝壳·张江办公+产业园", targetUrl: "https://office.ke.com/shanghai/zhangjiang", propertyType: "OFFICE" as const, city: "shanghai", district: "zhangjiang" },
  { label: "贝壳·前滩商圈", targetUrl: "https://office.ke.com/shanghai/qiantan", propertyType: "SHOPS" as const, city: "shanghai", district: "qiantan" },

  // 贝壳商办 — 北京
  { label: "贝壳·朝阳写字楼", targetUrl: "https://office.ke.com/beijing/chaoyang", propertyType: "OFFICE" as const, city: "beijing", district: "chaoyang" },
  { label: "贝壳·海淀办公", targetUrl: "https://office.ke.com/beijing/haidian", propertyType: "OFFICE" as const, city: "beijing", district: "haidian" },

  // 好租
  { label: "好租·上海办公", targetUrl: "https://shanghai.haozu.com/office", propertyType: "OFFICE" as const, city: "shanghai", district: "pudong" },
  { label: "好租·上海商铺", targetUrl: "https://shanghai.haozu.com/shop", propertyType: "SHOPS" as const, city: "shanghai", district: "pudong" },
  { label: "好租·北京办公", targetUrl: "https://beijing.haozu.com/office", propertyType: "OFFICE" as const, city: "beijing", district: "chaoyang" },

  // 安居客
  { label: "安居客·上海写字楼", targetUrl: "https://shanghai.anjuke.com/office", propertyType: "OFFICE" as const, city: "shanghai", district: "pudong" },
  { label: "安居客·北京写字楼", targetUrl: "https://beijing.anjuke.com/office", propertyType: "OFFICE" as const, city: "beijing", district: "chaoyang" },

  // 点点租
  { label: "点点租·上海", targetUrl: "https://shanghai.diandianzu.com", propertyType: "OFFICE" as const, city: "shanghai", district: "pudong" },
  { label: "点点租·北京", targetUrl: "https://beijing.diandianzu.com", propertyType: "OFFICE" as const, city: "beijing", district: "chaoyang" },
];

async function main() {
  const existing = await prisma.scheduledCrawlJob.count();
  if (existing > 0) {
    console.log(`已有 ${existing} 个爬取目标，跳过种子`);
    return;
  }

  let created = 0;
  for (const t of TARGETS) {
    await prisma.scheduledCrawlJob.create({
      data: {
        label: t.label,
        targetUrl: t.targetUrl,
        propertyType: t.propertyType,
        city: t.city,
        district: t.district,
        scheduleHour: 2,
        scheduleMinute: 0,
      },
    });
    created++;
  }

  console.log(`已预置 ${created} 个爬取目标站点`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
