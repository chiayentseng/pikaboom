export type EnergyType = "智慧能量" | "音樂能量" | "活力能量" | "愛心能量" | "星星碎片";
export type TaskStatus = "未開始" | "進行中" | "待確認" | "已完成" | "已領獎";

export type ChildTask = {
  id: string;
  title: string;
  icon: string;
  category: string;
  target: string;
  progressLabel: string;
  status: TaskStatus;
  exp: number;
  energyType: EnergyType;
  energyValue: number;
  needsApproval: boolean;
  tease: string;
};

export type CharacterCard = {
  id: string;
  name: string;
  emoji: string;
  rarity: string;
  stage: string;
  growth: number;
  goal: number;
  favoriteEnergy: EnergyType;
  unlockHint?: string;
};

export type WorldAreaCard = {
  id: string;
  name: string;
  theme: string;
  progress: number;
  unlockHint: string;
  state: "已開啟" | "建造中" | "尚未解鎖";
};

export const childProfile = {
  name: "晴晴",
  title: "Lv 4 冒險學徒",
  exp: 64,
  expGoal: 90,
  streak: 5,
  stars: 132,
  nextGoal: "再完成 2 個任務，就能打開知識森林的小橋。",
  worldProgress: 68
};

export const todayTasks: ChildTask[] = [
  {
    id: "task-math",
    title: "數學練習",
    icon: "📘",
    category: "學習",
    target: "15 分鐘",
    progressLabel: "已完成 10 / 15 分鐘",
    status: "進行中",
    exp: 12,
    energyType: "智慧能量",
    energyValue: 10,
    needsApproval: false,
    tease: "再 5 分鐘就能讓小松果進化到成長期。"
  },
  {
    id: "task-piano",
    title: "鋼琴練習",
    icon: "🎹",
    category: "才藝",
    target: "20 分鐘",
    progressLabel: "尚未開始",
    status: "未開始",
    exp: 16,
    energyType: "音樂能量",
    energyValue: 12,
    needsApproval: true,
    tease: "完成後音樂山谷的風鈴樹會亮起來。"
  },
  {
    id: "task-reading",
    title: "晚安閱讀",
    icon: "📚",
    category: "閱讀",
    target: "1 次",
    progressLabel: "等待領獎",
    status: "已完成",
    exp: 8,
    energyType: "智慧能量",
    energyValue: 6,
    needsApproval: false,
    tease: "領獎後就會多一張角色圖鑑剪影。"
  },
  {
    id: "task-brush",
    title: "刷牙收尾",
    icon: "🪥",
    category: "生活習慣",
    target: "2 次",
    progressLabel: "待家長確認 1 / 2 次",
    status: "待確認",
    exp: 6,
    energyType: "愛心能量",
    energyValue: 8,
    needsApproval: true,
    tease: "再通過一次審核就能拿到愛心露珠。"
  }
];

export const characters: CharacterCard[] = [
  {
    id: "char-sprout",
    name: "小松果",
    emoji: "🌰",
    rarity: "常見",
    stage: "成長期",
    growth: 42,
    goal: 60,
    favoriteEnergy: "智慧能量"
  },
  {
    id: "char-bird",
    name: "鈴鈴鳥",
    emoji: "🐦",
    rarity: "稀有",
    stage: "幼年",
    growth: 18,
    goal: 40,
    favoriteEnergy: "音樂能量"
  },
  {
    id: "char-cloud",
    name: "泡泡雲",
    emoji: "☁️",
    rarity: "傳說",
    stage: "未解鎖",
    growth: 0,
    goal: 100,
    favoriteEnergy: "星星碎片",
    unlockHint: "連續 7 天完成任務可見到剪影真身。"
  }
];

export const worldAreas: WorldAreaCard[] = [
  {
    id: "area-meadow",
    name: "新手草原",
    theme: "每天完成任務就會長花",
    progress: 88,
    unlockHint: "已經快完成第一區的花徑。",
    state: "建造中"
  },
  {
    id: "area-forest",
    name: "知識森林",
    theme: "閱讀與學習會點亮蘑菇路燈",
    progress: 64,
    unlockHint: "還差 2 次閱讀任務就能全開。",
    state: "已開啟"
  },
  {
    id: "area-valley",
    name: "音樂山谷",
    theme: "鋼琴與舞蹈會喚醒風鈴花",
    progress: 0,
    unlockHint: "鋼琴累積 60 分鐘後開放。",
    state: "尚未解鎖"
  }
];

export const parentOverview = {
  weeklyCompletionRate: 82,
  pendingApprovals: 3,
  totalFocusMinutes: 215,
  strongestCategory: "閱讀"
};

export const parentTasks = [
  {
    id: "tpl-1",
    title: "數學練習",
    category: "學習",
    schedule: "每日",
    reward: "12 EXP + 10 智慧能量",
    approval: "否",
    status: "啟用中"
  },
  {
    id: "tpl-2",
    title: "鋼琴練習",
    category: "才藝",
    schedule: "每週一三五",
    reward: "16 EXP + 12 音樂能量",
    approval: "是",
    status: "啟用中"
  },
  {
    id: "tpl-3",
    title: "整理書包",
    category: "生活習慣",
    schedule: "每日",
    reward: "6 EXP + 8 愛心能量",
    approval: "是",
    status: "啟用中"
  }
];

export const pendingApprovals = [
  {
    id: "review-1",
    taskTitle: "鋼琴練習",
    childName: "晴晴",
    submittedAt: "今天 19:10",
    proof: "計時已達 20 分鐘"
  },
  {
    id: "review-2",
    taskTitle: "刷牙收尾",
    childName: "晴晴",
    submittedAt: "今天 20:40",
    proof: "孩子自行勾選，待家長口頭確認"
  }
];

export const reportCards = [
  {
    label: "近 7 日完成率",
    value: "82%",
    note: "比上週多 9%"
  },
  {
    label: "本週專注分鐘",
    value: "215",
    note: "閱讀與鋼琴佔比最高"
  },
  {
    label: "連續紀錄",
    value: "5 天",
    note: "再 2 天解鎖泡泡雲"
  }
];
