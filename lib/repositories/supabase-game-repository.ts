import { characterDefinitions, levelFromExp, titleFromLevel, worldDefinitions } from "@/lib/domain/game-config";
import type { GameRepository } from "@/lib/repositories/game-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CharacterProgress,
  GameId,
  PendingReview,
  ProfileSummary,
  SessionContext,
  StatsSummary,
  TaskLifecycleStatus,
  TaskTemplateInput,
  TaskTemplateRecord,
  TodayTask,
  WorldProgress
} from "@/lib/types/game";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function startOfTrailingWeekIso() {
  const date = new Date();
  date.setDate(date.getDate() - 6);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function orderTasks(tasks: TodayTask[]) {
  const rank: Record<TaskLifecycleStatus, number> = {
    READY_TO_CLAIM: 0,
    NOT_STARTED: 1,
    REJECTED: 2,
    SUBMITTED: 3,
    CLAIMED: 4
  };

  return [...tasks].sort((left, right) => {
    const rankDiff = rank[left.status] - rank[right.status];
    if (rankDiff !== 0) return rankDiff;
    return left.title.localeCompare(right.title, "zh-Hant");
  });
}

export function canUseSupabaseGameRepository(session: SessionContext) {
  return Boolean(session.householdId && session.parentProfileId && session.childProfileId);
}

export class SupabaseGameRepository implements GameRepository {
  constructor(private readonly session: SessionContext) {}

  private async getClient() {
    return createSupabaseServerClient();
  }

  private requireHouseholdId() {
    if (!this.session.householdId) {
      throw new Error("Supabase household is not resolved yet.");
    }

    return this.session.householdId;
  }

  private requireParentProfileId() {
    if (!this.session.parentProfileId) {
      throw new Error("Supabase parent profile is not resolved yet.");
    }

    return this.session.parentProfileId;
  }

  private requireChildProfileId() {
    const childProfileId = this.session.actingChildId ?? this.session.childProfileId;
    if (!childProfileId) {
      throw new Error("Supabase child profile is not resolved yet.");
    }

    return childProfileId;
  }

  private async fetchTaskLogMap(instanceIds: string[]) {
    if (instanceIds.length === 0) {
      return new Map<string, {
        id: string;
        daily_task_instance_id: string;
        progress_value: number;
        status: TaskLifecycleStatus;
        submitted_at: string | null;
        rejection_reason: string | null;
      }>();
    }

    const supabase = await this.getClient();
    const { data, error } = await supabase
      .from("task_logs")
      .select("id,daily_task_instance_id,progress_value,status,submitted_at,rejection_reason,created_at")
      .in("daily_task_instance_id", instanceIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const map = new Map<string, {
      id: string;
      daily_task_instance_id: string;
      progress_value: number;
      status: TaskLifecycleStatus;
      submitted_at: string | null;
      rejection_reason: string | null;
    }>();

    for (const row of data ?? []) {
      if (!map.has(row.daily_task_instance_id)) {
        map.set(row.daily_task_instance_id, {
          id: row.id,
          daily_task_instance_id: row.daily_task_instance_id,
          progress_value: Number(row.progress_value ?? 0),
          status: row.status as TaskLifecycleStatus,
          submitted_at: row.submitted_at,
          rejection_reason: row.rejection_reason
        });
      }
    }

    return map;
  }

  private async ensureTodayInstances() {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();
    const childProfileId = this.requireChildProfileId();
    const date = todayKey();

    const { data: templates, error: templateError } = await supabase
      .from("task_templates")
      .select("id,title,category,icon_key,measurement_type,target_value,unit,repeat_type,reward_exp,reward_energy_type,reward_energy_value,requires_parent_approval")
      .eq("household_id", householdId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (templateError) {
      throw templateError;
    }

    const { data: existingInstances, error: existingError } = await supabase
      .from("daily_task_instances")
      .select("id,task_template_id")
      .eq("child_profile_id", childProfileId)
      .eq("task_date", date);

    if (existingError) {
      throw existingError;
    }

    const existingTemplateIds = new Set((existingInstances ?? []).map((item) => item.task_template_id));
    const missingTemplates = (templates ?? []).filter((template) => !existingTemplateIds.has(template.id));

    if (missingTemplates.length > 0) {
      const { error: insertError } = await supabase.from("daily_task_instances").insert(
        missingTemplates.map((template) => ({
          child_profile_id: childProfileId,
          household_id: householdId,
          task_template_id: template.id,
          task_date: date,
          title_snapshot: template.title,
          category_snapshot: template.category,
          target_value_snapshot: template.target_value,
          unit_snapshot: template.unit,
          reward_exp_snapshot: template.reward_exp,
          reward_energy_type_snapshot: template.reward_energy_type,
          reward_energy_value_snapshot: template.reward_energy_value,
          requires_parent_approval_snapshot: template.requires_parent_approval,
          status: "NOT_STARTED"
        }))
      );

      if (insertError) {
        throw insertError;
      }
    }

    const { data: instances, error: instanceError } = await supabase
      .from("daily_task_instances")
      .select("id,task_template_id,title_snapshot,category_snapshot,target_value_snapshot,unit_snapshot,reward_exp_snapshot,reward_energy_type_snapshot,reward_energy_value_snapshot,requires_parent_approval_snapshot,status")
      .eq("child_profile_id", childProfileId)
      .eq("task_date", date)
      .order("created_at", { ascending: true });

    if (instanceError) {
      throw instanceError;
    }

    const instanceIds = (instances ?? []).map((instance) => instance.id);
    const taskLogMap = await this.fetchTaskLogMap(instanceIds);
    const missingLogs = (instances ?? []).filter((instance) => !taskLogMap.has(instance.id));

    if (missingLogs.length > 0) {
      const { error: insertLogError } = await supabase.from("task_logs").insert(
        missingLogs.map((instance) => ({
          household_id: householdId,
          daily_task_instance_id: instance.id,
          child_profile_id: childProfileId,
          progress_value: 0,
          status: "NOT_STARTED"
        }))
      );

      if (insertLogError) {
        throw insertLogError;
      }
    }

    const refreshedLogMap = await this.fetchTaskLogMap(instanceIds);
    const templateMap = new Map((templates ?? []).map((template) => [template.id, template]));

    return {
      templates: templates ?? [],
      instances: instances ?? [],
      logs: refreshedLogMap,
      templateMap
    };
  }

  async getProfile(): Promise<ProfileSummary> {
    const supabase = await this.getClient();
    const childProfileId = this.requireChildProfileId();

    const { data: childProfile, error: childError } = await supabase
      .from("child_profiles")
      .select("id,profile_id,level,exp,streak_days,star_currency")
      .eq("id", childProfileId)
      .maybeSingle();

    if (childError) {
      throw childError;
    }

    if (!childProfile) {
      throw new Error("Child profile not found in Supabase.");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", childProfile.profile_id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const levelInfo = levelFromExp(childProfile.exp);

    return {
      id: childProfile.id,
      name: profile?.display_name ?? "小冒險家",
      totalExp: childProfile.exp,
      level: childProfile.level,
      title: titleFromLevel(childProfile.level),
      stars: childProfile.star_currency,
      streakDays: childProfile.streak_days,
      currentLevelExp: levelInfo.currentLevelExp,
      nextLevelExp: levelInfo.nextLevelExp
    };
  }

  async getTodayTasks(): Promise<TodayTask[]> {
    const { instances, logs, templateMap } = await this.ensureTodayInstances();

    const tasks = instances.map((instance) => {
      const log = logs.get(instance.id);
      const template = templateMap.get(instance.task_template_id);

      return {
        logId: instance.id,
        taskId: instance.task_template_id,
        title: instance.title_snapshot,
        category: instance.category_snapshot,
        icon: template?.icon_key ?? "⭐",
        measurementType: template?.measurement_type ?? "一次",
        targetValue: Number(instance.target_value_snapshot),
        unit: instance.unit_snapshot,
        repeatLabel: template?.repeat_type ?? "每日",
        rewardExp: instance.reward_exp_snapshot,
        rewardEnergyType: instance.reward_energy_type_snapshot,
        rewardEnergyValue: instance.reward_energy_value_snapshot,
        requiresApproval: instance.requires_parent_approval_snapshot,
        status: (log?.status ?? instance.status) as TaskLifecycleStatus,
        progressValue: log?.progress_value ?? 0,
        rejectionReason: log?.rejection_reason ?? null
      } satisfies TodayTask;
    });

    return orderTasks(tasks);
  }

  async getStats(): Promise<StatsSummary> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();
    const childProfileId = this.requireChildProfileId();
    const today = todayKey();
    const weekStart = startOfTrailingWeekIso();

    const { count: totalClaimed, error: totalClaimedError } = await supabase
      .from("daily_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("child_profile_id", childProfileId)
      .eq("status", "CLAIMED");

    if (totalClaimedError) throw totalClaimedError;

    const { count: pendingApprovals, error: pendingError } = await supabase
      .from("daily_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("household_id", householdId)
      .eq("status", "SUBMITTED");

    if (pendingError) throw pendingError;

    const { count: todayClaimed, error: todayClaimedError } = await supabase
      .from("daily_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("child_profile_id", childProfileId)
      .eq("task_date", today)
      .eq("status", "CLAIMED");

    if (todayClaimedError) throw todayClaimedError;

    const { count: totalTasks, error: totalTasksError } = await supabase
      .from("daily_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("child_profile_id", childProfileId)
      .eq("task_date", today);

    if (totalTasksError) throw totalTasksError;

    const { data: weeklyRows, error: weeklyError } = await supabase
      .from("daily_task_instances")
      .select("status,category_snapshot")
      .eq("child_profile_id", childProfileId)
      .gte("task_date", weekStart);

    if (weeklyError) throw weeklyError;

    const weeklyCompletion = (weeklyRows ?? []).filter((row) => row.status === "CLAIMED").length;
    const categoryCounts = new Map<string, number>();
    for (const row of weeklyRows ?? []) {
      if (row.status !== "CLAIMED") continue;
      categoryCounts.set(row.category_snapshot, (categoryCounts.get(row.category_snapshot) ?? 0) + 1);
    }

    const topCategory = [...categoryCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ?? "尚未開始";

    return {
      totalClaimed: totalClaimed ?? 0,
      pendingApprovals: pendingApprovals ?? 0,
      todayClaimed: todayClaimed ?? 0,
      totalTasks: totalTasks ?? 0,
      weeklyCompletion,
      completionRate: (weeklyRows?.length ?? 0) === 0 ? 0 : Math.round((weeklyCompletion / (weeklyRows?.length ?? 1)) * 100),
      topCategory
    };
  }

  async getWorldProgress(): Promise<WorldProgress[]> {
    const stats = await this.getStats();

    return worldDefinitions.map((world, index) => {
      const previousTarget = index === 0 ? 0 : worldDefinitions[index - 1]!.unlockTarget;
      const segmentTotal = world.unlockTarget - previousTarget;
      const progressInSegment = Math.max(0, Math.min(segmentTotal, stats.totalClaimed - previousTarget));
      const progress = Math.round((progressInSegment / segmentTotal) * 100);
      const state: WorldProgress["state"] =
        stats.totalClaimed >= world.unlockTarget ? "UNLOCKED" : index === 0 || stats.totalClaimed >= previousTarget ? "IN_PROGRESS" : "LOCKED";

      return {
        ...world,
        progress,
        state,
        unlockHint:
          state === "UNLOCKED"
            ? "這個區域已經開啟，可以繼續朝下一區前進。"
            : `還差 ${Math.max(0, world.unlockTarget - stats.totalClaimed)} 次完成就能解鎖。`
      };
    });
  }

  async getCharacterProgress(): Promise<CharacterProgress[]> {
    const profile = await this.getProfile();

    return characterDefinitions.map((character) => {
      const unlocked = profile.totalExp >= character.unlockExp && (character.streakRequired ? profile.streakDays >= character.streakRequired : true);
      const growth = unlocked ? Math.min(100, Math.max(12, profile.totalExp - character.unlockExp)) : 0;

      return {
        ...character,
        unlocked,
        growth,
        goal: 100,
        stage: unlocked ? (growth >= 80 ? "進化中" : "成長中") : "未解鎖",
        unlockHint: unlocked
          ? undefined
          : character.streakRequired
            ? `需要 ${character.unlockExp} EXP，並維持 ${character.streakRequired} 天連續完成。`
            : `累積 ${character.unlockExp} EXP 後解鎖。`
      };
    });
  }

  async getPendingReviews(): Promise<PendingReview[]> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();

    const { data: instances, error: instanceError } = await supabase
      .from("daily_task_instances")
      .select("id,title_snapshot,category_snapshot,target_value_snapshot,unit_snapshot")
      .eq("household_id", householdId)
      .eq("status", "SUBMITTED")
      .order("updated_at", { ascending: true });

    if (instanceError) throw instanceError;

    const instanceIds = (instances ?? []).map((item) => item.id);
    const logMap = await this.fetchTaskLogMap(instanceIds);
    const templateIds = (instances ?? []).map((item) => item.id);
    const { data: taskInstances, error: joinError } = await supabase
      .from("daily_task_instances")
      .select("id,task_template_id")
      .in("id", templateIds);

    if (joinError) throw joinError;

    const { data: templates, error: templateError } = await supabase
      .from("task_templates")
      .select("id,icon_key")
      .in("id", (taskInstances ?? []).map((item) => item.task_template_id));

    if (templateError) throw templateError;

    const iconByTemplate = new Map((templates ?? []).map((item) => [item.id, item.icon_key]));
    const templateIdByInstance = new Map((taskInstances ?? []).map((item) => [item.id, item.task_template_id]));

    return (instances ?? []).map((instance) => {
      const log = logMap.get(instance.id);
      const templateId = templateIdByInstance.get(instance.id);

      return {
        id: instance.id,
        taskTitle: instance.title_snapshot,
        category: instance.category_snapshot,
        icon: templateId ? iconByTemplate.get(templateId) ?? "⭐" : "⭐",
        submittedAt: log?.submitted_at ?? new Date().toISOString(),
        progressValue: log?.progress_value ?? Number(instance.target_value_snapshot),
        targetValue: Number(instance.target_value_snapshot),
        unit: instance.unit_snapshot
      };
    });
  }

  async getTaskTemplates(): Promise<TaskTemplateRecord[]> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();

    const { data, error } = await supabase
      .from("task_templates")
      .select("id,title,category,icon_key,measurement_type,target_value,unit,repeat_type,reward_exp,reward_energy_type,reward_energy_value,requires_parent_approval,is_active")
      .eq("household_id", householdId)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      category: row.category,
      icon: row.icon_key,
      measurementType: row.measurement_type,
      targetValue: Number(row.target_value),
      unit: row.unit,
      repeatLabel: row.repeat_type,
      rewardExp: row.reward_exp,
      rewardEnergyType: row.reward_energy_type,
      rewardEnergyValue: row.reward_energy_value,
      requiresApproval: row.requires_parent_approval,
      isActive: row.is_active
    }));
  }

  async createTask(input: TaskTemplateInput): Promise<void> {
    const supabase = await this.getClient();

    const { error } = await supabase.from("task_templates").insert({
      household_id: this.requireHouseholdId(),
      parent_profile_id: this.requireParentProfileId(),
      title: input.title,
      category: input.category,
      icon_key: input.icon,
      measurement_type: input.measurementType,
      target_value: input.targetValue,
      unit: input.unit,
      repeat_type: input.repeatLabel,
      reward_exp: input.rewardExp,
      reward_energy_type: input.rewardEnergyType,
      reward_energy_value: input.rewardEnergyValue,
      requires_parent_approval: input.requiresApproval
    });

    if (error) {
      throw error;
    }
  }

  async toggleTask(taskId: GameId): Promise<void> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();

    const { data: task, error: fetchError } = await supabase
      .from("task_templates")
      .select("id,is_active")
      .eq("id", taskId)
      .eq("household_id", householdId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!task) return;

    const { error: updateError } = await supabase
      .from("task_templates")
      .update({ is_active: !task.is_active, updated_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("household_id", householdId);

    if (updateError) throw updateError;
  }

  async submitTask(logId: GameId): Promise<void> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();
    const childProfileId = this.requireChildProfileId();

    const { data: instance, error: instanceError } = await supabase
      .from("daily_task_instances")
      .select("id,target_value_snapshot,requires_parent_approval_snapshot,status")
      .eq("id", logId)
      .eq("child_profile_id", childProfileId)
      .maybeSingle();

    if (instanceError) throw instanceError;
    if (!instance || !["NOT_STARTED", "REJECTED"].includes(instance.status)) return;

    const nextStatus = instance.requires_parent_approval_snapshot ? "SUBMITTED" : "READY_TO_CLAIM";
    const now = new Date().toISOString();

    const { error: updateInstanceError } = await supabase
      .from("daily_task_instances")
      .update({ status: nextStatus, updated_at: now })
      .eq("id", logId)
      .eq("household_id", householdId);

    if (updateInstanceError) throw updateInstanceError;

    const { error: updateLogError } = await supabase
      .from("task_logs")
      .update({ status: nextStatus, progress_value: Number(instance.target_value_snapshot), submitted_at: now, rejection_reason: null, updated_at: now })
      .eq("daily_task_instance_id", logId)
      .eq("household_id", householdId);

    if (updateLogError) throw updateLogError;
  }

  async approveTask(logId: GameId): Promise<void> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();
    const now = new Date().toISOString();

    const { error: updateInstanceError } = await supabase
      .from("daily_task_instances")
      .update({ status: "READY_TO_CLAIM", updated_at: now })
      .eq("id", logId)
      .eq("household_id", householdId)
      .eq("status", "SUBMITTED");

    if (updateInstanceError) throw updateInstanceError;

    const { error: updateLogError } = await supabase
      .from("task_logs")
      .update({ status: "READY_TO_CLAIM", approved_at: now, updated_at: now })
      .eq("daily_task_instance_id", logId)
      .eq("household_id", householdId)
      .eq("status", "SUBMITTED");

    if (updateLogError) throw updateLogError;
  }

  async rejectTask(logId: GameId, reason: string): Promise<void> {
    const supabase = await this.getClient();
    const householdId = this.requireHouseholdId();
    const now = new Date().toISOString();
    const rejectionReason = reason || "請再確認一次";

    const { error: updateInstanceError } = await supabase
      .from("daily_task_instances")
      .update({ status: "REJECTED", updated_at: now })
      .eq("id", logId)
      .eq("household_id", householdId)
      .eq("status", "SUBMITTED");

    if (updateInstanceError) throw updateInstanceError;

    const { error: updateLogError } = await supabase
      .from("task_logs")
      .update({ status: "REJECTED", rejection_reason: rejectionReason, updated_at: now })
      .eq("daily_task_instance_id", logId)
      .eq("household_id", householdId)
      .eq("status", "SUBMITTED");

    if (updateLogError) throw updateLogError;
  }

  async claimTask(logId: GameId): Promise<void> {
    const supabase = await this.getClient();
    const childProfileId = this.requireChildProfileId();
    const householdId = this.requireHouseholdId();

    const { data: instance, error: instanceError } = await supabase
      .from("daily_task_instances")
      .select("id,task_date,reward_exp_snapshot,reward_energy_value_snapshot,status")
      .eq("id", logId)
      .eq("child_profile_id", childProfileId)
      .maybeSingle();

    if (instanceError) throw instanceError;
    if (!instance || instance.status !== "READY_TO_CLAIM") return;

    const profile = await this.getProfile();

    const { data: sameDayClaims, error: sameDayError } = await supabase
      .from("daily_task_instances")
      .select("id", { count: "exact" })
      .eq("child_profile_id", childProfileId)
      .eq("task_date", instance.task_date)
      .eq("status", "CLAIMED");

    if (sameDayError) throw sameDayError;

    const { data: lastClaimRows, error: lastClaimError } = await supabase
      .from("daily_task_instances")
      .select("task_date")
      .eq("child_profile_id", childProfileId)
      .eq("status", "CLAIMED")
      .order("task_date", { ascending: false })
      .limit(1);

    if (lastClaimError) throw lastClaimError;

    let nextStreak = profile.streakDays;
    const hadClaimedSameDay = (sameDayClaims?.length ?? 0) > 0;
    const lastClaimDate = lastClaimRows?.[0]?.task_date ?? null;

    if (!hadClaimedSameDay) {
      if (!lastClaimDate) nextStreak = 1;
      else if (lastClaimDate === yesterdayKey(instance.task_date)) nextStreak = profile.streakDays + 1;
      else if (lastClaimDate !== instance.task_date) nextStreak = 1;
    }

    const nextTotalExp = profile.totalExp + instance.reward_exp_snapshot;
    const levelInfo = levelFromExp(nextTotalExp);
    const now = new Date().toISOString();

    const { error: updateInstanceError } = await supabase
      .from("daily_task_instances")
      .update({ status: "CLAIMED", updated_at: now })
      .eq("id", logId)
      .eq("child_profile_id", childProfileId);

    if (updateInstanceError) throw updateInstanceError;

    const { error: updateLogError } = await supabase
      .from("task_logs")
      .update({ status: "CLAIMED", claimed_at: now, updated_at: now })
      .eq("daily_task_instance_id", logId)
      .eq("child_profile_id", childProfileId);

    if (updateLogError) throw updateLogError;

    const { error: updateProfileError } = await supabase
      .from("child_profiles")
      .update({
        exp: nextTotalExp,
        level: levelInfo.level,
        streak_days: nextStreak,
        star_currency: profile.stars + instance.reward_energy_value_snapshot,
        updated_at: now
      })
      .eq("id", childProfileId);

    if (updateProfileError) throw updateProfileError;

    const { error: rewardLogError } = await supabase.from("reward_logs").insert([
      {
        household_id: householdId,
        child_profile_id: childProfileId,
        source_type: "task_claim",
        source_id: logId,
        reward_type: "exp",
        reward_subtype: "player_exp",
        amount: instance.reward_exp_snapshot,
        metadata_json: { claimed_at: now }
      },
      {
        household_id: householdId,
        child_profile_id: childProfileId,
        source_type: "task_claim",
        source_id: logId,
        reward_type: "currency",
        reward_subtype: "star_currency",
        amount: instance.reward_energy_value_snapshot,
        metadata_json: { claimed_at: now }
      }
    ]);

    if (rewardLogError) throw rewardLogError;
  }
}

export function getSupabaseGameRepository(session: SessionContext): GameRepository {
  return new SupabaseGameRepository(session);
}
