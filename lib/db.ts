import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { characterDefinitions, levelFromExp, titleFromLevel, worldDefinitions } from "@/lib/game-data";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "pikaboom.db");

type DbInstance = Database.Database;

declare global {
  // eslint-disable-next-line no-var
  var __pikaboomDb: DbInstance | undefined;
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

function init(db: DbInstance) {
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
    const tasks = [
      {
        title: "數學練習",
        category: "學習",
        icon: "📘",
        measurement_type: "時間",
        target_value: 15,
        unit: "分鐘",
        repeat_label: "每日",
        reward_exp: 12,
        reward_energy_type: "智慧能量",
        reward_energy_value: 10,
        requires_approval: 0,
        created_at: createdAt
      },
      {
        title: "鋼琴練習",
        category: "才藝",
        icon: "🎹",
        measurement_type: "時間",
        target_value: 20,
        unit: "分鐘",
        repeat_label: "每週一三五",
        reward_exp: 16,
        reward_energy_type: "音樂能量",
        reward_energy_value: 12,
        requires_approval: 1,
        created_at: createdAt
      },
      {
        title: "晚安閱讀",
        category: "閱讀",
        icon: "📚",
        measurement_type: "一次",
        target_value: 1,
        unit: "次",
        repeat_label: "每日",
        reward_exp: 8,
        reward_energy_type: "智慧能量",
        reward_energy_value: 6,
        requires_approval: 0,
        created_at: createdAt
      },
      {
        title: "刷牙收尾",
        category: "生活習慣",
        icon: "🪥",
        measurement_type: "次數",
        target_value: 2,
        unit: "次",
        repeat_label: "每日",
        reward_exp: 6,
        reward_energy_type: "愛心能量",
        reward_energy_value: 8,
        requires_approval: 1,
        created_at: createdAt
      }
    ];

    const transaction = db.transaction(() => tasks.forEach((task) => insertTask.run(task)));
    transaction();
  }

  ensureTodayLogs(db);
}

export function getDb() {
  if (!global.__pikaboomDb) {
    global.__pikaboomDb = openDb();
    init(global.__pikaboomDb);
  }
  return global.__pikaboomDb;
}

function ensureTodayLogs(db: DbInstance, date = todayKey()) {
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

  const transaction = db.transaction(() => {
    for (const task of tasks) {
      insertLog.run({
        task_template_id: task.id,
        log_date: date,
        reward_exp_snapshot: task.reward_exp,
        reward_energy_value_snapshot: task.reward_energy_value
      });
    }
  });
  transaction();
}

export type TodayTask = {
  logId: number;
  taskId: number;
  title: string;
  category: string;
  icon: string;
  measurementType: string;
  targetValue: number;
  unit: string;
  repeatLabel: string;
  rewardExp: number;
  rewardEnergyType: string;
  rewardEnergyValue: number;
  requiresApproval: boolean;
  status: string;
  progressValue: number;
  rejectionReason: string | null;
};

export function getTodayTasks() {
  const db = getDb();
  ensureTodayLogs(db);

  return db
    .prepare(`
      SELECT
        l.id AS logId,
        t.id AS taskId,
        t.title,
        t.category,
        t.icon,
        t.measurement_type AS measurementType,
        t.target_value AS targetValue,
        t.unit,
        t.repeat_label AS repeatLabel,
        l.reward_exp_snapshot AS rewardExp,
        t.reward_energy_type AS rewardEnergyType,
        l.reward_energy_value_snapshot AS rewardEnergyValue,
        t.requires_approval AS requiresApproval,
        l.status,
        l.progress_value AS progressValue,
        l.rejection_reason AS rejectionReason
      FROM task_logs l
      JOIN task_templates t ON t.id = l.task_template_id
      WHERE l.log_date = ?
      ORDER BY
        CASE l.status
          WHEN 'READY_TO_CLAIM' THEN 0
          WHEN 'NOT_STARTED' THEN 1
          WHEN 'REJECTED' THEN 2
          WHEN 'SUBMITTED' THEN 3
          WHEN 'CLAIMED' THEN 4
          ELSE 5
        END,
        t.id
    `)
    .all(todayKey()) as TodayTask[];
}

export function getProfile() {
  const db = getDb();
  const profile = db.prepare("SELECT * FROM child_profile WHERE id = 1").get() as {
    name: string;
    total_exp: number;
    level: number;
    title: string;
    stars: number;
    streak_days: number;
  };
  const levelInfo = levelFromExp(profile.total_exp);
  return {
    name: profile.name,
    totalExp: profile.total_exp,
    level: profile.level,
    title: profile.title,
    stars: profile.stars,
    streakDays: profile.streak_days,
    currentLevelExp: levelInfo.currentLevelExp,
    nextLevelExp: levelInfo.nextLevelExp
  };
}

