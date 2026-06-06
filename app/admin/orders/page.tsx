"use client";
// app/admin/orders/page.tsx — 订单管理列表
import { useState, useEffect } from "react";
import Link from "next/link";

const statusColors: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "待支付" },
  1: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已支付" },
  2: { bg: "#F7F7F7", text: "#737373", label: "已取消" },
  3: { bg: "rgba(238,0,0,0.06)", text: "#EE0000", label: "已退款" },
  4: { bg: "rgba(245,166,35,0.08)", text: "#B5791A", label: "退款中" },
  5: { bg: "rgba(0,112,243,0.06)", text: "#0070F3", label: "已完成" },
};

const statusFilters = [
  { key: "", label: "全部" },
  { key: "0", label: "待支付" },
  { key: "1", label: "已支付" },
  { key: "2", label: "已取消" },
  { key: "3", label: "已退款" },
  { key: "4", label: "退款中" },
  { key: "5", label: "已完成" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [msg, setMsg] = useState("");
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({ email: "", credits: 50, productType: "view_quota", note: "" });
  const [creating, setCreating] = useState(false);

  const fetchOrders = async (p = page, s = statusFilter, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "20" });
      if (s) params.set("status", s);
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/orders?${params}`);
      const d = await res.json();
      setOrders(d.orders || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    } catch { setOrders([]); }
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    fetchOrders(1, status, search);
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
    fetchOrders(1, statusFilter, searchInput);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });

  const handleCreateOrder = async () => {
    if (!newOrder.email) { setMsg("请输入用户邮箱"); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newOrder.email,
          productType: newOrder.productType === "chat_quota" ? 2 : 1,
          amount: 0,
          paymentMethod: "admin_manual",
          note: newOrder.note || "管理员手动创建",
          items: [{
            productType: newOrder.productType,
            productName: newOrder.productType === "chat_quota" ? "AI 对话额度" : "查看额度",
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            creditsAdded: newOrder.credits,
          }],
        }),
      });
      const d = await res.json();
      if (res.ok) { setMsg(d.msg); setShowNewOrder(false); setNewOrder({ email: "", credits: 50, productType: "view_quota", note: "" }); fetchOrders(); }
      else { setMsg(d.error || "创建失败"); }
    } catch { setMsg("网络错误"); }
    setCreating(false);
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="vl-content-inner">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h1 className="vl-page-title" style={{ margin: 0 }}>订单管理</h1>
          <p className="vl-page-desc">{total} 条订单记录</p>
        </div>
        <button
          onClick={() => setShowNewOrder(true)}
          className="vl-btn-primary" style={{ fontSize: 13, padding: "6px 16px" }}
        >+ 新建订单</button>
      </div>

      {msg && (
        <div style={{ marginBottom: 16, padding: "8px 16px", borderRadius: 6, background: "rgba(0,112,243,0.08)", color: "#0070F3", fontSize: 13, cursor: "pointer" }} onClick={() => setMsg("")}>
          {msg}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {statusFilters.map(f => (
          <button
            key={f.key}
            onClick={() => handleStatusFilter(f.key)}
            style={{
              padding: "4px 12px", borderRadius: 6, border: "1px solid #E5E5E5",
              background: statusFilter === f.key ? "#171717" : "#FFFFFF",
              color: statusFilter === f.key ? "#FFFFFF" : "#525252",
              fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}
          >
            {f.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <input
            value={searchInput} onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder="搜索订单号/邮箱/交易号..."
            style={{ padding: "4px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 12, outline: "none", width: 220 }}
          />
          <button onClick={handleSearch} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid #D4D4D4", background: "#FFFFFF", fontSize: 12, cursor: "pointer" }}>
            搜索
          </button>
        </div>
      </div>

      {loading ? (
        <div className="vl-empty"><p className="vl-empty-title">加载中...</p></div>
      ) : orders.length === 0 ? (
        <div className="vl-empty">
          <p className="vl-empty-title">暂无订单</p>
          <p className="vl-empty-desc">还没有任何订单记录</p>
        </div>
      ) : (
        <>
          <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>订单号</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>用户</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>类型</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>金额</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>状态</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>时间</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#737373", fontFamily: "var(--font-sans)" }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => {
                  const sc = statusColors[o.status] || statusColors[0];
                  return (
                    <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? "1px solid #F7F7F7" : "none" }}>
                      <td style={{ padding: "10px 16px", fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "#171717" }}>
                        <Link href={`/admin/orders/${o.id}`} style={{ color: "#0070F3", textDecoration: "none", fontWeight: 500 }}>
                          {o.orderNo}
                        </Link>
                      </td>
                      <td style={{ padding: "10px 16px", color: "#404040", fontFamily: "var(--font-sans)" }}>{o.userEmail || "—"}</td>
                      <td style={{ padding: "10px 16px", color: "#404040", fontFamily: "var(--font-sans)", fontSize: 12 }}>{o.productTypeLabel}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right", fontFamily: "var(--font-geist-mono)", fontWeight: 600, color: "#171717" }}>¥{o.amount.toFixed(2)}</td>
                      <td style={{ padding: "10px 16px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500, background: sc.bg, color: sc.text, fontFamily: "var(--font-sans)" }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: "10px 16px", color: "#737373", fontSize: 11, fontFamily: "var(--font-sans)", whiteSpace: "nowrap" }}>{formatDate(o.createdAt)}</td>
                      <td style={{ padding: "10px 16px", textAlign: "right" }}>
                        <Link href={`/admin/orders/${o.id}`} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", color: "#525252", fontSize: 11, fontWeight: 500, cursor: "pointer", textDecoration: "none", fontFamily: "var(--font-sans)" }}>
                          详情
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginTop: 16 }}>
              <button
                onClick={() => { const np = Math.max(1, page - 1); setPage(np); fetchOrders(np, statusFilter, search); }}
                disabled={page <= 1}
                style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", fontSize: 12, cursor: page <= 1 ? "default" : "pointer", opacity: page <= 1 ? 0.4 : 1 }}
              >
                上一页
              </button>
              <span style={{ fontSize: 12, color: "#525252", fontFamily: "var(--font-sans)" }}>{page} / {totalPages}</span>
              <button
                onClick={() => { const np = Math.min(totalPages, page + 1); setPage(np); fetchOrders(np, statusFilter, search); }}
                disabled={page >= totalPages}
                style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #E5E5E5", background: "#FFF", fontSize: 12, cursor: page >= totalPages ? "default" : "pointer", opacity: page >= totalPages ? 0.4 : 1 }}
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}

      {/* 新建订单弹窗 */}
      {showNewOrder && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 100 }} onClick={() => setShowNewOrder(false)} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#FFF", borderRadius: 12, padding: 24, width: 400, maxWidth: "92vw", zIndex: 101, border: "1px solid #E5E5E5" }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 16px" }}>新建订单</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4 }}>用户邮箱</label>
                <input value={newOrder.email} onChange={e => setNewOrder({ ...newOrder, email: e.target.value })} placeholder="user@example.com"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4 }}>商品类型</label>
                <select value={newOrder.productType} onChange={e => setNewOrder({ ...newOrder, productType: e.target.value })}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" }}>
                  <option value="view_quota">查看额度</option>
                  <option value="chat_quota">AI 对话额度</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4 }}>赠送额度</label>
                <input type="number" min={1} value={newOrder.credits} onChange={e => setNewOrder({ ...newOrder, credits: Number(e.target.value) })}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 14, outline: "none", fontFamily: "var(--font-geist-mono)" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)", marginBottom: 4 }}>备注</label>
                <input value={newOrder.note} onChange={e => setNewOrder({ ...newOrder, note: e.target.value })} placeholder="管理员赠送"
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "var(--font-sans)" }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button onClick={() => setShowNewOrder(false)} className="vl-btn-ghost" style={{ fontSize: 12 }}>取消</button>
              <button onClick={handleCreateOrder} disabled={creating}
                style={{ padding: "6px 20px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 13, fontWeight: 500, cursor: creating ? "default" : "pointer", opacity: creating ? 0.6 : 1, fontFamily: "var(--font-sans)" }}>
                {creating ? "创建中..." : "确认创建"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
