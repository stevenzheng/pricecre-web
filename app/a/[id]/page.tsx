// app/a/[id]/page.tsx — Public AI Analysis share page (matches PDF report layout)
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SharedAnalysisPage({ params, searchParams }: { params: { id: string }; searchParams?: { print?: string } }) {
  const cached = await prisma.aiAnalysisCache.findUnique({ where: { id: params.id } });
  if (!cached) notFound();

  const a = cached.analysisData as any;
  // 兼容两种存储格式：analysis-cache（score/positives/negatives/conclusion）与 save-report（content）
  const analysis = {
    score: a.score ?? "—",
    positives: a.positives || [],
    negatives: a.negatives || [],
    conclusion: typeof a.conclusion === "string" && a.conclusion ? a.conclusion : (typeof a.content === "string" ? a.content : ""),
  };
  const autoPrint = searchParams?.print === "1";
  const indicators: { label: string; value: string }[] = a.indicators || [];
  const faceRent = a.faceRent || 0;
  const netEffectiveRent = a.netEffectiveRent || null;
  const now = new Date().toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  const reportId = `PRC-${params.id.substring(0, 8).toUpperCase()}`;
  const shareUrl = `https://pricecre.com/a/${params.id}`;

  const indicatorBlocks = indicators.filter(i => i.value && i.value !== "undefined")
    .map(i => `<div class="ind-card"><span class="ind-label">${i.label}</span><span class="ind-val">${i.value}</span></div>`).join("");

  return (
    <html lang="zh">
      <head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width"/><title>{cached.projectName} - 资产全维度价值指标报告</title><style>{`
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'PingFang SC','Microsoft YaHei','Noto Sans SC',system-ui,sans-serif;color:#1a1a2e;line-height:1.7;max-width:860px;margin:0;padding:40px 36px;background:#FFF}
.page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}
.page-header .brand{display:flex;align-items:center;gap:10px}
.page-header .brand .logo{width:36px;height:36px;border-radius:6px;background:linear-gradient(135deg,#0f172a,#334155);color:#FFF;font-size:15px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.page-header .brand .names{display:flex;flex-direction:column}
.page-header .brand .name{font-size:15px;font-weight:700;color:#0f172a;letter-spacing:-0.02em}
.page-header .brand .sub{font-size:10px;color:#94a3b8;font-weight:500;letter-spacing:0.02em}
.page-header .header-right{display:flex;flex-direction:column;align-items:flex-end;gap:8px}
.page-header .header-right .web-url{font-size:11px;color:#94a3b8;font-family:'SF Mono','Menlo',monospace;text-align:right}
.page-header .header-right .lang-row{display:flex;align-items:center;gap:8px;font-size:11px;color:#64748b;font-weight:500}
.page-header .header-right .lang-row .divider{width:1px;height:12px;background:#cbd5e1}
.page-header .qr-wrap{display:flex;align-items:center;gap:6px}
.page-header .qr-wrap img{width:36px;height:36px;border-radius:4px}
.page-header .qr-wrap .qr-label{font-size:8px;color:#94a3b8;text-align:center;line-height:1.2}
.title-block{text-align:left;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #0f172a}
.title-block .asset-name{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.03em;margin-bottom:6px}
.title-block .asset-addr{font-size:13px;color:#64748b;margin-bottom:4px}
.title-block .asset-rent{font-size:13px;color:#475569}
.title-block .asset-rent span{font-family:'SF Mono','Menlo',monospace;color:#0f172a;font-weight:600}
.score-badge{display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:6px 16px;border-radius:999px;background:#eff6ff;border:1px solid #bfdbfe}
.score-badge .num{font-size:20px;font-weight:800;color:#2563eb}
.score-badge .label{font-size:11px;color:#64748b}
.main-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
.ai-col h3{font-size:13px;font-weight:700;color:#0f172a;border-left:3px solid #2563eb;padding-left:10px;margin-bottom:10px}
.ai-col .item{padding:5px 0 5px 10px;font-size:12.5px;color:#334155;border-bottom:1px solid #f1f5f9}
.ai-col .item::before{content:"•";color:#2563eb;margin-right:6px;font-weight:700}
.ai-conclusion{font-size:12.5px;color:#475569;line-height:1.8;padding:10px 14px;background:#f8fafc;border-left:2px solid #e2e8f0;border-radius:0 6px 6px 0;margin-top:8px}
.ind-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ind-card{border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;background:#fafafa;text-align:center}
.ind-card .ind-label{display:block;font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:3px}
.ind-card .ind-val{display:block;font-size:14px;font-weight:700;color:#0f172a;font-family:'SF Mono','Menlo',monospace}
.footer{border-top:1px solid #e2e8f0;padding-top:16px;margin-top:12px}
.footer .footer-text{text-align:right}
.footer .company{font-size:13px;font-weight:600;color:#0f172a;margin-bottom:4px}
.footer .info{font-size:10px;color:#94a3b8;line-height:1.5}
.footer .disclaimer{font-size:9px;color:#94a3b8;margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9}
@page{margin:0}@media print{body{padding:20px 36px}@}
@media(max-width:640px){body{padding:24px 16px}.main-grid{grid-template-columns:1fr}}
`}</style></head>
      <body>
        <div className="page-header">
          <div className="brand">
            <div className="logo">PC</div>
            <div className="names">
              <div className="name">PriceCRE · 地产价值</div>
              <div className="sub">Commercial Real Estate Intelligence</div>
            </div>
          </div>
          <div className="header-right">
            <div className="lang-row">
              <span>地产价值</span>
              <span className="divider" />
              <span>CRE Intelligence</span>
            </div>
            <div className="web-url">{shareUrl}</div>
            <div className="qr-wrap">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(shareUrl)}`} alt="QR code" />
              <div className="qr-label">扫码<br/>查看</div>
            </div>
          </div>
        </div>

        <div className="title-block">
          <div className="asset-name">{cached.projectName}</div>
          <div className="asset-addr">{cached.city} · {cached.district} · {cached.propertyType}</div>
          <div className="asset-rent">挂牌面价 <span>¥{faceRent}/㎡/天</span>{netEffectiveRent ? <> &nbsp;|&nbsp; 净有效租金 <span>¥{netEffectiveRent.toFixed(1)}/㎡/天</span></> : ""}</div>
          <div className="score-badge"><span className="num">{analysis.score}</span><span className="label">/ 100 综合精算评分</span></div>
        </div>

        <div className="main-grid">
          <div className="ai-col">
            <h3>利好因素</h3>
            {analysis.positives.map((p: string, i: number) => <div className="item" key={i}>{p}</div>)}
            <h3 style={{ marginTop: 16, borderLeftColor: "#e91e63" }}>风险提示</h3>
            {analysis.negatives.map((n: string, i: number) => <div className="item" key={i}>{n}</div>)}
            <h3 style={{ marginTop: 16 }}>结束语</h3>
            <div className="ai-conclusion">{analysis.conclusion}</div>
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", borderLeft: "3px solid #0d9488", paddingLeft: 10, marginBottom: 10 }}>资产精算指标</h3>
            <div className="ind-grid" dangerouslySetInnerHTML={{ __html: indicatorBlocks || '<p style="font-size:12px;color:#94a3b8;grid-column:1/-1">暂无指标数据</p>' }} />
          </div>
        </div>

        <div className="footer">
          <div className="footer-text">
            <div className="company">PriceCRE · 商业地产量化精算资产终端</div>
            <div className="info">报告编号：{reportId} &nbsp;|&nbsp; 生成时间：{now}</div>
            <div className="info">数据来源：PriceCRE 资产数据库 & AI 精算模型</div>
            <div className="disclaimer">
              免责声明：本报告由 AI 大语言模型辅助生成，内容仅供参考，不构成投资建议、估值意见或交易邀约。PriceCRE 不对因使用本报告产生的任何直接或间接损失承担责任。<br/><br/>&copy; {new Date().getFullYear()} PriceCRE. All rights reserved.
            </div>
          </div>
        </div>
        {autoPrint && (
          <script dangerouslySetInnerHTML={{ __html: "window.addEventListener('load',function(){setTimeout(function(){window.print()},600)});" }} />
        )}
      </body>
    </html>
  );
}
