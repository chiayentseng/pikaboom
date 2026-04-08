import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppMode } from "@/lib/config/runtime";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SessionContext } from "@/lib/types/game";

const DEV_PARENT_COOKIE = "pikaboom_dev_parent";
const ACTING_CHILD_COOKIE = "pikaboom_acting_child_id";

export type AppSession = SessionContext & {
  isAuthenticated: boolean;
  email: string | null;
  displayName: string | null;
  mode: "local" | "supabase";
};

export async function getAppSession(): Promise<AppSession> {
  const mode = getAppMode();
  const cookieStore = await cookies();
  const actingChildId = cookieStore.get(ACTING_CHILD_COOKIE)?.value ?? null;

  if (mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        isAuthenticated: false,
        role: "guest",
        householdId: null,
        parentProfileId: null,
        childProfileId: null,
        actingChildId: null,
        email: null,
        displayName: null,
        mode
      };
    }

    return {
      isAuthenticated: true,
      role: actingChildId ? "child" : "parent",
      householdId: "supabase-household-pending",
      parentProfileId: user.id,
      childProfileId: actingChildId,
      actingChildId,
      email: user.email ?? null,
      displayName: (user.user_metadata.display_name as string | undefined) ?? user.email ?? "Parent",
      mode
    };
  }

  const isAuthenticated = cookieStore.get(DEV_PARENT_COOKIE)?.value === "1";
  return {
    isAuthenticated,
    role: !isAuthenticated ? "guest" : actingChildId ? "child" : "parent",
    householdId: isAuthenticated ? "local-household" : null,
    parentProfileId: isAuthenticated ? "local-parent" : null,
    childProfileId: isAuthenticated ? "local-child-profile" : null,
    actingChildId: isAuthenticated ? actingChildId : null,
    email: isAuthenticated ? "local@pikaboom.dev" : null,
    displayName: isAuthenticated ? "Local Parent" : null,
    mode
  };
}

export async function requireParentSession() {
  const session = await getAppSession();
  if (!session.isAuthenticated || session.role === "child") {
    redirect("/login");
  }
  return session;
}

export async function requireChildSession() {
  const session = await getAppSession();
  if (!session.isAuthenticated) {
    redirect("/login");
  }
  return session;
}

export const authCookieNames = {
  devParent: DEV_PARENT_COOKIE,
  actingChild: ACTING_CHILD_COOKIE
};
