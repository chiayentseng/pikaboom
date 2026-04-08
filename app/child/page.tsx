import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { claimTaskAction } from "@/app/actions";
import { getCharacterProgress, getProfile, getStats, getTodayTasks, getWorldProgress } from "@/lib/server/game-facade";

export const dynamic = "force-dynamic";

export default async function ChildHomePage() {
  const [profile, stats, tasks, worldAreas, characters] = await Promise.all([
    getProfile(),
    getStats(),
    getTodayTasks(),
    getWorldProgress(),
    getCharacterProgress()
  ]);
  const nextClaim = tasks.find((task) => task.status === "READY_TO_CLAIM");
  const nextWorld = worldAreas.find((area) => area.state !== "UNLOCKED");

  return (
    <div className="soft-grid" style={{ gap: 20 }}>
      <section className="glass-panel section-card soft-grid" style={{ gridTemplateColumns: "0.75fr 1.25fr" }}>
        <div className="soft-grid" style={{ gap: 14, alignContent: "start" }}>
          <div className="character-bubble">{characters.find((character) => character.unlocked)?.emoji ?? "🦊"}</div>
          <div>
            <div className="mini-label">{profile.name}</div>
            <h2 style={{ margin: "6px 0" }}>
              Lv {profile.level} {profile.title}
            </h2>
            <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
              已經連續冒險 {profile.streakDays} 天，背包裡有 {profile.stars} 顆星星幣。
            </p>
          </div>
          <div className="task-card">
            <div className="mini-label">本級進度</div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>
              {profile.currentLevelExp} / {profile.nextLevelExp} EXP
            </div>
            <div className="progress-rail">
              <div className="progress-fill" style={{ width: `${(profile.currentLevelExp / profile.nextLevelExp) * 100}%` }} />
            </div>
          </div>
          {nextClaim ? (
            <form action={claimTaskAction} className="task-card">
              <input type="hidden" name="logId" value={nextClaim.logId} />
              <div className="mini-label">可以領獎了</div>
              <strong>
                {nextClaim.icon} {nextClaim.title}
              </strong>
              <div style={{ color: "var(--muted)" }}>領取後會增加 {nextClaim.rewardExp} EXP 與 {nextClaim.rewardEnergyValue} 星星幣。</div>
              <button className="button-primary" type="submit">
                立即領獎
              </button>
            </form>
          ) : (
            <div className="task-card">
              <div className="mini-label">下一步誘惑</div>
              <strong>{nextWorld?.unlockHint ?? "再完成一些任務，就會有更多驚喜。"}</strong>
            </div>
          )}
        </div>

        <div className="soft-grid" style={{ gap: 16 }}>
          <div className="world-preview">
            <div className="island" />
            <div className="path" />
            <div className="tree" style={{ left: "14%", bottom: "23%" }} />
            <div className="tree" style={{ left: "26%", bottom: "30%", transform: "scale(0.78)" }} />
            <div className="house" style={{ left: "40%", bottom: "22%" }} />
            <div className="pond" style={{ right: "8%", bottom: "16%" }} />
          </div>
          <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="stat-badge">
              <div className="mini-label">今日任務</div>
              <div className="big-number">{tasks.length}</div>
            </div>
            <div className="stat-badge">
              <div className="mini-label">今天已領獎</div>
              <div className="big-number">{stats.todayClaimed}</div>
            </div>
            <div className="stat-badge">
              <div className="mini-label">下一區域</div>
              <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{nextWorld?.name ?? "全部開啟"}</div>
            </div>
          </div>
        </div>
      </section>

      <SectionCard eyebrow="Today" title="今天先做這幾件事" description="任務卡的狀態現在會跟著孩子提交、家長審核、孩子領獎而改變。">
        <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          {tasks.slice(0, 3).map((task) => (
            <div key={task.logId} className="task-card">
              <div className="task-topline">
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                  {task.icon} {task.title}
                </div>
                <span className="pill">{statusLabel(task.status)}</span>
              </div>
              <div style={{ color: "var(--muted)" }}>
                {task.category} · {task.targetValue} {task.unit}
              </div>
              <div>
                + {task.rewardExp} EXP · + {task.rewardEnergyValue} 星星幣
              </div>
              <Link className="button-primary" href="/child/tasks">
                查看任務詳情
              </Link>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "待家長確認";
    case "READY_TO_CLAIM":
      return "可領獎";
    case "CLAIMED":
      return "已完成";
    case "REJECTED":
      return "再試一次";
    default:
      return "未開始";
  }
}
