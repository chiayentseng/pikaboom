export type AppMode = "local" | "supabase";

export function getAppMode(): AppMode {
  const configuredMode = process.env.PIKABOOM_APP_MODE;
  if (configuredMode === "supabase" && isSupabaseConfigured()) {
    return "supabase";
  }
  return "local";
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
