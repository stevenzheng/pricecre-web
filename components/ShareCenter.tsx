"use client";

import { useState } from "react";

const RENT_FREE_OPTIONS = [
  { id: "free-period", label: "免租期", placeholder: "月数" },
  { id: "renovation-subsidy", label: "装修补贴", placeholder: "元/㎡" },
];

export default function ShareCenter() {
  const [formData, setFormData] = useState({
    projectName: "",
    netRent: "",
    rentFree: [] as string[],
    rentFreeValues: {} as Record<string, string>,
    proofFile: null as File | null,
    email: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [purchaseStep, setPurchaseStep] = useState<"idle" | "confirm" | "success">("idle");
  const [purchaseCode, setPurchaseCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wechat" | "alipay">("wechat");
  const [buying, setBuying] = useState(false);

  const handleRentFreeToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      rentFree: prev.rentFree.includes(id)
        ? prev.rentFree.filter((x) => x !== id)
        : [...prev.rentFree, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectName || !formData.netRent || !formData.email) return;
    setRedeemCode("A3F7K9");
    setSubmitted(true);
  };

  const handlePurchase = () => setPurchaseStep("confirm");
  const handlePurchaseConfirm = async () => {
    setBuying(true);
    try {
      const res = await fetch("/api/payment/test-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product: "single", amount: 99 }),
      });
      const data = await res.json();
      if (data.success) {
        setPurchaseCode(data.code);
        setPurchaseStep("success");
      }
    } catch {
      setPurchaseCode(String(Math.floor(100000 + Math.random() * 900000)));
      setPurchaseStep("success");
    }
    setBuying(false);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-strong)" }}>
          提交租金数据，获取累计查看额度
        </h2>
        <p className="text-[11px] mt-2 px-4 py-2 rounded-lg inline-block" style={{ background: "var(--accent-soft)", color: "var(--accent)" }}>
          每提交一次真实确认的租金交易数据，可获得 8 次资产数据查看额度
        </p>
      </div>

      {/* 数据提报 */}
      <div className="card p-5">
        <div className="section-title">提交租金成交真实数据</div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="项目楼盘名称"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            className="input-search" style={{ paddingLeft: "12px" }}
          />
          <select
            className="input-search"
            style={{ paddingLeft: '12px', color: 'var(--text-muted)' }}
            defaultValue=""
          >
            <option value="">选择城市</option>
            <option value="上海">上海</option>
            <option value="北京">北京</option>
            <option value="深圳">深圳</option>
            <option value="苏州">苏州</option>
            <option value="成都">成都</option>
          </select>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>¥</span>
            <input
              type="number" step="0.01" placeholder="租金成交价"
              value={formData.netRent}
              onChange={(e) => setFormData({ ...formData, netRent: e.target.value })}
              className="input-search" style={{ paddingLeft: "28px", paddingRight: "44px" }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: "var(--text-hint)" }}>元/㎡</span>
          </div>

          <div className="space-y-1.5">
            {RENT_FREE_OPTIONS.map((opt) => {
              const sel = formData.rentFree.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${sel ? "ring-1" : ""}`}
                  style={{ borderColor: sel ? "var(--accent)" : "var(--line)", background: sel ? "var(--accent-soft)" : "var(--panel)" }}
                  onClick={() => handleRentFreeToggle(opt.id)}
                >
                  <div className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center" style={{ border: `2px solid ${sel ? "var(--accent)" : "var(--text-hint)"}`, background: sel ? "var(--accent)" : "transparent" }}>
                    {sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-inverse)" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  <span className="text-xs font-medium flex-1" style={{ color: sel ? "var(--accent)" : "var(--text)" }}>{opt.label}</span>
                  {sel && (
                    <input type="text" placeholder={opt.placeholder} value={formData.rentFreeValues[opt.id] || ""}
                      onChange={(e) => { e.stopPropagation(); setFormData((p) => ({ ...p, rentFreeValues: { ...p.rentFreeValues, [opt.id]: e.target.value } })); }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-20 text-xs px-2 py-1 rounded border text-center"
                      style={{ background: "var(--bg-surface)", borderColor: "var(--accent-border)", color: "var(--accent)", fontFamily: "var(--font-mono)" }} />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed cursor-pointer hover:bg-[var(--panel)] transition-colors" style={{ borderColor: "var(--line)" }}
            onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = (e) => setFormData({ ...formData, proofFile: (e.target as HTMLInputElement).files?.[0] || null }); i.click(); }}>
            {formData.proofFile ? (
              <span className="text-xs font-medium" style={{ color: "var(--positive)" }}>✓ {formData.proofFile.name}</span>
            ) : (
              <div className="text-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" className="mx-auto mb-1"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="text-[10px]" style={{ color: "var(--text-hint)" }}>上传真实成交凭证</span>
              </div>
            )}
          </div>

          <input type="email" placeholder="注册邮箱" value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input-search" style={{ paddingLeft: "12px" }} />

          {submitted ? (
            <div className="p-4 rounded-lg text-center space-y-2" style={{ background: "var(--positive-soft)", border: "1px solid var(--positive-border)" }}>
              <div className="flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span className="text-xs font-bold" style={{ color: "var(--positive)" }}>数据已提报 · 审核通过后自动并网</span>
              </div>
              <code className="px-5 py-2 rounded-lg text-lg font-bold inline-block" style={{ background: "var(--bg-surface)", color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>{redeemCode}</code>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>数据核准后额度自动到账 · 也可手动输入兑换码激活</div>
            </div>
          ) : (
            <button type="submit" className="btn-primary w-full text-sm">提交真实成交数据</button>
          )}
        </form>
      </div>

      {/* 分享转发 */}
      <div className="card p-5">
        <div className="section-title">分享转发获得查看额度</div>
        
        <div className="mb-4 text-center">
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--text-muted)" }}>历史累计已获取确权额度</div>
          <div className="flex items-center justify-center gap-2">
            <span className="text-2xl font-bold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>0</span>
            <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>/ 100</span>
            <span className="text-xs" style={{ color: "var(--text-hint)" }}>次</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-hint)" }}>你的全局专属裂变链接</div>
          <div className="flex gap-2">
            <input type="text" readOnly value="pricecre.com/r/sz2026" className="input-search flex-1 text-xs" style={{ paddingLeft: "12px", fontFamily: "var(--font-mono)" }} />
            <button className="btn-secondary text-xs px-4 flex-shrink-0" onClick={() => { navigator.clipboard.writeText("pricecre.com/r/sz2026"); alert("已复制裂变链接"); }}>
              一键复制
            </button>
          </div>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-hint)" }}>
            好友通过该链接注册，双方账户各自动并网 <span style={{ color: "var(--accent)", fontWeight: 600 }}>+5 次</span> 高阶资产确权额度
          </p>
        </div>
      </div>

      {/* 兑换码 */}
      <div className="card p-5">
        <div className="section-title">激活兑换码</div>
        
        <div className="flex gap-2 mb-2">
          <input type="text" placeholder="输入 6 位兑换码" value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="input-search flex-1" style={{ paddingLeft: "12px", fontFamily: "var(--font-mono)" }} maxLength={6} />
          <button className="btn-primary text-sm px-5 flex-shrink-0" onClick={() => { if (inputCode) { alert(`兑换码 ${inputCode} 已激活 · 确权额度已并网`); setInputCode(""); } }}>
            激活
          </button>
        </div>
        <button className="text-[10px] font-medium hover:underline ml-auto block" style={{ color: "var(--text-muted)" }}
          onClick={() => alert("稍后可在「我的」页面兑换")}>先去看盘，稍后兑换 →</button>
      </div>

      {/* 商业付费 */}
      <div className="card p-5">
        <div className="section-title">商业付费直通车</div>
        

        {purchaseStep === "idle" && (
          <div className="space-y-2">
            <button
              className="w-full py-3.5 rounded-xl text-sm font-bold transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "var(--text-inverse)" }}
              onClick={handlePurchase}
            >
              立即购买查看额度 · 99元 / 50次
            </button>
            <button
              className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90 flex items-center justify-center gap-2"
              style={{ background: "var(--panel)", color: "var(--text)", border: "1px solid var(--line)" }}
              onClick={() => alert("VIP 即将上线")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/></svg>
              不限次包月 · 299元/月
            </button>
          </div>
        )}

        {purchaseStep === "confirm" && (
          <div className="text-center space-y-3 animate-slide-up">
            <div className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>确认支付</div>
            <div className="text-2xl font-bold" style={{ color: "var(--text-strong)", fontFamily: "var(--font-mono)" }}>¥99.00</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>即刻到账 50 次查看额度 · 永久有效</div>

            {/* 支付方式选择 */}
            <div className="flex gap-2 justify-center pt-1">
              <button
                onClick={() => setPaymentMethod("wechat")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "wechat" ? "ring-1" : ""
                }`}
                style={{
                  background: paymentMethod === "wechat" ? "var(--positive-soft)" : "var(--panel)",
                  borderColor: paymentMethod === "wechat" ? "var(--positive)" : "var(--line)",
                  border: "1px solid",
                  color: paymentMethod === "wechat" ? "var(--positive)" : "var(--text-muted)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#07C160"/>
                  <path d="M7.5 9.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h3.75c.28 0 .5.22.5.5s-.22.5-.5.5H7.5zm0 2.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h6.25c.28 0 .5.22.5.5s-.22.5-.5.5H7.5zm0 2.5c-.28 0-.5-.22-.5-.5s.22-.5.5-.5h4.5c.28 0 .5.22.5.5s-.22.5-.5.5H7.5z" fill="#fff"/>
                </svg>
                微信支付
              </button>
              <button
                onClick={() => setPaymentMethod("alipay")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  paymentMethod === "alipay" ? "ring-1" : ""
                }`}
                style={{
                  background: paymentMethod === "alipay" ? "var(--accent-soft)" : "var(--panel)",
                  borderColor: paymentMethod === "alipay" ? "var(--accent)" : "var(--line)",
                  border: "1px solid",
                  color: paymentMethod === "alipay" ? "var(--accent)" : "var(--text-muted)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="#1677FF"/>
                  <path d="M9.5 8h5c.28 0 .5.22.5.5v7c0 .28-.22.5-.5.5h-5c-.28 0-.5-.22-.5-.5v-7c0-.28.22-.5.5-.5zm1.25 1.5v5h2.5v-5h-2.5z" fill="#fff"/>
                </svg>
                支付宝
              </button>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button className="btn-secondary text-xs" onClick={() => setPurchaseStep("idle")}>取消</button>
              <button className="btn-primary text-xs px-6" onClick={handlePurchaseConfirm} disabled={buying}>
                {buying ? "处理中..." : "确认支付 ¥99.00 (测试模式)"}
              </button>
            </div>
          </div>
        )}

        {purchaseStep === "success" && (
          <div className="text-center space-y-3 animate-slide-up">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2.5" className="mx-auto"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <div className="text-sm font-bold" style={{ color: "var(--positive)" }}>测试购买成功 · 额度已到账</div>
            <code className="px-5 py-2 rounded-lg text-lg font-bold inline-block" style={{ background: "var(--accent-soft)", color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>{purchaseCode}</code>
            <div><button className="btn-primary text-xs" onClick={() => { setPurchaseStep("idle"); setPurchaseCode(""); }}>返回查看确权额度</button></div>
          </div>
        )}
      </div>

    </div>
  );
}