export function getStats() {
  const db = getDb();
  ensureTodayLogs(db);

  const totalClaimed = (db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE status = 'CLAIMED'").get() as { count: number }).count;
  const pendingApprovals = (db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE status = 'SUBMITTED'").get() as { count: number }).count;
  const todayClaimed = (db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE log_date = ? AND status = 'CLAIMED'").get(todayKey()) as { count: number }).count;
  const totalTasks = (db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE log_date = ?").get(todayKey()) as { count: number }).count;
  const weeklyCompletion = (db.prepare(`
    SELECT COUNT(*) AS count
    FROM task_logs
    WHERE status = 'CLAIMED'
      AND log_date >= date('now', '-6 day')
  `).get() as { count: number }).count;
  const weeklyTotal = (db.prepare(`
    SELECT COUNT(*) AS count
    FROM task_logs
    WHERE log_date >= date('now', '-6 day')
  `).get() as { count: number }).count;
  const completionRate = weeklyTotal === 0 ? 0 : Math.round((weeklyCompletion / weeklyTotal) * 100);

  const categoryRows = db.prepare(`
    SELECT t.category AS category, COUNT(*) AS count
    FROM task_logs l
    JOIN task_templates t ON t.id = l.task_template_id
    WHERE l.status = 'CLAIMED'
    GROUP BY t.category
    ORDER BY count DESC
  `).all() as Array<{ category: string; count: number }>;

  const topCategory = categoryRows[0]?.category ?? "尚未開始";

  return {
    totalClaimed,
    pendingApprovals,
    todayClaimed,
    totalTasks,
    weeklyCompletion,
    completionRate,
    topCategory
  };
}

export function getWorldProgress() {
  const stats = getStats();
  return worldDefinitions.map((world, index) => {
    const previousTarget = index === 0 ? 0 : worldDefinitions[index - 1]!.unlockTarget;
    const segmentTotal = world.unlockTarget - previousTarget;
    const progressInSegment = Math.max(0, Math.min(segmentTotal, stats.totalClaimed - previousTarget));
    const progress = Math.round((progressInSegment / segmentTotal) * 100);
    const state =
      stats.totalClaimed >= world.unlockTarget
        ? "已開啟"
        : index === 0 || stats.totalClaimed >= previousTarget
          ? "建造中"
          : "尚未解鎖";

    return {
      ...world,
      progress,
      state,
      unlockHint:
        state === "已開啟"
          ? "已經可以在這一區繼續推進。"
          : `還差 ${Math.max(0, world.unlockTarget - stats.totalClaimed)} 次領獎就能解鎖。`
    };
  });
}

export function getCharacterProgress() {
  const profile = getProfile();
  return characterDefinitions.map((character) => {
    const unlocked =
      profile.totalExp >= character.unlockExp &&
      (character.streakRequired ? profile.streakDays >= character.streakRequired : true);
    const growth = unlocked ? Math.min(100, Math.max(12, profile.totalExp - character.unlockExp)) : 0;

    return {
      ...character,
      unlocked,
      growth,
      goal: 100,
      stage: unlocked ? (growth >= 80 ? "成長期" : "幼年") : "未解鎖",
      unlockHint: unlocked
        ? undefined
        : character.streakRequired
          ? `需要 ${character.unlockExp} EXP 並連續 ${character.streakRequired} 天完成任務`
          : `需要累積 ${character.unlockExp} EXP`
    };
  });
}

export function getPendingReviews() {
  const db = getDb();
  return db.prepare(`
    SELECT
      l.id,
      t.title AS taskTitle,
      t.category,
      t.icon,
      l.submitted_at AS submittedAt,
      l.progress_value AS progressValue,
      t.target_value AS targetValue,
      t.unit
    FROM task_logs l
    JOIN task_templates t ON t.id = l.task_template_id
    WHERE l.status = 'SUBMITTED'
    ORDER BY l.submitted_at ASC
  `).all() as Array<{
    id: number;
    taskTitle: string;
    category: string;
    icon: string;
    submittedAt: string;
    progressValue: number;
    targetValue: number;
    unit: string;
  }>;
}

export function getTaskTemplates() {
  const db = getDb();
  return db.prepare(`
    SELECT
      id,
      title,
      category,
      icon,
      measurement_type AS measurementType,
      target_value AS targetValue,
      unit,
      repeat_label AS repeatLabel,
      reward_exp AS rewardExp,
      reward_energy_type AS rewardEnergyType,
      reward_energy_value AS rewardEnergyValue,
      requires_approval AS requiresApproval,
      is_active AS isActive
    FROM task_templates
    ORDER BY is_active DESC, id DESC
  `).all() as Array<{
    id: number;
    title: string;
    category: string;
    icon: string;
    measurementType: string;
    targetValue: number;
    unit: string;
    repeatLabel: string;
    rewardExp: number;
    rewardEnergyType: string;
    rewardEnergyValue: number;
    requiresApproval: number;
    isActive: number;
  }>;
}

export function createTask(input: {
  title: string;
  category: string;
  icon: string;
  measurementType: string;
  targetValue: number;
  unit: string;
  repeatLabel: string;
  rewardExp: number;
  rewardEnergyType: string;
  rewardEnergyValue: number;
  requiresApproval: boolean;
}) {
  const db = getDb();
  db.prepare(`
    INSERT INTO task_templates
    (title, category, icon, measurement_type, target_value, unit, repeat_label, reward_exp, reward_energy_type, reward_energy_value, requires_approval, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    input.title,
    input.category,
    input.icon,
    input.measurementType,
    input.targetValue,
    input.unit,
    input.repeatLabel,
    input.rewardExp,
    input.rewardEnergyType,
    input.rewardEnergyValue,
    input.requiresApproval ? 1 : 0,
    nowIso()
  );
  ensureTodayLogs(db);
}

export function toggleTask(taskId: number) {
  const db = getDb();
  db.prepare("UPDATE task_templates SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?").run(taskId);
  ensureTodayLogs(db);
}

export function submitTask(logId: number) {
  const db = getDb();
  const log = db.prepare(`
    SELECT l.id, l.status, t.target_value AS targetValue, t.requires_approval AS requiresApproval
    FROM task_logs l
    JOIN task_templates t ON t.id = l.task_template_id
    WHERE l.id = ?
  `).get(logId) as {
    id: number;
    status: string;
    targetValue: number;
    requiresApproval: number;
  } | undefined;

  if (!log) return;
  if (!["NOT_STARTED", "REJECTED"].includes(log.status)) return;

  db.prepare(`
    UPDATE task_logs
    SET status = ?, progress_value = ?, submitted_at = ?, rejection_reason = NULL
    WHERE id = ?
  `).run(log.requiresApproval ? "SUBMITTED" : "READY_TO_CLAIM", log.targetValue, nowIso(), logId);
}

export function approveTask(logId: number) {
  const db = getDb();
  db.prepare("UPDATE task_logs SET status = 'READY_TO_CLAIM', approved_at = ? WHERE id = ? AND status = 'SUBMITTED'").run(nowIso(), logId);
}

export function rejectTask(logId: number, reason: string) {
  const db = getDb();
  db.prepare("UPDATE task_logs SET status = 'REJECTED', rejection_reason = ? WHERE id = ? AND status = 'SUBMITTED'").run(reason || "請再確認一次", logId);
}

export function claimTask(logId: number) {
  const db = getDb();
  const log = db.prepare(`
    SELECT id, log_date AS logDate, reward_exp_snapshot AS rewardExp, reward_energy_value_snapshot AS rewardEnergyValue
    FROM task_logs
    WHERE id = ? AND status = 'READY_TO_CLAIM'
  `).get(logId) as { id: number; logDate: string; rewardExp: number; rewardEnergyValue: number } | undefined;

  if (!log) return;

  const profile = getProfile();
  const hadClaimedSameDay = (db.prepare("SELECT COUNT(*) AS count FROM task_logs WHERE log_date = ? AND status = 'CLAIMED'").get(log.logDate) as { count: number }).count > 0;
  const lastClaimed = db.prepare("SELECT log_date AS logDate FROM task_logs WHERE status = 'CLAIMED' ORDER BY log_date DESC LIMIT 1").get() as { logDate: string } | undefined;

  let nextStreak = profile.streakDays;
  if (!hadClaimedSameDay) {
    if (!lastClaimed) {
      nextStreak = 1;
    } else if (lastClaimed.logDate === yesterdayKey(log.logDate)) {
      nextStreak = profile.streakDays + 1;
    } else if (lastClaimed.logDate !== log.logDate) {
      nextStreak = 1;
    }
  }

  const nextTotalExp = profile.totalExp + log.rewardExp;
  const levelInfo = levelFromExp(nextTotalExp);

  const transaction = db.transaction(() => {
    db.prepare("UPDATE task_logs SET status = 'CLAIMED', claimed_at = ? WHERE id = ?").run(nowIso(), logId);
    db.prepare(`
      UPDATE child_profile
      SET total_exp = ?, level = ?, title = ?, stars = stars + ?, streak_days = ?, updated_at = ?
      WHERE id = 1
    `).run(nextTotalExp, levelInfo.level, titleFromLevel(levelInfo.level), log.rewardEnergyValue, nextStreak, nowIso());
  });

  transaction();
}
