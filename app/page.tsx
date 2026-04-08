import Link from "next/link";
import { SectionCard } from "@/components/section-card";
import { getProfile, getStats, getTodayTasks, getWorldProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const profile = getProfile();
  const stats = getStats();
  const todayTasks = getTodayTasks();
  const worldAreas = getWorldProgress();
  const claimableCount = todayTasks.filter((task) => task.status === "READY_TO_CLAIM").length;

  return (
    <main className="page-shell soft-grid" style={{ gap: 22 }}>
      <section className="glass-panel hero-panel soft-grid" style={{ gap: 22 }}>
        <div className="pill">PikaBoom Family MVP</div>
        <div className="soft-grid" style={{ gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 5vw, 4.8rem)", maxWidth: 880 }}>
            讓孩子完成任務後，真的會留下進度、等級與成長紀錄
          </h1>
          <p style={{ margin: 0, maxWidth: 760, color: "var(--muted)", lineHeight: 1.75, fontSize: "1.05rem" }}>
            現在這個版本已經不是純展示稿，而是一個有本機資料庫、孩子任務流程、家長管理與審核的可互動 MVP。
          </p>
        </div>

        <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div className="stat-badge">
            <div className="mini-label">孩子等級</div>
            <div className="big-number">Lv {profile.level}</div>
            <div style={{ color: "var(--muted)" }}>{profile.title}</div>
          </div>
          <div className="stat-badge">
            <div className="mini-label">今日可領獎</div>
            <div className="big-number">{claimableCount}</div>
            <div style={{ color: "var(--muted)" }}>完成後可在孩子端直接領取</div>
          </div>
          <div className="stat-badge">
            <div className="mini-label">待家長審核</div>
            <div className="big-number">{stats.pendingApprovals}</div>
            <div style={{ color: "var(--muted)" }}>家長後台會看到待確認任務</div>
          </div>
        </div>

        <div className="nav-row">
          <Link className="button-primary" href="/child">
            進入孩子端
          </Link>
          <Link className="button-soft" href="/parent">
            進入家長後台
          </Link>
        </div>
      </section>

      <div className="soft-grid" style={{ gridTemplateColumns: "1.25fr 0.9fr" }}>
        <SectionCard
          eyebrow="Main Loop"
          title="孩子做完任務後，獎勵與世界進度會被記錄下來"
          description="今天的任務狀態、可領獎數、地圖解鎖條件都來自 SQLite，而不是固定假資料。"
        >
          <div className="soft-grid" style={{ gap: 16 }}>
            <div className="world-preview">
              <div className="island" />
              <div className="path" />
              <div className="tree" style={{ left: "16%", bottom: "25%" }} />
              <div className="tree" style={{ left: "62%", bottom: "27%", transform: "scale(0.9)" }} />
              <div className="house" style={{ left: "36%", bottom: "24%" }} />
              <div className="pond" style={{ right: "10%", bottom: "16%" }} />
            </div>
            <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <div className="task-card">
                <div className="mini-label">今天已領獎</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                  {stats.todayClaimed} / {stats.totalTasks} 個任務
                </div>
                <div style={{ color: "var(--muted)" }}>每次領獎都會推進等級、星星幣與 streak。</div>
              </div>
              <div className="task-card">
                <div className="mini-label">下一區域</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700 }}>{worldAreas.find((area) => area.state !== "已開啟")?.name ?? "全區已開啟"}</div>
                <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                  {worldAreas.find((area) => area.state !== "已開啟")?.unlockHint ?? "現在可以繼續累積稀有內容與角色成長。"}
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Parent Loop"
          title="家長可以建立任務、審核提交、並看到真實完成率"
          description="目前先做單家庭模式，之後再把 parent/child 帳號與角色權限補完整。"
        >
          <div className="soft-grid" style={{ gap: 14 }}>
            <div className="task-card">
              <div className="mini-label">近 7 日完成率</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{stats.completionRate}%</div>
            </div>
            <div className="task-card">
              <div className="mini-label">累積已領獎</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{stats.totalClaimed} 次</div>
            </div>
            <div className="task-card">
              <div className="mini-label">最常完成類型</div>
              <div style={{ fontSize: "1.6rem", fontWeight: 800 }}>{stats.topCategory}</div>
            </div>
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
