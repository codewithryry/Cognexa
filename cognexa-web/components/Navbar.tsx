"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import HelpMenu from "@/components/HelpMenu";
import NotificationsMenu from "@/components/NotificationsMenu";
import ProfileMenu from "@/components/ProfileMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function submitSearch() {
    const q = query.trim();
    router.push(q ? `/knowledge-base?search=${encodeURIComponent(q)}` : "/knowledge-base");
  }

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-8 sticky top-0 z-10">
      <div className="relative w-full max-w-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitSearch();
          }}
          placeholder="Search documents..."
          className="w-full rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-2 pl-9 pr-4 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:focus:bg-gray-800 dark:focus:ring-indigo-500/20"
        />
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <HelpMenu />
        <NotificationsMenu />
        <ProfileMenu />
      </div>
    </header>
  );
}
