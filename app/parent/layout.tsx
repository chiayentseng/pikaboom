import type { ReactNode } from "react";
import { NavShell, type NavItem } from "@/components/nav-shell";

const items: NavItem[] = [
  { href: "/parent", label: "後台首頁" },
  { href: "/parent/tasks", label: "任務管理" },
  { href: "/parent/review", label: "任務審核" },
  { href: "/parent/reports", label: "報表" }
];

export default function ParentLayout({ children }: { children: ReactNode }) {
  return (
    <NavShell
      title="家長後台"
      subtitle="家長在這裡設定規則、審核完成、觀察趨勢；孩子端則專注在冒險與收集。"
      badge="Parent Control"
      items={items}
    >
      {children}
    </NavShell>
  );
}
