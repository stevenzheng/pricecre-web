// app/admin/pipeline-log/page.tsx
export default function PipelineLogPage() {
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold" style={{ color: "var(--text-strong)" }}>管线运行日志</h1>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>ScheduledCrawlJob 执行记录 &mdash; 待对接实时数据</p>

      <div className="card-dark p-8 text-center rounded mt-6">
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>暂无运行记录</p>
        <p className="text-[11px] mt-1" style={{ color: "var(--text-hint)" }}>
          创建爬取计划并触发后，运行记录将显示在此处
        </p>
      </div>
    </div>
  );
}
