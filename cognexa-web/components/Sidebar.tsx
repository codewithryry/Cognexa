"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChatSessionPayload,
  deleteChatSession,
  getChatSessions,
  SESSIONS_CHANGED_EVENT,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

const menuGroups = [
  {
    label: "Main",
    items: [
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
        name: "Dataset",
        href: "/knowledge-base",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
          />
        ),
      },
    ],
  },
  {
    label: "AI",
    items: [
      {
        name: "Chat",
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
        name: "Report",
        href: "/report",
        icon: (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        ),
      },
    ],
  },
  {
    label: "System",
    items: [
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
    ],
  },
];

const STORAGE_KEY = "cognexa_sidebar_collapsed";
const CHAT_EXPANDED_KEY = "cognexa_sidebar_chat_expanded";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [chatExpanded, setChatExpanded] = useState(true);
  const [sessions, setSessions] = useState<ChatSessionPayload[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { confirm, notify } = useDialog();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") setCollapsed(true);
    if (localStorage.getItem(CHAT_EXPANDED_KEY) === "0") setChatExpanded(false);
  }, []);

  function toggleChatExpanded(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setChatExpanded((prev) => {
      const next = !prev;
      localStorage.setItem(CHAT_EXPANDED_KEY, next ? "1" : "0");
      return next;
    });
  }

  useEffect(() => {
    function refresh() {
      getChatSessions()
        .then((list) => setSessions(list.slice(0, 5)))
        .catch(() => {});
    }

    refresh();
    window.addEventListener(SESSIONS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(SESSIONS_CHANGED_EVENT, refresh);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  function handleNewChat() {
    // Don't eagerly create a session here -- the chat page creates one
    // lazily on the first message, which avoids leaving an empty "New Chat"
    // row (and a duplicate-looking sidebar entry) behind when the user
    // navigates away without sending anything. `new=1` tells the chat page
    // to reset to a blank composer instead of resuming the last session.
    router.push("/chat?new=1");
  }

  async function handleDeleteSession(e: React.MouseEvent, session: ChatSessionPayload) {
    e.preventDefault();
    e.stopPropagation();

    const confirmed = await confirm({
      title: "Delete chat",
      message: `Delete "${session.title}"? This cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingId(session.id);
    try {
      await deleteChatSession(session.id);
      setSessions((prev) => prev.filter((s) => s.id !== session.id));

      if (pathname === "/chat") {
        const params = new URLSearchParams(window.location.search);
        if (Number(params.get("session")) === session.id) {
          router.push("/chat");
        }
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete chat.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <aside
      className={`h-screen sticky top-0 shrink-0 bg-white dark:bg-[#0b0b14] text-gray-600 dark:text-slate-300 border-r border-gray-200 dark:border-white/5 flex flex-col overflow-y-auto transition-all duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div className={`p-6 flex items-center gap-3 ${collapsed ? "justify-center px-3" : "justify-between"}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={collapsed ? toggleCollapsed : undefined}
            title={collapsed ? "Expand sidebar" : undefined}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white shadow-lg shadow-indigo-500/30 ${
              collapsed ? "cursor-pointer" : "cursor-default"
            }`}
          >
            C
          </button>
          {!collapsed && (
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              Cognexa
            </h1>
          )}
        </div>

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Collapse sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="h-5 w-5 shrink-0"
            >
              <rect x="3.75" y="4.5" width="16.5" height="15" rx="2.25" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 4.5v15" />
            </svg>
          </button>
        )}
      </div>

      <nav className={`flex-1 ${collapsed ? "px-2" : "px-3"}`}>
        {menuGroups.map((group, groupIndex) => (
          <div
            key={group.label}
            className={groupIndex > 0 ? "mt-3 border-t border-gray-100 pt-3 dark:border-white/5" : ""}
          >
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {group.label}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
          const active = pathname === item.href;
          const isChat = item.href === "/chat";

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all ${
                  collapsed ? "justify-center px-0" : "px-3"
                } ${
                  active
                    ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                  className={`h-5 w-5 shrink-0 ${
                    active
                      ? "text-white"
                      : "text-gray-400 group-hover:text-gray-900 dark:text-slate-500 dark:group-hover:text-white"
                  }`}
                >
                  {item.icon}
                </svg>
                {!collapsed && <span className="flex-1">{item.name}</span>}
                {isChat && !collapsed && (
                  <button
                    onClick={toggleChatExpanded}
                    title={chatExpanded ? "Collapse recent chats" : "Expand recent chats"}
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded transition ${
                      active ? "text-white/80 hover:text-white" : "text-gray-400 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`h-3.5 w-3.5 shrink-0 transition-transform ${chatExpanded ? "rotate-180" : ""}`}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                )}
              </Link>

              {isChat && chatExpanded && !collapsed && (
                <div className="mt-1 space-y-0.5 border-l border-gray-200 dark:border-white/5 pl-3 ml-4">
                  <button
                    onClick={handleNewChat}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-3.5 w-3.5 shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                    </svg>
                    New Chat
                  </button>

                  {sessions.length > 0 && (
                    <ul className="space-y-0.5">
                      {sessions.map((session) => (
                        <li key={session.id} className="group/session relative">
                          <Link
                            href={`/chat?session=${session.id}`}
                            title={session.title}
                            className="flex items-center gap-1 truncate rounded-lg py-1.5 pl-2 pr-7 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                          >
                            <span className="truncate">{session.title}</span>
                          </Link>
                          <button
                            onClick={(e) => handleDeleteSession(e, session)}
                            disabled={deletingId === session.id}
                            title="Delete chat"
                            className="absolute right-1 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover/session:opacity-100 dark:hover:bg-red-500/10 dark:hover:text-red-400 disabled:opacity-50"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-3 w-3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.166L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
