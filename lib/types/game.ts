export type GameId = string;

export type EnergyType =
  | "智慧能量"
  | "音樂能量"
  | "活力能量"
  | "愛心能量"
  | "星星碎片";

export type TaskLifecycleStatus =
  | "NOT_STARTED"
  | "SUBMITTED"
  | "READY_TO_CLAIM"
  | "CLAIMED"
  | "REJECTED";

export type ProfileSummary = {
  id: GameId;
  name: string;
  totalExp: number;
  level: number;
  title: string;
  stars: number;
  streakDays: number;
  currentLevelExp: number;
  nextLevelExp: number;
};

export type TodayTask = {
  logId: GameId;
  taskId: GameId;
  title: string;
  category: string;
  icon: string;
  measurementType: string;
  targetValue: number;
  unit: string;
  repeatLabel: string;
  rewardExp: number;
  rewardEnergyType: EnergyType;
  rewardEnergyValue: number;
  requiresApproval: boolean;
  status: TaskLifecycleStatus;
  progressValue: number;
  rejectionReason: string | null;
};

export type TaskTemplateRecord = {
  id: GameId;
  title: string;
  category: string;
  icon: string;
  measurementType: string;
  targetValue: number;
  unit: string;
  repeatLabel: string;
  rewardExp: number;
  rewardEnergyType: EnergyType;
  rewardEnergyValue: number;
  requiresApproval: boolean;
  isActive: boolean;
};

export type CharacterProgress = {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  unlocked: boolean;
  growth: number;
  goal: number;
  stage: string;
  growthEnergy: EnergyType;
  unlockHint?: string;
  streakRequired?: number;
  unlockExp: number;
};

export type WorldProgressState = "LOCKED" | "IN_PROGRESS" | "UNLOCKED";

export type WorldProgress = {
  id: string;
  name: string;
  theme: string;
  unlockTarget: number;
  progress: number;
  state: WorldProgressState;
  unlockHint: string;
};

export type StatsSummary = {
  totalClaimed: number;
  pendingApprovals: number;
  todayClaimed: number;
  totalTasks: number;
  weeklyCompletion: number;
  completionRate: number;
  topCategory: string;
};

export type PendingReview = {
  id: GameId;
  taskTitle: string;
  category: string;
  icon: string;
  submittedAt: string;
  progressValue: number;
  targetValue: number;
  unit: string;
};

export type TaskTemplateInput = {
  title: string;
  category: string;
  icon: string;
  measurementType: string;
  targetValue: number;
  unit: string;
  repeatLabel: string;
  rewardExp: number;
  rewardEnergyType: EnergyType;
  rewardEnergyValue: number;
  requiresApproval: boolean;
};

export type SessionRole = "guest" | "parent" | "child";

export type SessionContext = {
  role: SessionRole;
  householdId: string | null;
  parentProfileId: string | null;
  childProfileId: string | null;
  actingChildId: string | null;
};
