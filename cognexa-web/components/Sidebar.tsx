"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12l8.25-8.25L20.25 12M5.25 9.75V19.5a.75.75 0 00.75.75h3.75v-4.5h4.5v4.5h3.75a.75.75 0 00.75-.75V9.75"
      />
    ),
  },
  {
    name: "Upload",
    href: "/upload",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v1.5A2.25 2.25 0 005.25 20.25h13.5A2.25 2.25 0 0021 18v-1.5M7.5 8.25L12 3.75m0 0l4.5 4.5M12 3.75v12"
      />
    ),
  },
  {
    name: "Knowledge Base",
    href: "/knowledge-base",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.75c0-2.485-2.239-4.5-5-4.5S2 4.265 2 6.75v10.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5m0-10.5c0-2.485 2.239-4.5 5-4.5s5 2.015 5 4.5v10.5c0-2.485-2.239-4.5-5-4.5s-5 2.015-5 4.5m0-10.5v10.5"
      />
    ),
  },
  {
    name: "CX AI",
    href: "/chat",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.5-1.185C3.766 16.505 3 14.795 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    ),
  },
  {
    name: "Settings",
    href: "/settings",
    icon: (
      <>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen sticky top-0 shrink-0 bg-[#0b0b14] text-slate-300 border-r border-white/5 flex flex-col overflow-y-auto">
      <div className="p-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white shadow-lg shadow-indigo-500/30">
          C
        </div>
        <h1 className="text-lg font-semibold text-white leading-tight">
          Cognexa
        </h1>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                active
                  ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className={`h-5 w-5 shrink-0 ${
                  active ? "text-white" : "text-slate-500 group-hover:text-white"
                }`}
              >
                {item.icon}
              </svg>
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mx-3 mb-4 rounded-xl bg-white/5 border border-white/5">
        <p className="text-xs text-slate-400">
          Powered by local RAG + Ollama
        </p>
      </div>
    </aside>
  );
}
