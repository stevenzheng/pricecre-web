// scripts/seed-data-sources.ts
// 预置全部可用数据源 — 在线地产数据 + 第三方开放数据
// 运行: npx tsx scripts/seed-data-sources.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCES = [
  // ═══ 四大 CRE 平台 — SSR_HTML ═══
  { name: "贝壳商办·上海",      url: "https://office.ke.com/sh/pudong/",    sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize", wale:"leaseTerm" }, crawlConfig: { maxPages:3, route:"beike" }, priority: 10 },
  { name: "贝壳商办·北京",      url: "https://office.ke.com/bj/chaoyang/",  sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:3, route:"beike" }, priority: 10 },
  { name: "贝壳商办·深圳",      url: "https://office.ke.com/sz/nanshan/",   sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:2, route:"beike" }, priority: 9 },
  { name: "好租·上海",           url: "https://shanghai.haozu.com/office/",  sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:3, route:"haozu" }, priority: 9 },
  { name: "好租·北京",           url: "https://beijing.haozu.com/office/",   sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:2, route:"haozu" }, priority: 8 },
  { name: "安居客·上海写字楼",  url: "https://shanghai.anjuke.com/office/", sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:3, route:"anjuke" }, priority: 8 },
  { name: "安居客·北京写字楼",  url: "https://beijing.anjuke.com/office/",  sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:2, route:"anjuke" }, priority: 7 },
  { name: "点点租·上海",         url: "https://shanghai.diandianzu.com/",    sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:3, route:"diandianzu" }, priority: 8 },
  { name: "点点租·北京",         url: "https://beijing.diandianzu.com/",     sourceType: "SSR_HTML", fieldMap: { faceRent:"price", area:"floorSize" },        crawlConfig: { maxPages:2, route:"diandianzu" }, priority: 7 },
  { name: "贝壳商办·苏州",      url: "https://office.ke.com/su/",           sourceType: "SSR_HTML", fieldMap: { faceRent:"price" },                           crawlConfig: { maxPages:2, route:"beike" }, priority: 6 },
  { name: "贝壳商办·成都",      url: "https://office.ke.com/cd/",           sourceType: "SSR_HTML", fieldMap: { faceRent:"price" },                           crawlConfig: { maxPages:2, route:"beike" }, priority: 6 },
  { name: "贝壳商办·广州",      url: "https://office.ke.com/gz/",           sourceType: "SSR_HTML", fieldMap: { faceRent:"price" },                           crawlConfig: { maxPages:2, route:"beike" }, priority: 6 },

  // ═══ 企业迁入/总部集聚 — EXTERNAL_API ═══
  { name: "天眼查·企业工商变更",  url: "https://openapi.tianyancha.com",     sourceType: "EXTERNAL_API", fieldMap: { netCorporateMigration:"count", hqSupplyChainRatio:"ratio" }, crawlConfig: { apiKeyRequired:true, interval:60000 }, priority: 5 },
  { name: "企查查·企业注册",      url: "https://openapi.qcc.com",            sourceType: "EXTERNAL_API", fieldMap: { netCorporateMigration:"count" },        crawlConfig: { apiKeyRequired:true, interval:60000 }, priority: 5 },

  // ═══ ESG 认证 — JSON_LD / SSR_HTML ═══
  { name: "LEED 项目库",          url: "https://www.usgbc.org/projects",    sourceType: "JSON_LD",  fieldMap: { esgCertification:"certification" },          crawlConfig: { route:"jsonld" }, priority: 4 },
  { name: "BREEAM 认证库",        url: "https://www.breeam.com/projects/",  sourceType: "JSON_LD",  fieldMap: { esgCertification:"certification" },          crawlConfig: { route:"jsonld" }, priority: 4 },

  // ═══ 商圈市场数据 — EXTERNAL_API ═══
  { name: "仲量联行 JLL 季报",   url: "https://www.joneslanglasalle.com.cn", sourceType: "SSR_HTML", fieldMap: { submarketVacancy:"vacancyRate", capRate:"marketCapRate" }, crawlConfig: { interval:86400000 }, priority: 5 },

  // ═══ 土地市场 — SSR_HTML ═══
  { name: "中国土地市场网",       url: "https://www.landchina.com",         sourceType: "SSR_HTML", fieldMap: { landFloorPrice:"price" },                  crawlConfig: { maxPages:5, interval:10000 }, priority: 3 },

  // ═══ 社交舆情 — 已有 Exa + MiniMax，作为 API 源注册 ═══
  { name: "Exa 社交搜索（微博/小红书）", url: "https://api.exa.ai",          sourceType: "EXTERNAL_API", fieldMap: { kolBuzzIndex:"buzz", negativeSentimentRate:"sentiment" }, crawlConfig: { provider:"exa" }, priority: 4 },

  // ═══ 商圈人口 — EXTERNAL_API ═══
  { name: "高德地图·商圈热力",    url: "https://restapi.amap.com",          sourceType: "EXTERNAL_API", fieldMap: { tradeAreaPopulation:"population", demographicPremiumScore:"score" }, crawlConfig: { apiKeyRequired:true, interval:3600000 }, priority: 4 },

  // ═══ 大宗交易 — RSS/SSR ═══
  { name: "观点地产网·大宗交易",  url: "https://www.guandian.cn",           sourceType: "SSR_HTML", fieldMap: { compTxPrice:"price" },                     crawlConfig: { maxPages:2, interval:5000 }, priority: 3 },
  { name: "赢商网·交易记录",      url: "https://www.winshang.com",          sourceType: "SSR_HTML", fieldMap: { compTxPrice:"price" },                     crawlConfig: { maxPages:2 }, priority: 3 },
];

async function main() {
  const existing = await prisma.dataSourceRegistry.count();
  if (existing > 0) {
    await prisma.dataSourceRegistry.deleteMany();
    console.log(`已清除 ${existing} 条旧数据源`);
  }

  let created = 0;
  for (const s of SOURCES) {
    await prisma.dataSourceRegistry.create({ data: s as any });
    created++;
  }

  console.log(`已预置 ${created} 个数据源 (SSR:${SOURCES.filter(s=>s.sourceType==="SSR_HTML").length} API:${SOURCES.filter(s=>s.sourceType==="EXTERNAL_API").length} JSONLD:${SOURCES.filter(s=>s.sourceType==="JSON_LD").length})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
