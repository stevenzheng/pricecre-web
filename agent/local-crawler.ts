#!/usr/bin/env node
// agent/local-crawler.ts — 本地爬虫代理
// 运行: npx tsx agent/local-crawler.ts
// 功能: 从 DataSourceRegistry API 读取活跃数据源，本地执行爬取，写入审核队列
//
// 反爬策略:
// - 真实浏览器 User-Agent 轮换
// - 随机请求延迟 (2-8秒)
// - 自动重试 (最多3次)
// - 支持每个站点自定义 headers/延迟

import axios from "axios";
import crypto from "crypto";

const API_BASE = process.env.PRICECRE_API || "https://pricecre.com/api";
const CONCURRENCY = 2;
const MIN_DELAY_MS = 2000;
const MAX_DELAY_MS = 8000;

// 真实浏览器 UA 池
const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
];

interface DataSource {
  id: string; name: string; url: string; sourceType: string;
  fieldMap: Record<string, string>; crawlConfig: Record<string, any>;
}

function randomUA() { return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]; }
function randomDelay() { return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS); }

function extractFaceRent(html: string): number | null {
  const patterns = [
    /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:㎡|平|m2)\s*[\/／]\s*(?:天|日)/i,
    /(\d+[\d.]*)\s*(?:元|￥|¥)\s*[\/／]\s*(?:天|日)/i,
    /单价\s*[:：]\s*(\d+[\d.]*)/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && parseFloat(m[1]) > 0) return parseFloat(m[1]);
  }
  return null;
}

function extractArea(html: string): number | null {
  const re = /(\d+[\d,.]*)\s*(?:㎡|m²|m2|平方米|平米)/i;
  const m = html.match(re);
  if (m) { const v = parseFloat(m[1].replace(/,/g, "")); if (v > 0 && v < 1000000) return v; }
  return null;
}

function extractListingNames(html: string): string[] {
  const names = new Set<string>();
  // 匹配常见楼盘/大厦名称
  const patterns = [
    /(?:title|name|项目)[^>]*>([^<]{4,30}(?:大厦|广场|中心|国际|花园|园区|城|楼|寓|馆))</gi,
    /<a[^>]*>([^<]{4,30}(?:大厦|广场|中心|国际|花园|园区|城|楼))<\/a>/gi,
    /"name"\s*:\s*"([^"]+?)"/gi,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) names.add(m[1].trim());
  }
  return [...names].slice(0, 20);
}

async function crawlOne(source: DataSource) {
  const headers: Record<string, string> = {
    "User-Agent": randomUA(),
    "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Cache-Control": "no-cache",
  };

  // 默认浏览器行为
  headers["Sec-Ch-Ua"] = '"Chromium";v="128"';
  headers["Sec-Ch-Ua-Mobile"] = "?0";
  headers["Sec-Ch-Ua-Platform"] = '"macOS"';

  const startTime = Date.now();
  let attempts = 0;

  while (attempts < 3) {
    attempts++;
    try {
      const res = await axios.get(source.url, { headers, timeout: 25000, maxRedirects: 3, validateStatus: s => s < 500 });
      const html: string = res.data;

      console.log(`  [${source.name}] HTTP ${res.status} | ${((Date.now() - startTime) / 1000).toFixed(1)}s | ${html.length} bytes`);

      // 提取数据
      const faceRent = extractFaceRent(html);
      const area = extractArea(html);
      const names = extractListingNames(html);

      console.log(`    租金: ${faceRent ?? "未提取"} | 面积: ${area ?? "未提取"} | 名称: ${names.length}个`);

      // 写回 API
      if (names.length > 0 || faceRent) {
        try {
          await axios.post(`${API_BASE}/agent/pipeline`, {
            projectName: names[0] || source.name,
            propertyType: "OFFICE",
            city: "shanghai",
            district: "pudong",
            rawPriceText: faceRent ? `${faceRent}元/㎡/天` : "0",
            area,
          }, { headers: { "Content-Type": "application/json" }, timeout: 30000 });
          console.log(`    ✅ 已写入管线`);
        } catch (e) {
          console.log(`    ⚠️ 写入失败: ${(e as Error).message}`);
        }
      }

      return { status: "SUCCESS", names: names.length, faceRent, area, bytes: html.length };
    } catch (err: any) {
      console.log(`  [${source.name}] 第${attempts}次失败: ${err.message?.slice(0, 80)}`);
      if (attempts < 3) await new Promise(r => setTimeout(r, 3000));
    }
  }

  return { status: "FAILED", error: `重试${attempts}次后仍失败` };
}

async function main() {
  console.log("🚀 PriceCRE 本地爬虫代理启动\n");

  // 1. 获取活跃数据源
  console.log("📡 获取数据源列表...");
  const { data } = await axios.get(`${API_BASE}/admin/data-sources`);
  const sources: DataSource[] = data.sources.filter((s: any) => s.isActive);
  console.log(`   共 ${data.sources.length} 个源，${sources.length} 活跃\n`);

  // 2. 串行爬取（间隔延迟）
  let success = 0, failed = 0;
  for (const source of sources) {
    console.log(`\n🔍 [${source.name}] ${source.sourceType}`);
    console.log(`   ${source.url}`);

    const result = await crawlOne(source);

    // 更新数据源状态
    try {
      await axios.put(`${API_BASE}/admin/data-sources/${source.id}`, {
        lastRunAt: new Date().toISOString(),
        lastStatus: result.status,
      });
    } catch {}

    if (result.status === "SUCCESS") success++; else failed++;

    // 间隔等待
    const wait = randomDelay();
    console.log(`   ⏳ 等待 ${(wait / 1000).toFixed(1)}秒...`);
    await new Promise(r => setTimeout(r, wait));
  }

  console.log(`\n\n🏁 完成: 成功 ${success} / 失败 ${failed} / 总计 ${sources.length}`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
