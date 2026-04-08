import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { NavShell, type NavItem } from "@/components/nav-shell";
import { enterChildModeAction, signOutAction } from "@/app/auth-actions";
import { requireParentSession } from "@/lib/auth/session";

const items: NavItem[] = [
  { href: "/parent", label: "Dashboard" },
  { href: "/parent/tasks", label: "Tasks" },
  { href: "/parent/review", label: "Review" },
  { href: "/parent/reports", label: "Reports" }
];

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const session = await requireParentSession();

  if (session.mode === "supabase" && (!session.hasHousehold || !session.hasChildProfile)) {
    redirect("/setup");
  }

  return (
    <NavShell
      title="Parent Console"
      subtitle="Manage rules, review progress, and switch into child mode to experience the front-end flow."
      badge="Parent Control"
      items={items}
      actions={
        <>
          <div className="pill">{session.displayName ?? session.email ?? "Parent"}</div>
          <form action={enterChildModeAction}>
            <button className="button-soft" type="submit">
              Child Mode
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
