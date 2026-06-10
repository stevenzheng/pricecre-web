// POST /api/agent/discover-sources — AI 自动发现数据源
// 用 Tavily 搜索指定城市的商业地产房源平台，提取站点域名，
// 自动添加为 ScheduledCrawlJob（默认停用，人工确认后启用）
// body: { city?: "shanghai" | ... }  缺省 shanghai
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const CITY_ZH: Record<string, string> = {
  shanghai: "上海", beijing: "北京", shenzhen: "深圳", guangzhou: "广州",
  hangzhou: "杭州", chengdu: "成都", suzhou: "苏州", changsha: "长沙", xian: "西安",
};

// 排除非数据源站点（社区/百科/新闻）
const EXCLUDED_DOMAINS = ["zhihu.com", "baidu.com", "xiaohongshu.com", "weibo.com", "douyin.com", "bilibili.com", "sohu.com", "163.com", "qq.com", "sina.com", "wikipedia.org", "toutiao.com"];

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "TAVILY_API_KEY 未配置" }, { status: 500 });

    const body = await req.json().catch(() => ({}));
    const city = CITY_ZH[body.city] ? body.city : "shanghai";
    const cityZh = CITY_ZH[city];

    // 两路搜索：写字楼租赁平台 + 商业地产数据网站
    const queries = [
      `${cityZh} 写字楼出租 平台 网站`,
      `${cityZh} 商业地产 商铺 产业园 租赁 网站`,
    ];

    const domains = new Map<string, { title: string; url: string }>();
    for (const query of queries) {
      try {
        const res = await axios.post("https://api.tavily.com/search", {
          api_key: apiKey, query, search_depth: "basic", max_results: 10,
        }, { headers: { "Content-Type": "application/json" }, timeout: 30000 });
        for (const r of res.data?.results || []) {
          try {
            const u = new URL(r.url);
            const host = u.hostname.replace(/^www\./, "");
            if (EXCLUDED_DOMAINS.some((d) => host.endsWith(d))) continue;
            if (!domains.has(host)) domains.set(host, { title: (r.title || host).slice(0, 40), url: `${u.protocol}//${u.hostname}` });
          } catch {}
        }
      } catch {}
    }

    if (domains.size === 0) {
      return NextResponse.json({ success: true, discovered: 0, added: 0, msg: "未发现新站点" });
    }

    // 去重：已有相同域名的任务不重复添加
    const existing = await prisma.scheduledCrawlJob.findMany({ select: { targetUrl: true } });
    const existingHosts = new Set(existing.map((e) => { try { return new URL(e.targetUrl).hostname.replace(/^www\./, ""); } catch { return e.targetUrl; } }));

    let added = 0;
    const newSources: string[] = [];
    for (const [host, info] of Array.from(domains.entries())) {
      if (existingHosts.has(host)) continue;
      try {
        await prisma.scheduledCrawlJob.create({
          data: {
            label: `AI发现·${info.title}`,
            targetUrl: info.url,
            propertyType: "OFFICE",
            city,
            district: "all",
            isActive: false, // 默认停用，人工确认后启用
            lastRunStatus: "PENDING",
          },
        });
        added++;
        newSources.push(host);
      } catch {}
    }

    return NextResponse.json({
      success: true,
      discovered: domains.size,
      added,
      newSources,
      msg: added > 0 ? `发现 ${domains.size} 个站点，新增 ${added} 个数据源（默认停用，请确认后启用）` : `发现 ${domains.size} 个站点，均已存在`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
