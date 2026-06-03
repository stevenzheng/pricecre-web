import { pushCleanedDataToCloud } from "./sync-pipeline";

const localMockCleanedAssets = [
  {
    name: "金茂大厦",
    city: "上海",
    district: "浦东新区",
    address: "世纪大道88号",
    type: "OFFICE" as const,
    facePrice: 12.0,
    indicatorsBag: {
      netEffectiveRent: 9.8,
      netCorporateMigration: 0.08,
      submarketVacancy: 0.14,
      wale: 3.8,
      recentTransactionCount: 5
    }
  },
  {
    name: "恒隆广场",
    city: "上海",
    district: "静安区",
    address: "南京西路1266号",
    type: "OFFICE" as const,
    facePrice: 18.0,
    indicatorsBag: {
      netEffectiveRent: 15.2,
      netCorporateMigration: 0.21,
      submarketVacancy: 0.09,
      wale: 5.0,
      recentTransactionCount: 7
    }
  },
  {
    name: "港汇恒隆广场",
    city: "上海",
    district: "徐汇区",
    address: "虹桥路1号",
    type: "SHOPS" as const,
    facePrice: 25.0,
    indicatorsBag: {
      netEffectiveRent: 21.0,
      openToCloseRatio: 1.15,
      footfallPulseRate: 3.1,
      recentTransactionCount: 11
    }
  }
];

async function startAgentSync() {
  console.log("🚀 [Agent] 启动高频脱机数据同步管线...");
  await pushCleanedDataToCloud(localMockCleanedAssets);
  console.log("🏁 [Agent] 本批次直灌并网全部结束。");
}

startAgentSync().catch((error: unknown) => {
  console.error("❌ [Agent] 直灌管线执行失败。");
  console.error(error);
  process.exit(1);
});
