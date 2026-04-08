import { ReactNode } from "react";

type SectionCardProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function SectionCard({ eyebrow, title, description, children }: SectionCardProps) {
  return (
    <section className="glass-panel section-card soft-grid">
      <div className="soft-grid" style={{ gap: 6 }}>
        {eyebrow ? <div className="mini-label">{eyebrow}</div> : null}
        <h2 style={{ margin: 0, fontSize: "1.45rem" }}>{title}</h2>
        {description ? (
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
