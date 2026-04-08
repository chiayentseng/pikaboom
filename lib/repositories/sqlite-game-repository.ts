import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { characterDefinitions, levelFromExp, titleFromLevel, worldDefinitions } from "@/lib/domain/game-config";
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
import type { GameRepository } from "@/lib/repositories/game-repository";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "pikaboom.db");

type SqliteDb = Database.Database;

declare global {
  // eslint-disable-next-line no-var
  var __pikaboomSqliteDb: SqliteDb | undefined;
}

function nowIso() {
  return new Date().toISOString();
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function openDb() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

function ensureTodayLogs(db: SqliteDb, date = todayKey()) {
  const tasks = db.prepare("SELECT id, reward_exp, reward_energy_value FROM task_templates WHERE is_active = 1").all() as Array<{
    id: number;
    reward_exp: number;
    reward_energy_value: number;
  }>;

  const insertLog = db.prepare(`
    INSERT OR IGNORE INTO task_logs
    (task_template_id, log_date, status, progress_value, reward_exp_snapshot, reward_energy_value_snapshot)
    VALUES (@task_template_id, @log_date, 'NOT_STARTED', 0, @reward_exp_snapshot, @reward_energy_value_snapshot)
  `);

  const tx = db.transaction(() => {
    for (const task of tasks) {
      insertLog.run({
        task_template_id: task.id,
        log_date: date,
        reward_exp_snapshot: task.reward_exp,
        reward_energy_value_snapshot: task.reward_energy_value
      });
    }
  });
  tx();
}

function ensureSchema(db: SqliteDb) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS child_profile (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL,
      total_exp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL DEFAULT '小小新芽',
      stars INTEGER NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL,
      measurement_type TEXT NOT NULL DEFAULT '一次',
      target_value INTEGER NOT NULL DEFAULT 1,
      unit TEXT NOT NULL DEFAULT '次',
      repeat_label TEXT NOT NULL DEFAULT '每日',
      reward_exp INTEGER NOT NULL DEFAULT 5,
      reward_energy_type TEXT NOT NULL DEFAULT '智慧能量',
      reward_energy_value INTEGER NOT NULL DEFAULT 5,
      requires_approval INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_template_id INTEGER NOT NULL,
      log_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NOT_STARTED',
      progress_value INTEGER NOT NULL DEFAULT 0,
      submitted_at TEXT,
      approved_at TEXT,
      claimed_at TEXT,
      rejection_reason TEXT,
      reward_exp_snapshot INTEGER NOT NULL DEFAULT 0,
      reward_energy_value_snapshot INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (task_template_id) REFERENCES task_templates(id),
      UNIQUE(task_template_id, log_date)
    );
  `);

  const profileCount = db.prepare("SELECT COUNT(*) AS count FROM child_profile").get() as { count: number };
  if (profileCount.count === 0) {
    db.prepare(
      "INSERT INTO child_profile (id, name, total_exp, level, title, stars, streak_days, updated_at) VALUES (1, ?, 0, 1, '小小新芽', 0, 0, ?)"
    ).run("晴晴", nowIso());
  }

  const taskCount = db.prepare("SELECT COUNT(*) AS count FROM task_templates").get() as { count: number };
  if (taskCount.count === 0) {
    const insertTask = db.prepare(`
      INSERT INTO task_templates
      (title, category, icon, measurement_type, target_value, unit, repeat_label, reward_exp, reward_energy_type, reward_energy_value, requires_approval, is_active, created_at)
      VALUES
      (@title, @category, @icon, @measurement_type, @target_value, @unit, @repeat_label, @reward_exp, @reward_energy_type, @reward_energy_value, @requires_approval, 1, @created_at)
    `);

    const createdAt = nowIso();
    const seedTasks: TaskTemplateInput[] = [
      { title: "數學練習", category: "學習", icon: "📘", measurementType: "時間", targetValue: 15, unit: "分鐘", repeatLabel: "每日", rewardExp: 12, rewardEnergyType: "智慧能量", rewardEnergyValue: 10, requiresApproval: false },
      { title: "鋼琴練習", category: "才藝", icon: "🎹", measurementType: "時間", targetValue: 20, unit: "分鐘", repeatLabel: "每週一三五", rewardExp: 16, rewardEnergyType: "音樂能量", rewardEnergyValue: 12, requiresApproval: true },
      { title: "晚安閱讀", category: "閱讀", icon: "📚", measurementType: "一次", targetValue: 1, unit: "次", repeatLabel: "每日", rewardExp: 8, rewardEnergyType: "智慧能量", rewardEnergyValue: 6, requiresApproval: false },
      { title: "刷牙收尾", category: "生活習慣", icon: "🪥", measurementType: "次數", targetValue: 2, unit: "次", repeatLabel: "每日", rewardExp: 6, rewardEnergyType: "愛心能量", rewardEnergyValue: 8, requiresApproval: true }
    ];

    const tx = db.transaction(() => {
      for (const task of seedTasks) {
        insertTask.run({
          title: task.title,
          category: task.category,
          icon: task.icon,
          measurement_type: task.measurementType,
          target_value: task.targetValue,
          unit: task.unit,
          repeat_label: task.repeatLabel,
          reward_exp: task.rewardExp,
          reward_energy_type: task.rewardEnergyType,
          reward_energy_value: task.rewardEnergyValue,
          requires_approval: task.requiresApproval ? 1 : 0,
          created_at: createdAt
        });
      }
    });
    tx();
  }

  ensureTodayLogs(db);
}

function getDb() {
  if (!global.__pikaboomSqliteDb) {
    global.__pikaboomSqliteDb = openDb();
    ensureSchema(global.__pikaboomSqliteDb);
  }
  return global.__pikaboomSqliteDb;
}

export class SqliteGameRepository implements GameRepository {
  private readonly db = getDb();

  getProfile(): ProfileSummary {
    const profile = this.db.prepare("SELECT * FROM child_profile WHERE id = 1").get() as {
      name: string;
      total_exp: number;
      level: number;
      title: string;
      stars: number;
      streak_days: number;
    };
    const levelInfo = levelFromExp(profile.total_exp);
    return { name: profile.name, totalExp: profile.total_exp, level: profile.level, title: profile.title, stars: profile.stars, streakDays: profile.streak_days, currentLevelExp: levelInfo.currentLevelExp, nextLevelExp: levelInfo.nextLevelExp };
  }

  getTodayTasks(): TodayTask[] {
    ensureTodayLogs(this.db);
    return this.db.prepare(`
      SELECT l.id AS logId, t.id AS taskId, t.title, t.category, t.icon,
        t.measurement_type AS measurementType, t.target_value AS targetValue, t.unit, t.repeat_label AS repeatLabel,
        l.reward_exp_snapshot AS rewardExp, t.reward_energy_type AS rewardEnergyType, l.reward_energy_value_snapshot AS rewardEnergyValue,
        t.requires_approval AS requiresApproval, l.status, l.progress_value AS progressValue, l.rejection_reason AS rejectionReason
      FROM task_logs l
      JOIN task_templates t ON t.id = l.task_template_id
      WHERE l.log_date = ?
      ORDER BY CASE l.status
        WHEN 'READY_TO_CLAIM' THEN 0
        WHEN 'NOT_STARTED' THEN 1
        WHEN 'REJECTED' THEN 2
        WHEN 'SUBMITTED' THEN 3
        WHEN 'CLAIMED' THEN 4
        ELSE 5 END, t.id
    `).all(todayKey()) as TodayTask[];
  }

  getStats(): StatsSummary {
    ensureTodayLogs(this.db);
    const totalClaimed = (this.db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE status = 'CLAIMED'").get() as { count: number }).count;
    const pendingApprovals = (this.db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE status = 'SUBMITTED'").get() as { count: number }).count;
    const todayClaimed = (this.db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE log_date = ? AND status = 'CLAIMED'").get(todayKey()) as { count: number }).count;
    const totalTasks = (this.db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE log_date = ?").get(todayKey()) as { count: number }).count;
    const weeklyCompletion = (this.db.prepare(`SELECT COUNT(*) AS count FROM task_logs WHERE status = 'CLAIMED' AND log_date >= date('now', '-6 day')`).get() as { count: number }).count;
    const weeklyTotal = (this.db.prepare(`SELECT COUNT(*) AS count FROM task_logs WHERE log_date >= date('now', '-6 day')`).get() as { count: number }).count;
    const categoryRows = this.db.prepare(`
      SELECT t.category AS category, COUNT(*) AS count
      FROM task_logs l JOIN task_templates t ON t.id = l.task_template_id
      WHERE l.status = 'CLAIMED'
      GROUP BY t.category
      ORDER BY count DESC
    `).all() as Array<{ category: string; count: number }>;

    return { totalClaimed, pendingApprovals, todayClaimed, totalTasks, weeklyCompletion, completionRate: weeklyTotal === 0 ? 0 : Math.round((weeklyCompletion / weeklyTotal) * 100), topCategory: categoryRows[0]?.category ?? "尚未開始" };
  }

  getWorldProgress(): WorldProgress[] {
    const stats = this.getStats();
    return worldDefinitions.map((world, index) => {
      const previousTarget = index === 0 ? 0 : worldDefinitions[index - 1]!.unlockTarget;
      const segmentTotal = world.unlockTarget - previousTarget;
      const progressInSegment = Math.max(0, Math.min(segmentTotal, stats.totalClaimed - previousTarget));
      const progress = Math.round((progressInSegment / segmentTotal) * 100);
      const state: WorldProgress["state"] = stats.totalClaimed >= world.unlockTarget ? "已開啟" : index === 0 || stats.totalClaimed >= previousTarget ? "建造中" : "尚未解鎖";
      return { ...world, progress, state, unlockHint: state === "已開啟" ? "已經可以在這一區繼續推進。" : `還差 ${Math.max(0, world.unlockTarget - stats.totalClaimed)} 次領獎就能解鎖。` };
    });
  }

  getCharacterProgress(): CharacterProgress[] {
    const profile = this.getProfile();
    return characterDefinitions.map((character) => {
      const unlocked = profile.totalExp >= character.unlockExp && (character.streakRequired ? profile.streakDays >= character.streakRequired : true);
      const growth = unlocked ? Math.min(100, Math.max(12, profile.totalExp - character.unlockExp)) : 0;
      return { ...character, unlocked, growth, goal: 100, stage: unlocked ? (growth >= 80 ? "成長期" : "幼年") : "未解鎖", unlockHint: unlocked ? undefined : character.streakRequired ? `需要 ${character.unlockExp} EXP 並連續 ${character.streakRequired} 天完成任務` : `需要累積 ${character.unlockExp} EXP` };
    });
  }

  getPendingReviews(): PendingReview[] {
    return this.db.prepare(`
      SELECT l.id, t.title AS taskTitle, t.category, t.icon, l.submitted_at AS submittedAt, l.progress_value AS progressValue, t.target_value AS targetValue, t.unit
      FROM task_logs l JOIN task_templates t ON t.id = l.task_template_id
      WHERE l.status = 'SUBMITTED'
      ORDER BY l.submitted_at ASC
    `).all() as PendingReview[];
  }

  getTaskTemplates(): TaskTemplateRecord[] {
    return this.db.prepare(`
      SELECT id, title, category, icon, measurement_type AS measurementType, target_value AS targetValue, unit, repeat_label AS repeatLabel,
        reward_exp AS rewardExp, reward_energy_type AS rewardEnergyType, reward_energy_value AS rewardEnergyValue, requires_approval AS requiresApproval, is_active AS isActive
      FROM task_templates
      ORDER BY is_active DESC, id DESC
    `).all().map((row) => ({
      ...(row as Omit<TaskTemplateRecord, "requiresApproval" | "isActive"> & { requiresApproval: number; isActive: number }),
      requiresApproval: Boolean((row as { requiresApproval: number }).requiresApproval),
      isActive: Boolean((row as { isActive: number }).isActive)
    }));
  }

  createTask(input: TaskTemplateInput) {
    this.db.prepare(`
      INSERT INTO task_templates
      (title, category, icon, measurement_type, target_value, unit, repeat_label, reward_exp, reward_energy_type, reward_energy_value, requires_approval, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(input.title, input.category, input.icon, input.measurementType, input.targetValue, input.unit, input.repeatLabel, input.rewardExp, input.rewardEnergyType, input.rewardEnergyValue, input.requiresApproval ? 1 : 0, nowIso());
    ensureTodayLogs(this.db);
  }

  toggleTask(taskId: number) {
    this.db.prepare("UPDATE task_templates SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?").run(taskId);
    ensureTodayLogs(this.db);
  }

  submitTask(logId: number) {
    const log = this.db.prepare(`
      SELECT l.id, l.status, t.target_value AS targetValue, t.requires_approval AS requiresApproval
      FROM task_logs l JOIN task_templates t ON t.id = l.task_template_id
      WHERE l.id = ?
    `).get(logId) as { id: number; status: string; targetValue: number; requiresApproval: number } | undefined;
    if (!log || !["NOT_STARTED", "REJECTED"].includes(log.status)) return;
    this.db.prepare(`UPDATE task_logs SET status = ?, progress_value = ?, submitted_at = ?, rejection_reason = NULL WHERE id = ?`).run(log.requiresApproval ? "SUBMITTED" : "READY_TO_CLAIM", log.targetValue, nowIso(), logId);
  }

  approveTask(logId: number) {
    this.db.prepare("UPDATE task_logs SET status = 'READY_TO_CLAIM', approved_at = ? WHERE id = ? AND status = 'SUBMITTED'").run(nowIso(), logId);
  }

  rejectTask(logId: number, reason: string) {
    this.db.prepare("UPDATE task_logs SET status = 'REJECTED', rejection_reason = ? WHERE id = ? AND status = 'SUBMITTED'").run(reason || "請再確認一次", logId);
  }

  claimTask(logId: number) {
    const log = this.db.prepare(`
      SELECT id, log_date AS logDate, reward_exp_snapshot AS rewardExp, reward_energy_value_snapshot AS rewardEnergyValue
      FROM task_logs WHERE id = ? AND status = 'READY_TO_CLAIM'
    `).get(logId) as { id: number; logDate: string; rewardExp: number; rewardEnergyValue: number } | undefined;
    if (!log) return;

    const profile = this.getProfile();
    const hadClaimedSameDay = (this.db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE log_date = ? AND status = 'CLAIMED'").get(log.logDate) as { count: number }).count > 0;
    const lastClaimed = this.db.prepare("SELECT log_date AS logDate FROM task_logs WHERE status = 'CLAIMED' ORDER BY log_date DESC LIMIT 1").get() as { logDate: string } | undefined;

    let nextStreak = profile.streakDays;
    if (!hadClaimedSameDay) {
      if (!lastClaimed) nextStreak = 1;
      else if (lastClaimed.logDate === yesterdayKey(log.logDate)) nextStreak = profile.streakDays + 1;
      else if (lastClaimed.logDate !== log.logDate) nextStreak = 1;
    }

    const nextTotalExp = profile.totalExp + log.rewardExp;
    const levelInfo = levelFromExp(nextTotalExp);

    const tx = this.db.transaction(() => {
      this.db.prepare("UPDATE task_logs SET status = 'CLAIMED', claimed_at = ? WHERE id = ?").run(nowIso(), logId);
      this.db.prepare(`
        UPDATE child_profile
        SET total_exp = ?, level = ?, title = ?, stars = stars + ?, streak_days = ?, updated_at = ?
        WHERE id = 1
      `).run(nextTotalExp, levelInfo.level, titleFromLevel(levelInfo.level), log.rewardEnergyValue, nextStreak, nowIso());
    });
    tx();
  }
}

let singleton: GameRepository | null = null;

export function getSqliteGameRepository(): GameRepository {
  singleton ??= new SqliteGameRepository();
  return singleton;
}
