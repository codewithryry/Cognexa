"use client";

import { usePathname } from "next/navigation";
import NotificationsMenu from "@/components/NotificationsMenu";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/upload": "Upload Documents",
  "/knowledge-base": "Knowledge Base",
  "/chat": "CX AI",
  "/settings": "Settings",
};

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-950/70 backdrop-blur-md px-8 sticky top-0 z-10">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {titles[pathname] ?? "Welcome to Cognexa"}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
