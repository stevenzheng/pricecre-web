// app/admin/exchange-codes/page.tsx — Exchange Code generation (3 methods) + history
"use client";

import { useState, useEffect } from "react";

interface CodeLogEntry {
  code: string;
  email: string;
  credits: number;
  createdAt: string;
  status: string;
}

const STORAGE_KEY = "pricecre_code_log";

function loadLog(): CodeLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLog(log: CodeLogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {}
}

export default function ExchangeCodesPage() {
  const [log, setLog] = useState<CodeLogEntry[]>([]);

  // Single generation state
  const [singleEmail, setSingleEmail] = useState("");
  const [singleMsg, setSingleMsg] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);

  // Batch by credits state
  const [batchEmail, setBatchEmail] = useState("");
  const [batchCredits, setBatchCredits] = useState("");
  const [batchMsg, setBatchMsg] = useState("");
  const [batchLoading, setBatchLoading] = useState(false);

  // CSV import state
  const [csvText, setCsvText] = useState("");
  const [csvMsg, setCsvMsg] = useState("");
  const [csvLoading, setCsvLoading] = useState(false);

  // Active tab
  const [tab, setTab] = useState<"single" | "batch" | "csv" | "history">("single");

  useEffect(() => {
    setLog(loadLog());
  }, []);

  const addLogEntry = (code: string, email: string, credits: number) => {
    const entry: CodeLogEntry = {
      code,
      email,
      credits,
      createdAt: new Date().toISOString(),
      status: "active",
    };
    const updated = [entry, ...loadLog()];
    saveLog(updated);
    setLog(updated);
  };

  const handleSingle = async () => {
    if (!singleEmail) { setSingleMsg("请输入邮箱"); return; }
    setSingleLoading(true);
    setSingleMsg("");
    try {
      const res = await fetch("/api/admin/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: singleEmail, credits: 8 }),
      });
      const d = await res.json();
      if (d.success) {
        addLogEntry(d.code || "生成成功", singleEmail, 8);
        setSingleMsg(`已生成: ${d.code}`);
        setSingleEmail("");
      } else {
        setSingleMsg(d.error || "生成失败");
      }
    } catch {
      setSingleMsg("网络错误");
    }
    setSingleLoading(false);
  };

  const handleBatch = async () => {
    if (!batchEmail) { setBatchMsg("请输入邮箱"); return; }
    const credits = parseInt(batchCredits);
    if (!credits || credits < 1) { setBatchMsg("请输入有效额度（正整数）"); return; }
    setBatchLoading(true);
    setBatchMsg("");
    try {
      const res = await fetch("/api/admin/generate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: batchEmail, credits }),
      });
      const d = await res.json();
      if (d.success) {
        addLogEntry(d.code || "生成成功", batchEmail, credits);
        setBatchMsg(`已生成: ${d.code} (${credits} 额度)`);
        setBatchEmail("");
        setBatchCredits("");
      } else {
        setBatchMsg(d.error || "生成失败");
      }
    } catch {
      setBatchMsg("网络错误");
    }
    setBatchLoading(false);
  };

  const handleCsv = async () => {
    const lines = csvText.trim().split("\n").filter(Boolean);
    if (lines.length === 0) { setCsvMsg("请输入至少一行数据"); return; }

    const entries: { email: string; credits: number }[] = [];
    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i].split(",").map((s) => s.trim());
      const email = parts[0];
      const credits = parseInt(parts[1]);
      if (!email || !credits || credits < 1) {
        setCsvMsg(`第 ${i + 1} 行格式错误，应为 "email,credits"`);
        return;
      }
      entries.push({ email, credits });
    }

    setCsvLoading(true);
    setCsvMsg("");
    let successCount = 0;
    let failCount = 0;

    for (const entry of entries) {
      try {
        const res = await fetch("/api/admin/generate-codes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: entry.email, credits: entry.credits }),
        });
        const d = await res.json();
        if (d.success) {
          addLogEntry(d.code || "批量生成", entry.email, entry.credits);
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    setCsvMsg(`完成：成功 ${successCount} 个，失败 ${failCount} 个`);
    setCsvText("");
    setCsvLoading(false);
  };

  return (
    <div className="admin-content-inner" style={{ padding: 24, maxWidth: 900 }}>
      <div className="admin-page-header" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 18, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 4px" }}>兑换码管理</p>
        <p style={{ fontSize: 13, color: "#757575", fontFamily: "var(--font-sans)", margin: 0 }}>3 种生成方式 · 本地历史记录</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {([
          { key: "single", label: "单个生成" },
          { key: "batch", label: "自定义额度" },
          { key: "csv", label: "CSV 批量导入" },
          { key: "history", label: `生成历史 (${log.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: tab === t.key ? "1px solid #0070F3" : "1px solid #E5E5E5",
              background: tab === t.key ? "rgba(0,112,243,0.06)" : "#FFF",
              color: tab === t.key ? "#0070F3" : "#737373",
              fontSize: 12,
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Single */}
      {tab === "single" && (
        <div style={{ padding: 16, background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>单个生成 (固定 8 次额度)</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              placeholder="输入用户邮箱"
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }}
            />
            <button
              onClick={handleSingle}
              disabled={singleLoading}
              style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#10B981", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {singleLoading ? "生成中..." : "生成 6 位码"}
            </button>
          </div>
          {singleMsg && (
            <p style={{ marginTop: 8, fontSize: 12, fontFamily: "var(--font-sans)", color: singleMsg.includes("成功") || singleMsg.includes("已生成") ? "#10B981" : "#EF4444" }}>
              {singleMsg}
            </p>
          )}
        </div>
      )}

      {/* Batch by credits */}
      {tab === "batch" && (
        <div style={{ padding: 16, background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>自定义额度生成</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              value={batchEmail}
              onChange={(e) => setBatchEmail(e.target.value)}
              placeholder="输入用户邮箱"
              style={{ flex: "1 1 200px", padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-sans)", outline: "none" }}
            />
            <input
              type="number"
              value={batchCredits}
              onChange={(e) => setBatchCredits(e.target.value)}
              placeholder="额度数量"
              min="1"
              style={{ width: 100, padding: "8px 10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-mono)", outline: "none" }}
            />
            <button
              onClick={handleBatch}
              disabled={batchLoading}
              style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#0070F3", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {batchLoading ? "生成中..." : "生成兑换码"}
            </button>
          </div>
          {batchMsg && (
            <p style={{ marginTop: 8, fontSize: 12, fontFamily: "var(--font-sans)", color: batchMsg.includes("已生成") ? "#10B981" : "#EF4444" }}>
              {batchMsg}
            </p>
          )}
        </div>
      )}

      {/* CSV import */}
      {tab === "csv" && (
        <div style={{ padding: 16, background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "#171717", fontFamily: "var(--font-sans)", margin: "0 0 12px" }}>CSV 批量导入</p>
          <p style={{ fontSize: 11, color: "#A3A3A3", fontFamily: "var(--font-sans)", margin: "0 0 8px" }}>
            每行格式：<code>email,credits</code>（例如：user@example.com,8）
          </p>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder={"user1@example.com,8\nuser2@example.com,16\nuser3@example.com,24"}
            rows={6}
            style={{ width: "100%", padding: "10px", border: "1px solid #D4D4D4", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-mono)", outline: "none", resize: "vertical", marginBottom: 12 }}
          />
          <button
            onClick={handleCsv}
            disabled={csvLoading}
            style={{ padding: "8px 20px", borderRadius: 6, border: "none", background: "#7C3AED", color: "#FFF", fontSize: 13, fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer" }}
          >
            {csvLoading ? "批量生成中..." : "批量生成兑换码"}
          </button>
          {csvMsg && (
            <p style={{ marginTop: 8, fontSize: 12, fontFamily: "var(--font-sans)", color: csvMsg.includes("成功") && !csvMsg.includes("失败") ? "#10B981" : "#F5A623" }}>
              {csvMsg}
            </p>
          )}
        </div>
      )}

      {/* History */}
      {tab === "history" && (
        <div style={{ background: "#FFF", borderRadius: 8, border: "1px solid #E5E5E5", overflow: "hidden" }}>
          {log.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>
              <p style={{ fontSize: 14, margin: "0 0 4px" }}>暂无生成记录</p>
              <p style={{ fontSize: 12, margin: 0 }}>使用上方标签页生成兑换码后，记录将显示在此</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E5E5", background: "#FAFAFA" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>兑换码</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>邮箱</th>
                    <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>额度</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>生成时间</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 500, color: "#737373", fontFamily: "var(--font-sans)" }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((entry, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #F0F0F0" }}>
                      <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)", fontWeight: 600, color: "#171717" }}>{entry.code}</td>
                      <td style={{ padding: "10px 14px", color: "#404040", fontFamily: "var(--font-sans)" }}>{entry.email}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--font-mono)", color: "#10B981" }}>+{entry.credits}</td>
                      <td style={{ padding: "10px 14px", fontSize: 12, color: "#A3A3A3", fontFamily: "var(--font-sans)" }}>
                        {new Date(entry.createdAt).toLocaleString("zh-CN")}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 9999, fontSize: 11, fontWeight: 500, background: "rgba(16,185,129,0.1)", color: "#10B981", fontFamily: "var(--font-sans)" }}>
                          {entry.status === "active" ? "有效" : entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
