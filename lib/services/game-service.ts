import { getLocalSessionContext } from "@/lib/auth/access-model";
import { getSqliteGameRepository } from "@/lib/repositories/sqlite-game-repository";
import type { TaskTemplateInput } from "@/lib/types/game";

function getRepository() {
  return getSqliteGameRepository();
}

export function getProfile() {
  return getRepository().getProfile();
}

export function getTodayTasks() {
  getLocalSessionContext();
  return getRepository().getTodayTasks();
}

export function getStats() {
  return getRepository().getStats();
}

export function getWorldProgress() {
  return getRepository().getWorldProgress();
}

export function getCharacterProgress() {
  return getRepository().getCharacterProgress();
}

export function getPendingReviews() {
  return getRepository().getPendingReviews();
}

export function getTaskTemplates() {
  return getRepository().getTaskTemplates();
}

export function createTask(input: TaskTemplateInput) {
  return getRepository().createTask(input);
}

export function toggleTask(taskId: number) {
  return getRepository().toggleTask(taskId);
}

export function submitTask(logId: number) {
  return getRepository().submitTask(logId);
}

export function approveTask(logId: number) {
  return getRepository().approveTask(logId);
}

export function rejectTask(logId: number, reason: string) {
  return getRepository().rejectTask(logId, reason);
}

export function claimTask(logId: number) {
  return getRepository().claimTask(logId);
}
