import type {
  CharacterProgress,
  GameId,
  PendingReview,
  ProfileSummary,
  SessionContext,
  StatsSummary,
  TaskTemplateInput,
  TaskTemplateRecord,
  TodayTask,
  WorldProgress
} from "@/lib/types/game";

export interface GameRepository {
  getProfile(): Promise<ProfileSummary>;
  getTodayTasks(): Promise<TodayTask[]>;
  getStats(): Promise<StatsSummary>;
  getWorldProgress(): Promise<WorldProgress[]>;
  getCharacterProgress(): Promise<CharacterProgress[]>;
  getPendingReviews(): Promise<PendingReview[]>;
  getTaskTemplates(): Promise<TaskTemplateRecord[]>;
  createTask(input: TaskTemplateInput): Promise<void>;
  toggleTask(taskId: GameId): Promise<void>;
  submitTask(logId: GameId): Promise<void>;
  approveTask(logId: GameId): Promise<void>;
  rejectTask(logId: GameId, reason: string): Promise<void>;
  claimTask(logId: GameId): Promise<void>;
}

export type GameRepositoryFactory = (session: SessionContext) => GameRepository;
