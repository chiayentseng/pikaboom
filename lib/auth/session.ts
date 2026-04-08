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
  hasProfile: boolean;
  hasHousehold: boolean;
  hasChildProfile: boolean;
};

async function resolveSupabaseSession(actingChildId: string | null): Promise<Omit<AppSession, "mode">> {
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
      hasProfile: false,
      hasHousehold: false,
      hasChildProfile: false
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: memberships } = await supabase
    .from("household_members")
    .select("household_id,member_role")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true });

  const householdMembership = memberships?.find((membership) => membership.member_role === "parent") ?? memberships?.[0] ?? null;
  const householdId = householdMembership?.household_id ?? null;

  let childProfiles: Array<{ id: string }> = [];
  if (householdId) {
    const { data } = await supabase
      .from("child_profiles")
      .select("id")
      .eq("household_id", householdId)
      .order("created_at", { ascending: true });

    childProfiles = data ?? [];
  }

  const hasRequestedChild = Boolean(actingChildId && childProfiles.some((child) => child.id === actingChildId));
  const resolvedActingChildId = hasRequestedChild ? actingChildId : null;
  const defaultChildProfileId = resolvedActingChildId ?? childProfiles[0]?.id ?? null;

  return {
    isAuthenticated: true,
    role: resolvedActingChildId ? "child" : "parent",
    householdId,
    parentProfileId: user.id,
    childProfileId: defaultChildProfileId,
    actingChildId: resolvedActingChildId,
    email: user.email ?? null,
    displayName: profile?.display_name ?? (user.user_metadata.display_name as string | undefined) ?? user.email ?? "Parent",
    hasProfile: Boolean(profile),
    hasHousehold: Boolean(householdId),
    hasChildProfile: childProfiles.length > 0
  };
}

export async function getAppSession(): Promise<AppSession> {
  const mode = getAppMode();
  const cookieStore = await cookies();
  const actingChildId = cookieStore.get(ACTING_CHILD_COOKIE)?.value ?? null;

  if (mode === "supabase") {
    const resolved = await resolveSupabaseSession(actingChildId);
    return {
      ...resolved,
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
    mode,
    hasProfile: isAuthenticated,
    hasHousehold: isAuthenticated,
    hasChildProfile: isAuthenticated
  };
}

export async function requireAuthenticatedSession() {
  const session = await getAppSession();
  if (!session.isAuthenticated) {
    redirect("/login");
  }
  return session;
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
