import type { TaskTemplateInput } from "@/lib/types/game";

export const defaultTaskTemplates: TaskTemplateInput[] = [
  {
    title: "閱讀故事書",
    category: "閱讀",
    icon: "📚",
    measurementType: "時間",
    targetValue: 15,
    unit: "分鐘",
    repeatLabel: "每日",
    rewardExp: 12,
    rewardEnergyType: "智慧能量",
    rewardEnergyValue: 10,
    requiresApproval: false
  },
  {
    title: "鋼琴練習",
    category: "才藝",
    icon: "🎹",
    measurementType: "時間",
    targetValue: 20,
    unit: "分鐘",
    repeatLabel: "每週三次",
    rewardExp: 16,
    rewardEnergyType: "音樂能量",
    rewardEnergyValue: 12,
    requiresApproval: true
  },
  {
    title: "整理書包",
    category: "生活習慣",
    icon: "🎒",
    measurementType: "一次",
    targetValue: 1,
    unit: "次",
    repeatLabel: "每日",
    rewardExp: 8,
    rewardEnergyType: "愛心能量",
    rewardEnergyValue: 6,
    requiresApproval: false
  }
];
