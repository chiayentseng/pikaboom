import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

type NavItem = {
  href: Route;
  label: string;
  active?: boolean;
};

export type { NavItem };

type NavShellProps = {
  title: string;
  subtitle: string;
  badge?: string;
  items: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
};

export function NavShell({ title, subtitle, badge, items, actions, children }: NavShellProps) {
  return (
    <div className="page-shell soft-grid" style={{ gap: 20 }}>
      <header className="glass-panel hero-panel soft-grid" style={{ gap: 18 }}>
        <div className="row-between">
          <div className="soft-grid" style={{ gap: 8 }}>
            {badge ? <div className="pill">{badge}</div> : null}
            <div>
              <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>{title}</h1>
              <p style={{ margin: "10px 0 0", color: "var(--muted)", maxWidth: 720, lineHeight: 1.65 }}>
                {subtitle}
              </p>
            </div>
          </div>
          <Link className="button-soft" href="/">
            Home
          </Link>
        </div>
        <nav className="nav-row">
          {items.map((item) => (
            <Link key={item.href} className={`nav-chip${item.active ? " active" : ""}`} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        {actions ? <div className="nav-row">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
