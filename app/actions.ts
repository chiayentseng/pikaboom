"use server";

import { revalidatePath } from "next/cache";
import {
  approveTask,
  claimTask,
  createTask,
  rejectTask,
  submitTask,
  toggleTask
} from "@/lib/server/game-facade";
import type { EnergyType } from "@/lib/types/game";

function toNumber(value: FormDataEntryValue | null, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function readId(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export async function createTaskAction(formData: FormData) {
  await createTask({
    title: String(formData.get("title") ?? "").trim() || "未命名任務",
    category: String(formData.get("category") ?? "自訂"),
    icon: String(formData.get("icon") ?? "⭐"),
    measurementType: String(formData.get("measurementType") ?? "一次"),
    targetValue: toNumber(formData.get("targetValue"), 1),
    unit: String(formData.get("unit") ?? "次"),
    repeatLabel: String(formData.get("repeatLabel") ?? "每日"),
    rewardExp: toNumber(formData.get("rewardExp"), 5),
    rewardEnergyType: String(formData.get("rewardEnergyType") ?? "智慧能量") as EnergyType,
    rewardEnergyValue: toNumber(formData.get("rewardEnergyValue"), 5),
    requiresApproval: formData.get("requiresApproval") === "on"
  });

  revalidatePath("/");
  revalidatePath("/child");
  revalidatePath("/child/tasks");
  revalidatePath("/parent");
  revalidatePath("/parent/tasks");
}

export async function toggleTaskAction(formData: FormData) {
  await toggleTask(readId(formData.get("taskId")));
  revalidatePath("/child/tasks");
  revalidatePath("/parent/tasks");
}

export async function submitTaskAction(formData: FormData) {
  await submitTask(readId(formData.get("logId")));
  revalidatePath("/");
  revalidatePath("/child");
  revalidatePath("/child/tasks");
  revalidatePath("/parent");
  revalidatePath("/parent/review");
}

export async function approveTaskAction(formData: FormData) {
  await approveTask(readId(formData.get("logId")));
  revalidatePath("/child");
  revalidatePath("/child/tasks");
  revalidatePath("/parent");
  revalidatePath("/parent/review");
}

export async function rejectTaskAction(formData: FormData) {
  await rejectTask(readId(formData.get("logId")), String(formData.get("reason") ?? "").trim());
  revalidatePath("/child/tasks");
  revalidatePath("/parent/review");
}

export async function claimTaskAction(formData: FormData) {
  await claimTask(readId(formData.get("logId")));
  revalidatePath("/");
  revalidatePath("/child");
  revalidatePath("/child/tasks");
  revalidatePath("/child/characters");
  revalidatePath("/child/map");
  revalidatePath("/child/collection");
  revalidatePath("/child/achievements");
  revalidatePath("/parent");
  revalidatePath("/parent/reports");
}
