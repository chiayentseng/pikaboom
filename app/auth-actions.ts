"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAppMode } from "@/lib/config/runtime";
import { authCookieNames, getAppSession } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInParentAction(formData: FormData) {
  const mode = getAppMode();

  if (mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }
  } else {
    const cookieStore = await cookies();
    cookieStore.set(authCookieNames.devParent, "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });
  }

  redirect("/parent");
}

export async function signOutAction() {
  const mode = getAppMode();
  const cookieStore = await cookies();

  cookieStore.delete(authCookieNames.actingChild);

  if (mode === "supabase") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } else {
    cookieStore.delete(authCookieNames.devParent);
  }

  redirect("/");
}

export async function enterChildModeAction() {
  const cookieStore = await cookies();
  const session = await getAppSession();

  const nextChildId = session.childProfileId ?? "local-child-profile";
  cookieStore.set(authCookieNames.actingChild, nextChildId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  redirect("/child");
}

export async function exitChildModeAction() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieNames.actingChild);
  redirect("/parent");
}
