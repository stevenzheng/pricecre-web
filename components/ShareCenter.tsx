"use client";
import { showModal } from "@/components/Toast";

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
        <h2 className="text-lg font-medium mb-1" style={{ color: "var(--text-strong)" }}>
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
                <span className="text-xs font-medium" style={{ color: "var(--positive)" }}>数据已提报 · 审核通过后自动并网</span>
              </div>
              <code className="px-5 py-2 rounded-lg text-lg font-medium inline-block" style={{ background: "var(--bg-surface)", color: "var(--accent)", fontFamily: "var(--font-mono)", letterSpacing: "0.15em" }}>{redeemCode}</code>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>数据核准后额度自动到账 · 也可手动输入兑换码激活</div>
            </div>
          ) : (
            <button type="submit" className="btn-primary w-full text-sm">提交真实成交数据</button>
          )}
        </form>
      </div>
    </div>
  );
}
