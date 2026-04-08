import { SectionCard } from "@/components/section-card";
import { getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ParentHomePage() {
  const stats = getStats();

  return (
    <div className="soft-grid" style={{ gap: 20 }}>
      <section className="glass-panel section-card soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="stat-badge">
          <div className="mini-label">近 7 日完成率</div>
          <div className="big-number">{stats.completionRate}%</div>
        </div>
        <div className="stat-badge">
          <div className="mini-label">待審核任務</div>
          <div className="big-number">{stats.pendingApprovals}</div>
        </div>
        <div className="stat-badge">
          <div className="mini-label">累積已領獎</div>
          <div className="big-number">{stats.totalClaimed}</div>
        </div>
      </section>

      <SectionCard
        eyebrow="Overview"
        title="用最少操作看懂這週狀況"
        description="家長首頁先把最重要的管理訊號放前面，方便快速決定要不要調整任務難度。"
      >
        <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          <div className="task-card">
            <div className="mini-label">今天已領獎</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem" }}>{stats.todayClaimed} / {stats.totalTasks}</div>
            <div style={{ color: "var(--muted)" }}>代表今天已經完成多少個任務閉環。</div>
          </div>
          <div className="task-card">
            <div className="mini-label">最穩定類型</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem" }}>{stats.topCategory}</div>
            <div style={{ color: "var(--muted)" }}>可用來判斷孩子目前最有動機的方向。</div>
          </div>
          <div className="task-card">
            <div className="mini-label">本週已完成</div>
            <div style={{ fontWeight: 800, fontSize: "1.8rem" }}>{stats.weeklyCompletion}</div>
            <div style={{ color: "var(--muted)" }}>後續可以繼續延伸成真正的圖表報表。</div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
