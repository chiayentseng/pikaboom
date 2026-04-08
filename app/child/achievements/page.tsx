import { SectionCard } from "@/components/section-card";
import { getProfile, getStats } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ChildAchievementsPage() {
  const profile = getProfile();
  const stats = getStats();

  return (
    <SectionCard eyebrow="Milestones" title="成就與連續紀錄" description="這一頁先用真實 streak、累積領獎與完成率，承接之後的週挑戰與成就系統。">
      <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="task-card">
          <div className="mini-label">連續紀錄</div>
          <div className="big-number">{profile.streakDays} 天</div>
          <div style={{ color: "var(--muted)" }}>每天至少領一次獎就會延續 streak。</div>
        </div>
        <div className="task-card">
          <div className="mini-label">累積已領獎</div>
          <div className="big-number">{stats.totalClaimed}</div>
          <div style={{ color: "var(--muted)" }}>每一次都會推進角色與世界。</div>
        </div>
        <div className="task-card">
          <div className="mini-label">近 7 日完成率</div>
          <div className="big-number">{stats.completionRate}%</div>
          <div style={{ color: "var(--muted)" }}>家長後台也會同步看到這個趨勢。</div>
        </div>
      </div>
    </SectionCard>
  );
}
