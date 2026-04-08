import { SectionCard } from "@/components/section-card";
import { getCharacterProgress } from "@/lib/server/game-facade";

export const dynamic = "force-dynamic";

export default function ChildCharactersPage() {
  const characters = getCharacterProgress();

  return (
    <SectionCard
      eyebrow="Characters"
      title="角色養成"
      description="角色會隨著真實累積的 EXP 與 streak 解鎖，讓孩子感受到長期成長真的有痕跡。"
    >
      <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {characters.map((character) => (
          <article key={character.id} className="task-card" style={{ opacity: character.unlocked ? 1 : 0.78 }}>
            <div className="task-topline">
              <div style={{ fontSize: "2rem" }}>{character.emoji}</div>
              <span className="pill">{character.rarity}</span>
            </div>
            <div>
              <div className="mini-label">{character.stage}</div>
              <div style={{ fontWeight: 800, fontSize: "1.25rem" }}>{character.unlocked ? character.name : "神秘夥伴"}</div>
            </div>
            {character.unlocked ? (
              <>
                <div style={{ color: "var(--muted)" }}>偏好能量：{character.growthEnergy}</div>
                <div className="progress-rail">
                  <div className="progress-fill" style={{ width: `${character.growth}%` }} />
                </div>
                <div style={{ color: "var(--muted)" }}>目前成長值 {character.growth} / {character.goal}</div>
              </>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{character.unlockHint}</p>
            )}
          </article>
        ))}
      </div>
    </SectionCard>
  );
}

