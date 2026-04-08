import { SectionCard } from "@/components/section-card";
import { getWorldProgress } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ChildMapPage() {
  const worldAreas = getWorldProgress();

  return (
    <SectionCard eyebrow="World" title="地圖與世界變化" description="區域進度現在跟著已領獎任務次數推進，孩子每完成一次都會更接近下一塊地圖。">
      <div className="soft-grid" style={{ gridTemplateColumns: "1.15fr 0.95fr" }}>
        <div className="world-preview">
          <div className="island" />
          <div className="path" />
          <div className="tree" style={{ left: "12%", bottom: "25%" }} />
          <div className="tree" style={{ left: "26%", bottom: "22%" }} />
          <div className="tree" style={{ left: "68%", bottom: "28%", transform: "scale(0.86)" }} />
          <div className="house" style={{ left: "44%", bottom: "24%" }} />
          <div className="pond" style={{ right: "12%", bottom: "14%" }} />
        </div>
        <div className="soft-grid">
          {worldAreas.map((area) => (
            <article key={area.id} className="task-card">
              <div className="task-topline">
                <div>
                  <div className="mini-label">{area.state}</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>{area.name}</div>
                </div>
                <span className="pill">{area.progress}%</span>
              </div>
              <div style={{ color: "var(--muted)" }}>{area.theme}</div>
              <div className="progress-rail">
                <div className="progress-fill" style={{ width: `${area.progress}%` }} />
              </div>
              <div style={{ color: "var(--muted)", lineHeight: 1.6 }}>{area.unlockHint}</div>
            </article>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
