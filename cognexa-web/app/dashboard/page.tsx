"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getChatSessionMessages,
  getChatSessions,
  getDocuments,
  getStats,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useDialog } from "@/lib/DialogContext";

interface Stats {
  total_documents: number;
  total_chunks: number;
  questions_today: number;
  storage_bytes: number;
}

interface DocumentItem {
  id: number;
  filename: string;
  created_at: string;
}

interface ChatItem {
  id: number;
  question: string;
  answer: string;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
}

const DOCUMENT_ICON = (
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
);

const CHAT_ICON = (
  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.5-1.185C3.766 16.505 3 14.795 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
);

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<DocumentItem[]>([]);
  const [lastChat, setLastChat] = useState<ChatItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [askInput, setAskInput] = useState("");
  const { notify } = useDialog();
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    Promise.all([getStats(), getDocuments(), getChatSessions()])
      .then(([statsRes, docsRes, sessions]) => {
        setStats(statsRes);
        setRecentDocuments(docsRes.slice(0, 3));

        const latestSession = sessions[0];
        if (!latestSession) return null;
        return getChatSessionMessages(latestSession.id).then((messages: ChatItem[]) => {
          setLastChat(messages[messages.length - 1] ?? null);
        });
      })
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load dashboard.", "error")
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  const cards = [
    {
      title: "Documents",
      value: stats?.total_documents ?? 0,
      description: "Uploaded files",
      tint: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
      icon: DOCUMENT_ICON,
    },
    {
      title: "Knowledge Chunks",
      value: stats?.total_chunks ?? 0,
      description: "Indexed chunks",
      tint: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      ),
    },
    {
      title: "AI Questions",
      value: stats?.questions_today ?? 0,
      description: "Asked today",
      tint: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
      icon: CHAT_ICON,
    },
    {
      title: "Storage",
      value: formatBytes(stats?.storage_bytes ?? 0),
      description: "Documents stored",
      tint: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
      ),
    },
  ];

  function submitAsk() {
    const q = askInput.trim();
    if (!q) {
      router.push("/chat");
      return;
    }
    router.push(`/chat?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold sm:text-3xl">
            <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
              Welcome, {firstName}!
            </span>{" "}
            👋
          </h1>
          <p className="mt-1 text-lg text-gray-500 dark:text-gray-400">
            How can I help you today?
          </p>
        </div>

        <div className="w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 shadow-lg lg:max-w-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/upload")}
              title="Upload a document"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            <input
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitAsk();
              }}
              placeholder="Ask Cognexa about your documents..."
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400"
            />

            <button
              onClick={submitAsk}
              title="Ask AI"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 text-indigo-500">
              {DOCUMENT_ICON}
            </svg>
            Recently uploaded
          </p>

          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : recentDocuments.length === 0 ? (
            <p className="text-sm text-gray-400">No documents uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentDocuments.map((doc) => (
                <li key={doc.id}>
                  <Link
                    href="/knowledge-base"
                    className="block truncate rounded-lg px-2 py-1 text-sm text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400"
                  >
                    {doc.filename}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 text-fuchsia-500">
              {CHAT_ICON}
            </svg>
            Continue chatting
          </p>

          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : lastChat ? (
            <Link
              href="/chat"
              className="block rounded-lg px-2 py-1 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <p className="line-clamp-1 text-sm text-gray-600 dark:text-gray-300">
                {lastChat.question}
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-gray-400 dark:text-gray-500">
                {lastChat.answer}
              </p>
            </Link>
          ) : (
            <p className="text-sm text-gray-400">No conversations yet — ask your first question below.</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${item.tint}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4.5 w-4.5">
                  {item.icon}
                </svg>
              </span>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {loading ? "…" : item.value}
            </h2>

            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
