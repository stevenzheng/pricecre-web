// app/admin/page.tsx
export default function AdminOverview() {
  const stats = [
    { label: "待审核资产", value: "—", href: "/admin/data-review" },
    { label: "活跃爬取计划", value: "—", href: "/admin/crawl-schedule" },
    { label: "今日新增", value: "—", href: "/admin/data-review" },
    { label: "驳回/异常", value: "—", href: "/admin/pipeline-log" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>管理概览</h1>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>数据治理中心 — 审核队列、爬取计划、管线运行状态</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
        {stats.map((s) => (
          <a
            key={s.label}
            href={s.href}
            className="card-dark p-4 rounded-lg hover:border-[var(--accent-border)] transition-colors group"
          >
            <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{s.label}</p>
            <p className="text-2xl font-semibold mt-1 group-hover:text-[var(--accent)] transition-colors" style={{ color: "var(--text-strong)" }}>
              {s.value}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-strong)" }}>快速入口</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <QuickCard
            href="/admin/data-review"
            title="审核队列"
            desc="查看 Agent 管线产出的待审资产，逐项审核或批量操作"
          />
          <QuickCard
            href="/admin/crawl-schedule"
            title="爬取计划"
            desc="创建和管理定时抓取任务，按城市/业态自动化调度"
          />
          <QuickCard
            href="/admin/pipeline-log"
            title="管线日志"
            desc="查看每次管线运行的结果、产量和异常信息"
          />
        </div>
      </div>
    </div>
  );
}

function QuickCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <a
      href={href}
      className="card-dark p-4 rounded-lg hover:border-[var(--accent-border)] transition-colors"
    >
      <p className="text-sm font-medium" style={{ color: "var(--text-strong)" }}>{title}</p>
      <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
    </a>
  );
}
