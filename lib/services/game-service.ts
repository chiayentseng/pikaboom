import { getAppMode } from "@/lib/config/runtime";
import { getAppSession } from "@/lib/auth/session";
import { getSqliteGameRepository } from "@/lib/repositories/sqlite-game-repository";
import { canUseSupabaseGameRepository, getSupabaseGameRepository } from "@/lib/repositories/supabase-game-repository";
import type { TaskTemplateInput } from "@/lib/types/game";

async function getRepository() {
  const session = await getAppSession();

  if (getAppMode() === "supabase" && canUseSupabaseGameRepository(session)) {
    return getSupabaseGameRepository(session);
  }

  return getSqliteGameRepository();
}

export async function getProfile() {
  return (await getRepository()).getProfile();
}

export async function getTodayTasks() {
  return (await getRepository()).getTodayTasks();
}

export async function getStats() {
  return (await getRepository()).getStats();
}

export async function getWorldProgress() {
  return (await getRepository()).getWorldProgress();
}

export async function getCharacterProgress() {
  return (await getRepository()).getCharacterProgress();
}

export async function getPendingReviews() {
  return (await getRepository()).getPendingReviews();
}

export async function getTaskTemplates() {
  return (await getRepository()).getTaskTemplates();
}

export async function createTask(input: TaskTemplateInput) {
  return (await getRepository()).createTask(input);
}

export async function toggleTask(taskId: string) {
  return (await getRepository()).toggleTask(taskId);
}

export async function submitTask(logId: string) {
  return (await getRepository()).submitTask(logId);
}

export async function approveTask(logId: string) {
  return (await getRepository()).approveTask(logId);
}

export async function rejectTask(logId: string, reason: string) {
  return (await getRepository()).rejectTask(logId, reason);
}

export async function claimTask(logId: string) {
  return (await getRepository()).claimTask(logId);
}
