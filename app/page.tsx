import Link from "next/link";
import { SectionCard } from "@/components/section-card";

export const dynamic = "force-static";

const childHighlights = [
  "今日任務卡片與即時領獎回饋",
  "角色養成、圖鑑與世界地圖進度",
  "讓孩子知道下一個解鎖點差多少"
];

const parentHighlights = [
  "家長建立任務模板與獎勵規則",
  "待審核任務集中處理",
  "查看完成率、streak 與成長趨勢"
];

export default function HomePage() {
  return (
    <main className="page-shell soft-grid" style={{ gap: 22 }}>
      <section className="glass-panel hero-panel soft-grid" style={{ gap: 22 }}>
        <div className="pill">PikaBoom</div>
        <div className="soft-grid" style={{ gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: "clamp(2.4rem, 5vw, 4.8rem)", maxWidth: 880 }}>
            把孩子每天的努力，變成看得見的冒險成長
          </h1>
          <p style={{ margin: 0, maxWidth: 760, color: "var(--muted)", lineHeight: 1.75, fontSize: "1.05rem" }}>
            PikaBoom 不是單純的待辦工具，而是一個把閱讀、練習、運動與生活習慣轉成角色成長、地圖推進與收集回饋的親子 Web App。
          </p>
        </div>

        <div className="nav-row">
          <Link className="button-primary" href="/login">
            家長登入
          </Link>
          <Link className="button-soft" href="/setup">
            首次雲端設定
          </Link>
        </div>
      </section>

      <div className="soft-grid" style={{ gridTemplateColumns: "1.15fr 0.85fr" }}>
        <SectionCard
          eyebrow="Child Loop"
          title="孩子端像冒險遊戲，不像企業後台"
          description="孩子完成任務後，不只是打勾，而是會看到角色、地圖與獎勵一起前進。"
        >
          <div className="soft-grid" style={{ gap: 14 }}>
            {childHighlights.map((item) => (
              <div key={item} className="task-card">
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="Parent Loop"
          title="家長可以管理規則，也看得懂孩子進度"
          description="系統把任務、審核與報表集中在家長後台，方便維持一致的規則與回饋節奏。"
        >
          <div className="soft-grid" style={{ gap: 14 }}>
            {parentHighlights.map((item) => (
              <div key={item} className="task-card">
                <strong>{item}</strong>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </main>
  );
}
