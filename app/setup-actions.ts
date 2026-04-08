"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuthenticatedSession } from "@/lib/auth/session";
import { getAppMode, isSupabaseAdminConfigured } from "@/lib/config/runtime";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { defaultTaskTemplates } from "@/lib/domain/default-task-templates";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "family";
}

function randomPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

export async function completeSupabaseSetupAction(formData: FormData) {
  const session = await requireAuthenticatedSession();

  if (getAppMode() !== "supabase") {
    redirect("/parent");
  }

  if (!isSupabaseAdminConfigured()) {
    redirect("/setup?error=missing-admin-env");
  }

  const parentProfileId = session.parentProfileId;
  if (!parentProfileId) {
    redirect("/setup?error=missing-parent-id");
  }

  const parentDisplayName = String(formData.get("parentDisplayName") ?? "").trim() || session.displayName || "Parent";
  const householdName = String(formData.get("householdName") ?? "").trim() || `${parentDisplayName} 家`;
  const childDisplayName = String(formData.get("childDisplayName") ?? "").trim() || "小冒險家";
  const seedTasks = formData.get("seedTasks") === "on";

  const supabase = createSupabaseAdminClient();

  await supabase.from("profiles").upsert(
    {
      id: parentProfileId,
      role: "parent",
      display_name: parentDisplayName,
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  let householdId = session.householdId;

  if (!householdId) {
    const { data: household, error: householdError } = await supabase
      .from("households")
      .insert({
        name: householdName,
        owner_profile_id: parentProfileId
      })
      .select("id")
      .single();

    if (householdError) {
      redirect(`/setup?error=${encodeURIComponent(householdError.message)}`);
    }

    householdId = household.id;

    const { error: membershipError } = await supabase.from("household_members").upsert(
      {
        household_id: householdId,
        profile_id: parentProfileId,
        member_role: "parent"
      },
      { onConflict: "household_id,profile_id" }
    );

    if (membershipError) {
      redirect(`/setup?error=${encodeURIComponent(membershipError.message)}`);
    }
  }

  const { data: existingChildren, error: childQueryError } = await supabase
    .from("child_profiles")
    .select("id")
    .eq("household_id", householdId)
    .limit(1);

  if (childQueryError) {
    redirect(`/setup?error=${encodeURIComponent(childQueryError.message)}`);
  }

  if (!existingChildren || existingChildren.length === 0) {
    const childSlug = slugify(childDisplayName);
    const childEmail = `${childSlug}-${Date.now()}@children.pikaboom.local`;
    const childPassword = randomPassword();

    const { data: childUserResult, error: childUserError } = await supabase.auth.admin.createUser({
      email: childEmail,
      password: childPassword,
      email_confirm: true,
      user_metadata: {
        display_name: childDisplayName,
        managed_child: true,
        household_name: householdName
      }
    });

    if (childUserError || !childUserResult.user) {
      redirect(`/setup?error=${encodeURIComponent(childUserError?.message ?? "Failed to create child identity")}`);
    }

    const childAuthUserId = childUserResult.user.id;

    const { error: childProfileRowError } = await supabase.from("profiles").upsert(
      {
        id: childAuthUserId,
        role: "child",
        display_name: childDisplayName,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    );

    if (childProfileRowError) {
      redirect(`/setup?error=${encodeURIComponent(childProfileRowError.message)}`);
    }

    const { error: childMembershipError } = await supabase.from("household_members").upsert(
      {
        household_id: householdId,
        profile_id: childAuthUserId,
        member_role: "child"
      },
      { onConflict: "household_id,profile_id" }
    );

    if (childMembershipError) {
      redirect(`/setup?error=${encodeURIComponent(childMembershipError.message)}`);
    }

    const { error: childSetupError } = await supabase.from("child_profiles").insert({
      profile_id: childAuthUserId,
      household_id: householdId,
      level: 1,
      exp: 0,
      streak_days: 0,
      star_currency: 0
    });

    if (childSetupError) {
      redirect(`/setup?error=${encodeURIComponent(childSetupError.message)}`);
    }
  }

  if (seedTasks) {
    const { count } = await supabase
      .from("task_templates")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId);

    if ((count ?? 0) === 0) {
      const { error: seedError } = await supabase.from("task_templates").insert(
        defaultTaskTemplates.map((task) => ({
          household_id: householdId,
          parent_profile_id: parentProfileId,
          title: task.title,
          category: task.category,
          icon_key: task.icon,
          measurement_type: task.measurementType,
          target_value: task.targetValue,
          unit: task.unit,
          repeat_type: task.repeatLabel,
          reward_exp: task.rewardExp,
          reward_energy_type: task.rewardEnergyType,
          reward_energy_value: task.rewardEnergyValue,
          requires_parent_approval: task.requiresApproval
        }))
      );

      if (seedError) {
        redirect(`/setup?error=${encodeURIComponent(seedError.message)}`);
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/login");
  revalidatePath("/setup");
  revalidatePath("/parent");
  revalidatePath("/parent/tasks");
  revalidatePath("/child");
  revalidatePath("/child/tasks");

  redirect("/parent?setup=complete");
}
