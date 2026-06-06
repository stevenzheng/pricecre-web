"use client";
// app/admin/orders/[id]/page.tsx — 订单详情 + 退款/取消操作
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const statusColors: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "待支付" },
  1: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已支付" },
  2: { bg: "#F7F7F7", text: "#737373", label: "已取消" },
  3: { bg: "rgba(238,0,0,0.06)", text: "#EE0000", label: "已退款" },
  4: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "退款中" },
  5: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已完成" },
};

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      const d = await res.json();
      if (d.error) { setMsg(d.error); setOrder(null); } else { setOrder(d); }
    } catch { setMsg("加载失败"); }
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    if (!order) return;
    if (action === "refund" && !showRefundModal) {
      setRefundAmount(order ? String(order.amount) : "0");
      setRefundReason("");
      setShowRefundModal(true);
      return;
    }
    if (action === "cancel" && order.status !== 0) {
      if (!confirm(`确定要取消订单 ${order.orderNo}？`)) return;
    }

    setUpdating(true);
    try {
      const body: any = { action };
      if (action === "refund") body.refundReason = refundReason || extra?.refundReason;
      if (action === "refund" && extra?.refundAmount) body.refundAmount = extra.refundAmount;

      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (res.ok) {
        setMsg(d.msg);
        setShowRefundModal(false);
        fetchOrder();
      } else {
        setMsg(d.error || "操作失败");
      }
    } catch { setMsg("操作失败"); }
    setUpdating(false);
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="vl-content-inner"><div className="vl-empty"><p className="vl-empty-title">加载中...</p></div></div>;
  if (!order) return <div className="vl-content-inner"><div className="vl-empty"><p className="vl-empty-title">订单不存在</p><Link href="/admin/orders" className="vl-btn-ghost">返回列表</Link></div></div>;

  const sc = statusColors[order.status] || statusColors[0];
  const canRefund = [1, 5].includes(order.status);
  const canCancel = order.status === 0;
  const canComplete = order.status === 1;

  return (
    <div className="vl-content-inner">
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/orders" style={{ fontSize: 12, color: "#737373", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
          ← 返回订单列表
        </Link>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(0,112,243,0.08)", color: "#0070F3", fontSize: 13, cursor: "pointer" }} onClick={() => setMsg("")}>
          {msg}
        </div>
      )}

      {/* Order header */}
      <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", padding: "20px 24px", marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>
              订单 {order.orderNo}
            </h1>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: sc.bg, color: sc.text, fontFamily: "var(--font-sans)" }}>
              {sc.label}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {canRefund && (
              <button onClick={() => handleAction("refund")} className="vl-btn-ghost" style={{ color: "#EE0000", borderColor: "#EE0000" }}>
                退款
              </button>
            )}
            {canCancel && (
              <button onClick={() => handleAction("cancel")} className="vl-btn-ghost">
                取消订单
              </button>
            )}
            {canComplete && (
              <button onClick={() => handleAction("complete")} className="vl-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}>
                完成订单
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Order info */}
        <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", padding: "18px 20px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 14px" }}>订单信息</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { l: "订单编号", v: order.orderNo },
              { l: "用户邮箱", v: order.userEmail },
              { l: "商品类型", v: order.productType === 1 ? "查看额度" : order.productType === 2 ? "AI 对话额度" : "VIP 会员" },
              { l: "支付方式", v: order.paymentMethod === "wechat" ? "微信支付" : order.paymentMethod === "alipay" ? "支付宝" : order.paymentMethod === "admin_manual" ? "管理员手动" : order.paymentMethod },
              { l: "订单金额", v: `¥${order.amount.toFixed(2)}` },
              { l: "交易号", v: order.tradeNo || "—" },
              { l: "支付时间", v: order.paidAt ? new Date(order.paidAt).toLocaleString("zh-CN") : "—" },
              { l: "创建时间", v: new Date(order.createdAt).toLocaleString("zh-CN") },
            ].map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#737373", fontFamily: "var(--font-sans)" }}>{r.l}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>{r.v}</span>
              </div>
            ))}
          </div>
          {order.note && (
            <div style={{ marginTop: 12, padding: "8px 12px", background: "#FAFAFA", borderRadius: 6, fontSize: 12, color: "#525252", fontFamily: "var(--font-sans)" }}>
              备注：{order.note}
            </div>
          )}
        </div>

        {/* Order items */}
        <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", padding: "18px 20px" }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 14px" }}>商品明细</h3>
          {order.items && order.items.length > 0 ? (
            <div>
              {order.items.map((item: any, i: number) => (
                <div key={item.id || i} style={{ padding: "10px 0", borderBottom: i < order.items.length - 1 ? "1px solid #F7F7F7" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)" }}>{item.productName}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-geist-mono)" }}>¥{item.totalPrice.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#737373", fontFamily: "var(--font-sans)" }}>
                    {item.productType === "view_quota" ? "查看额度" : item.productType === "chat_quota" ? "AI 对话额度" : "VIP"}
                    {item.creditsAdded && item.creditsAdded > 0 ? ` · +${item.creditsAdded} 次` : ""}
                    {item.quantity > 1 ? ` · x${item.quantity}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>无商品明细</div>
          )}

          {/* Refund info */}
          {order.status === 3 && (
            <div style={{ marginTop: 14, padding: "10px 12px", background: "rgba(238,0,0,0.04)", borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#EE0000", marginBottom: 4, fontFamily: "var(--font-sans)" }}>退款信息</div>
              <div style={{ fontSize: 11, color: "#404040", fontFamily: "var(--font-sans)" }}>原因：{order.refundReason || "—"}</div>
              <div style={{ fontSize: 11, color: "#404040", fontFamily: "var(--font-sans)" }}>金额：¥{order.refundAmount ? order.refundAmount.toFixed(2) : order.amount.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: "#404040", fontFamily: "var(--font-sans)" }}>时间：{order.refundedAt ? new Date(order.refundedAt).toLocaleString("zh-CN") : "—"}</div>
            </div>
          )}
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <>
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} onClick={() => setShowRefundModal(false)} />
          <div style={{
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
            background: "#FFF", borderRadius: 12, padding: 24, width: 400, maxWidth: "90vw",
            zIndex: 101, border: "1px solid #E5E5E5",
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 16px" }}>退款操作</h2>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", display: "block", marginBottom: 4 }}>退款金额</label>
              <input
                type="number" value={refundAmount}
                onChange={e => setRefundAmount(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "var(--font-geist-mono)" }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", display: "block", marginBottom: 4 }}>退款原因</label>
              <textarea
                value={refundReason} onChange={e => setRefundReason(e.target.value)}
                rows={3}
                placeholder="请输入退款原因..."
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "var(--font-sans)", resize: "vertical" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setShowRefundModal(false)} className="vl-btn-ghost">取消</button>
              <button
                onClick={() => handleAction("refund", { refundReason, refundAmount: Number(refundAmount) })}
                disabled={updating || !refundReason.trim()}
                style={{
                  padding: "6px 20px", borderRadius: 6, border: "none", background: "#EE0000", color: "#FFF",
                  fontSize: 13, fontWeight: 500, cursor: updating ? "default" : "pointer",
                  opacity: updating || !refundReason.trim() ? 0.6 : 1, fontFamily: "var(--font-sans)",
                }}
              >
                {updating ? "处理中..." : "确认退款"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
