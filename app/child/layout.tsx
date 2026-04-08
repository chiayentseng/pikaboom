import type { ReactNode } from "react";
import { NavShell, type NavItem } from "@/components/nav-shell";

const items: NavItem[] = [
  { href: "/child", label: "冒險首頁" },
  { href: "/child/tasks", label: "今日任務" },
  { href: "/child/characters", label: "角色" },
  { href: "/child/map", label: "地圖" },
  { href: "/child/collection", label: "圖鑑" },
  { href: "/child/achievements", label: "成就" }
];

export default function ChildLayout({ children }: { children: ReactNode }) {
  return (
    <NavShell
      title="孩子端冒險模式"
      subtitle="重點不是把任務塞滿，而是讓孩子一進來就想再往前推一點點。"
      badge="Child Experience"
      items={items}
    >
      {children}
    </NavShell>
  );
}
