import type { CharacterProgress, EnergyType } from "@/lib/types/game";

export const energyPalette: Record<EnergyType, string> = {
  智慧能量: "📘",
  音樂能量: "🎵",
  活力能量: "⚡",
  愛心能量: "💖",
  星星碎片: "✨"
};

export const worldDefinitions = [
  {
    id: "meadow",
    name: "新手草原",
    theme: "從小草坡開始，看著花朵與小路慢慢長出來。",
    unlockTarget: 4
  },
  {
    id: "forest",
    name: "知識森林",
    theme: "閱讀、學習與探索的能量會點亮這片森林。",
    unlockTarget: 10
  },
  {
    id: "valley",
    name: "音樂山谷",
    theme: "才藝與節奏感會讓山谷出現新的舞台與光芒。",
    unlockTarget: 18
  }
] as const;

export const characterDefinitions: Array<
  Omit<CharacterProgress, "unlocked" | "growth" | "goal" | "stage" | "unlockHint"> & {
    streakRequired?: number;
  }
> = [
  {
    id: "sprout",
    name: "小芽芽",
    emoji: "🌱",
    rarity: "普通",
    unlockExp: 0,
    growthEnergy: "智慧能量"
  },
  {
    id: "bell-bird",
    name: "鈴鈴鳥",
    emoji: "🐦",
    rarity: "稀有",
    unlockExp: 40,
    growthEnergy: "音樂能量"
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
];

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
  if (level >= 8) return "成長探索者";
  if (level >= 5) return "冒險學徒";
  if (level >= 3) return "小小新芽";
  return "起步旅人";
}
