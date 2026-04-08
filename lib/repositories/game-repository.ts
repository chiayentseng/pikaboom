import type {
  CharacterProgress,
  PendingReview,
  ProfileSummary,
  StatsSummary,
  TaskTemplateInput,
  TaskTemplateRecord,
  TodayTask,
  WorldProgress
} from "@/lib/types/game";

export interface GameRepository {
  getProfile(): ProfileSummary;
  getTodayTasks(): TodayTask[];
  getStats(): StatsSummary;
  getWorldProgress(): WorldProgress[];
  getCharacterProgress(): CharacterProgress[];
  getPendingReviews(): PendingReview[];
  getTaskTemplates(): TaskTemplateRecord[];
  createTask(input: TaskTemplateInput): void;
  toggleTask(taskId: number): void;
  submitTask(logId: number): void;
  approveTask(logId: number): void;
  rejectTask(logId: number, reason: string): void;
  claimTask(logId: number): void;
}
