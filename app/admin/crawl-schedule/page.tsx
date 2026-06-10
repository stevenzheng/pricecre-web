"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

// ── 常量 ──────────────────────────────────────────────

const CITIES = [
  { key: "shanghai", zh: "上海" },
  { key: "beijing", zh: "北京" },
  { key: "shenzhen", zh: "深圳" },
  { key: "guangzhou", zh: "广州" },
  { key: "hangzhou", zh: "杭州" },
  { key: "chengdu", zh: "成都" },
  { key: "suzhou", zh: "苏州" },
  { key: "changsha", zh: "长沙" },
  { key: "xian", zh: "西安" },
] as const;

const TYPES = [
  { key: "OFFICE", zh: "写字楼", icon: "🏢" },
  { key: "SHOPS", zh: "商业零售", icon: "🛍️" },
  { key: "INDUSTRIAL", zh: "产业园", icon: "🏭" },
] as const;

type CellKey = string; // "city|type"
type CellData = {
  city: string; cityZh: string;
  type: string; typeZh: string;
  lastRunAt: string | null;
  lastCount: number;
  lastApproved: number;
};

// ── 辅助函数 ──────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "刚刚";
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return new Date(iso).toLocaleDateString("zh-CN");
}

// ── 组件 ──────────────────────────────────────────────

