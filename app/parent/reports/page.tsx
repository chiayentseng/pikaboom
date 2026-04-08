import { SectionCard } from "@/components/section-card";
import { getProfile, getStats, getWorldProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ParentReportsPage() {
  const profile = getProfile();
  const stats = getStats();
  const worlds = getWorldProgress();

  return (
    <SectionCard
      eyebrow="Reports"
      title="報表與觀察"
      description="先把最有決策價值的數字做出來，讓家長知道孩子目前的完成節奏與成長位置。"
    >
      <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="task-card">
          <div className="mini-label">近 7 日完成率</div>
          <div className="big-number">{stats.completionRate}%</div>
          <div style={{ color: "var(--muted)" }}>看孩子最近是否有穩定完成任務。</div>
        </div>
        <div className="task-card">
          <div className="mini-label">目前等級</div>
          <div className="big-number">Lv {profile.level}</div>
          <div style={{ color: "var(--muted)" }}>{profile.title}</div>
        </div>
        <div className="task-card">
          <div className="mini-label">連續紀錄</div>
          <div className="big-number">{profile.streakDays} 天</div>
          <div style={{ color: "var(--muted)" }}>可用來觀察習慣是否開始形成。</div>
        </div>
      </div>

      <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {worlds.map((world) => (
          <div key={world.id} className="task-card">
            <div className="task-topline">
              <strong>{world.name}</strong>
              <span className="pill">{world.progress}%</span>
            </div>
            <div style={{ color: "var(--muted)" }}>{world.theme}</div>
            <div className="progress-rail">
              <div className="progress-fill" style={{ width: `${world.progress}%` }} />
            </div>
            <div style={{ color: "var(--muted)" }}>{world.unlockHint}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
