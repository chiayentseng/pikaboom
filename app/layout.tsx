import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PikaBoom",
  description: "把現實世界的努力，轉換成孩子看得見的冒險成長。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
