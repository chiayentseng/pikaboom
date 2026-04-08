import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NavShell, type NavItem } from "@/components/nav-shell";
import { exitChildModeAction, signOutAction } from "@/app/auth-actions";
import { requireChildSession } from "@/lib/auth/session";

const items: NavItem[] = [
  { href: "/child", label: "Adventure" },
  { href: "/child/tasks", label: "Tasks" },
  { href: "/child/characters", label: "Characters" },
  { href: "/child/map", label: "Map" },
  { href: "/child/collection", label: "Collection" },
  { href: "/child/achievements", label: "Achievements" }
];

export default async function ChildLayout({ children }: { children: ReactNode }) {
  const session = await requireChildSession();

  if (session.mode === "supabase" && !session.hasChildProfile) {
    redirect("/setup");
  }

  return (
    <NavShell
      title="Child Adventure Mode"
      subtitle="This is the child-facing experience where tasks, rewards, characters, and world progress all move forward."
      badge="Child Experience"
      items={items}
      actions={
        <>
          <div className="pill">{session.displayName ?? "Child Mode"}</div>
          <form action={exitChildModeAction}>
            <button className="button-soft" type="submit">
              Parent Console
            </button>
          </form>
          <form action={signOutAction}>
            <button className="button-soft" type="submit">
              Sign Out
            </button>
          </form>
        </>
      }
    >
      {children}
    </NavShell>
  );
}
