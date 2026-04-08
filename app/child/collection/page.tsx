import { SectionCard } from "@/components/section-card";
import { getCharacterProgress } from "@/lib/server/game-facade";

export const dynamic = "force-dynamic";

export default async function ChildCollectionPage() {
  const characters = await getCharacterProgress();

  return (
    <SectionCard eyebrow="Collection" title="角色圖鑑" description="圖鑑會保留未解鎖條件，讓孩子知道再努力多少就能遇見下一位夥伴。">
      <div className="soft-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {characters.map((character) => (
          <div
            key={character.id}
            className="task-card"
            style={{ opacity: character.unlocked ? 1 : 0.82, filter: character.unlocked ? "none" : "saturate(0.2)" }}
          >
            <div style={{ fontSize: "2.2rem" }}>{character.emoji}</div>
            <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>{character.unlocked ? character.name : "神秘剪影"}</div>
            <div className="mini-label">{character.rarity}</div>
            <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>
              {character.unlocked ? `目前階段：${character.stage}` : character.unlockHint}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
