"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { name: "Account", href: "/settings" },
  { name: "Model Provider", href: "/settings/model-provider" },
  { name: "Chat Channels", href: "/settings/chat-channels" },
  { name: "Billing", href: "/settings/billing" },
  { name: "Automation", href: "/settings/automation" },
  { name: "Data Sources", href: "/settings/data-sources" },
  { name: "Data Management", href: "/settings/data-management" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:gap-1 lg:overflow-visible">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 space-y-8">{children}</div>
    </div>
  );
}