export default function CrawlSchedulePage() {
  const router = useRouter();
  const [cells, setCells] = useState<CellData[]>([]);
  const [summary, setSummary] = useState({ totalCrawled: 0, totalApproved: 0, neverRun: 0, recentlyRun: 0, total: 27 });
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<Set<CellKey>>(new Set());
  const [msg, setMsg] = useState("");
  const [crawlingAll, setCrawlingAll] = useState(false);
  const msgTimer = useRef<NodeJS.Timeout | null>(null);

  // ── 数据加载 ──────────────────────────────────────

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/status");
      const data = await res.json();
      if (data.cells) { setCells(data.cells); setSummary(data.summary); }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ── 操作 ──────────────────────────────────────────

  const showMsg = (text: string) => {
    setMsg(text);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(""), 8000);
  };

  const runCell = async (city: string, type: string) => {
    const key: CellKey = `${city}|${type}`;
    setRunning((prev) => new Set(prev).add(key));
    showMsg(`正在抓取 ${CITIES.find(c=>c.key===city)?.zh}·${TYPES.find(t=>t.key===type)?.zh} ...`);

    try {
      const res = await fetch("/api/agent/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, district: "all", propertyType: type, maxResults: 20 }),
      });
      const data = await res.json();
      if (data.success) {
        showMsg(
          `${data.raw || 0}条搜索 → ${data.processed || 0}条入库 → 可发布 ${data.approved || 0}条`
        );
      } else {
        showMsg(`失败: ${data.msg || data.error || "未知错误"}`);
      }
      fetchStatus();
    } catch {
      showMsg("网络请求失败");
    }
    setRunning((prev) => { const n = new Set(prev); n.delete(key); return n; });
  };

  const runAll = async () => {
    setCrawlingAll(true);
    const neverRunCells = cells.filter((c) => !c.lastRunAt);
    const targets = neverRunCells.length > 0 ? neverRunCells : cells;
    showMsg(`全量抓取启动，共 ${targets.length} 个目标...`);

    for (const cell of targets) {
      await runCell(cell.city, cell.type);
      // 间隔避免 API 限频
      await new Promise((r) => setTimeout(r, 800));
    }
    setCrawlingAll(false);
    showMsg("全量抓取完成！");
  };

  // ── 单元格渲染 ────────────────────────────────────

  const cellMap = new Map<CellKey, CellData>();
  for (const c of cells) cellMap.set(`${c.city}|${c.type}`, c);

  const getCell = (city: string, type: string): CellData | undefined =>
    cellMap.get(`${city}|${type}`);

  const renderCell = (city: string, type: string) => {
    const cell = getCell(city, type);
    const key: CellKey = `${city}|${type}`;
    const isRunning = running.has(key);
    const hasData = cell && cell.lastRunAt;
    const isRecent = hasData && Date.now() - new Date(cell!.lastRunAt!).getTime() < 7 * 86400000;

    return (
      <td key={key} style={{ padding: 0 }}>
        <button
          onClick={() => runCell(city, type)}
          disabled={isRunning}
          style={{
            width: "100%", minWidth: 130, padding: "10px 12px",
            border: isRunning ? "2px solid #0070F3" : "1px solid transparent",
            borderRadius: 8,
            background: isRunning
              ? "linear-gradient(135deg, rgba(0,112,243,0.08), rgba(0,112,243,0.02))"
              : hasData
                ? isRecent ? "var(--bw-tint-pos)" : "var(--bw-panel)"
                : "var(--bw-tint-warn)",
            cursor: isRunning ? "default" : "pointer",
            transition: "all 0.2s ease",
            textAlign: "left" as const,
            fontFamily: "var(--font-sans)",
            position: "relative" as const,
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!isRunning) {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--bw-line-strong)";
              (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = isRunning ? "#0070F3" : "transparent";
            (e.currentTarget as HTMLElement).style.transform = "none";
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
          }}
        >
          {isRunning ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0070F3" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite", flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="35 65" strokeLinecap="round" />
              </svg>
              <span style={{ fontSize: 12, color: "#0070F3", fontWeight: 500 }}>抓取中</span>
            </div>
          ) : hasData ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: isRecent ? "#16A34A" : "var(--bw-hint)" }}>
                  {isRecent ? "●" : "○"}
                </span>
                <span style={{ fontSize: 11, color: "var(--bw-muted)" }}>{timeAgo(cell!.lastRunAt!)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: "var(--bw-text)", lineHeight: 1 }}>
                  {cell?.lastCount || 0}
                </span>
                <span style={{ fontSize: 10, color: "var(--bw-hint)" }}>条</span>
              </div>
              <div style={{ marginTop: 4, borderTop: "1px solid var(--bw-line)", paddingTop: 4 }}>
                <span
                  onClick={(e) => { e.stopPropagation(); router.push(`/admin/crawl-schedule/results?city=${encodeURIComponent(city)}&type=${encodeURIComponent(type)}`); }}
                  style={{ fontSize: 10, color: "#0070F3", cursor: "pointer", fontFamily: "var(--font-sans)", fontWeight: 500 }}>
                  {cell?.lastCount || 0}条 查看 →
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ fontSize: 20, marginBottom: 2, opacity: 0.5 }}>+</div>
              <div style={{ fontSize: 10, color: "var(--bw-hint)" }}>点击抓取</div>
            </div>
          )}
        </button>
      </td>
    );
  };

  if (loading) {
    return (
      <div className="vl-content-inner">
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--bw-hint)" }}>加载中...</div>
      </div>
    );
  }

  return (
    <div className="vl-content-inner">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      {/* ── 页面头部 ────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="vl-page-title" style={{ margin: "0 0 4px" }}>数据抓取看板</h1>
          <p style={{ fontSize: 13, color: "var(--bw-muted)", fontFamily: "var(--font-sans)", margin: 0 }}>
            {summary.total} 个目标 · 最近 7 天运行 {summary.recentlyRun} 个 · 累计入库 {summary.totalCrawled.toLocaleString()} 条
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={runAll}
            disabled={crawlingAll}
            className="vl-btn-primary"
            style={{ fontSize: 13, padding: "8px 20px" }}
          >
            {crawlingAll ? "▶ 运行中..." : `▶ 全量抓取 (${summary.total})`}
          </button>
        </div>
      </div>

      {/* ── 提示条 ──────────────────────────────────── */}
      {msg && (
        <div style={{
          marginBottom: 16, padding: "10px 16px", borderRadius: 8,
          background: "linear-gradient(135deg, var(--bw-tint-info), var(--bw-tint-info))",
          border: "1px solid #B8D8FF", color: "#0070F3",
          fontSize: 13, fontFamily: "var(--font-sans)",
          animation: "fadeIn 0.3s ease",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>{msg}</span>
          <button onClick={() => setMsg("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--bw-hint)", padding: "0 0 0 8px" }}>✕</button>
        </div>
      )}

      {/* ── 矩阵表格 ────────────────────────────────── */}
      <div className="vl-card" style={{ padding: 0, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
          <thead>
            <tr>
              <th style={{
                padding: "12px 16px", textAlign: "left", fontSize: 10, fontWeight: 500,
                color: "var(--bw-hint)", textTransform: "uppercase", letterSpacing: "0.05em",
                borderBottom: "1px solid var(--bw-panel)", whiteSpace: "nowrap",
              }}>城市</th>
              {TYPES.map((t) => (
                <th key={t.key} style={{
                  padding: "12px 8px", textAlign: "center", fontSize: 12, fontWeight: 600,
                  color: "var(--bw-text)", borderBottom: "1px solid var(--bw-panel)", whiteSpace: "nowrap",
                }}>
                  {t.icon} {t.zh}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CITIES.map((city, i) => (
              <tr key={city.key} style={{
                background: i % 2 === 0 ? "transparent" : "rgba(0,0,0,0.01)",
              }}>
                <td style={{
                  padding: "0 16px", fontSize: 14, fontWeight: 600, color: "var(--bw-text)",
                  whiteSpace: "nowrap", borderRight: "1px solid var(--bw-panel)",
                }}>
                  {city.zh}
                </td>
                {TYPES.map((type) => renderCell(city.key, type.key))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── 图例 ────────────────────────────────────── */}
      <div style={{ marginTop: 12, display: "flex", gap: 20, fontSize: 11, color: "var(--bw-hint)", fontFamily: "var(--font-sans)" }}>
        <span>● 7天内运行过</span>
        <span>○ 超过7天未更新</span>
        <span style={{ color: "#D4A800" }}>+ 从未运行</span>
        <span style={{ color: "#0070F3" }}>⟳ 运行中</span>
      </div>
    </div>
  );
}
