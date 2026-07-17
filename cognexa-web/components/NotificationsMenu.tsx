"use client";

import { useEffect, useRef, useState } from "react";
import { getChatHistory, getDocuments } from "@/lib/api";

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
}

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function loadNotifications() {
    Promise.all([getDocuments(), getChatHistory()])
      .then(([docs, chats]) => {
        const docNotifs: Notification[] = docs.slice(0, 3).map((doc: any) => ({
          id: `doc-${doc.id}`,
          title: "Document indexed",
          description: doc.filename,
          time: doc.created_at,
        }));

        const chatNotifs: Notification[] = chats.slice(-2).map((chat: any) => ({
          id: `chat-${chat.id}`,
          title: "AI answered a question",
          description: chat.question,
          time: chat.created_at,
        }));

        const merged = [...docNotifs, ...chatNotifs].sort((a, b) =>
          (b.time ?? "").localeCompare(a.time ?? "")
        );

        setNotifications(merged.slice(0, 5));
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }

  function handleToggle() {
    if (!open && !loaded) loadNotifications();
    setOpen((prev) => !prev);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-500 dark:text-gray-400 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-fuchsia-500 ring-2 ring-white dark:ring-gray-900" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 animate-fade-in rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-xl">
          <div className="px-3 py-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">
                You&apos;re all caught up.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                    {n.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
