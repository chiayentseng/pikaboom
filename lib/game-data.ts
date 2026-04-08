export const energyPalette = {
  "智慧能量": "📘",
  "音樂能量": "🎵",
  "活力能量": "⚽",
  "愛心能量": "💗",
  "星星碎片": "✨"
} as const;

export type EnergyType = keyof typeof energyPalette;

export const worldDefinitions = [
  {
    id: "meadow",
    name: "新手草原",
    theme: "每天完成任務就會長花",
    unlockTarget: 4
  },
  {
    id: "forest",
    name: "知識森林",
    theme: "閱讀與學習會點亮蘑菇路燈",
    unlockTarget: 10
  },
  {
    id: "valley",
    name: "音樂山谷",
    theme: "鋼琴與舞蹈會喚醒風鈴花",
    unlockTarget: 18
  }
] as const;

export const characterDefinitions = [
  {
    id: "sprout",
    name: "小松果",
    emoji: "🌰",
    rarity: "常見",
    unlockExp: 0,
    growthEnergy: "智慧能量",
    streakRequired: undefined
  },
  {
    id: "bell-bird",
    name: "鈴鈴鳥",
    emoji: "🐦",
    rarity: "稀有",
    unlockExp: 40,
    growthEnergy: "音樂能量",
    streakRequired: undefined
  },
  {
    id: "bubble-cloud",
    name: "泡泡雲",
    emoji: "☁️",
    rarity: "傳說",
    unlockExp: 100,
    streakRequired: 7,
    growthEnergy: "星星碎片"
  }
] as const;

export function levelFromExp(exp: number) {
  let level = 1;
  let requirement = 20;
  let remaining = exp;

  while (remaining >= requirement) {
    remaining -= requirement;
    level += 1;
    requirement = Math.round(requirement * 1.35);
  }

  return {
    level,
    currentLevelExp: remaining,
    nextLevelExp: requirement
  };
}

export function titleFromLevel(level: number) {
  if (level >= 12) return "星光訓練師";
  if (level >= 8) return "森林守護者";
  if (level >= 5) return "成長探索者";
  if (level >= 3) return "冒險學徒";
  return "小小新芽";
}
