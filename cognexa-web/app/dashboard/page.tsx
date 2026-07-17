"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getBillingPlan, getChatHistory, getDocuments, getStats, PlanPayload } from "@/lib/api";
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentDocuments, setRecentDocuments] = useState<DocumentItem[]>([]);
  const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const { notify } = useDialog();

  useEffect(() => {
    Promise.all([getStats(), getDocuments(), getChatHistory()])
      .then(([statsRes, docsRes, chatRes]) => {
        setStats(statsRes);
        setRecentDocuments(docsRes.slice(0, 5));
        setRecentChats(chatRes.slice(-5).reverse());
      })
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load dashboard.", "error")
      )
      .finally(() => setLoading(false));

    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cards = [
    {
      title: "Documents",
      value: stats?.total_documents ?? 0,
      description: "Uploaded files",
      accent: "from-indigo-500 to-blue-500",
      emoji: "📄",
    },
    {
      title: "Knowledge Chunks",
      value: stats?.total_chunks ?? 0,
      description: "Indexed chunks",
      accent: "from-fuchsia-500 to-pink-500",
      emoji: "🧩",
    },
    {
      title: "AI Questions",
      value: stats?.questions_today ?? 0,
      description: "Asked today",
      accent: "from-emerald-500 to-teal-500",
      emoji: "💬",
    },
    {
      title: "Storage",
      value: formatBytes(stats?.storage_bytes ?? 0),
      description: "Documents stored",
      accent: "from-amber-500 to-orange-500",
      emoji: "🗄️",
    },
  ];

  return (
    <div className="space-y-8">

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <div
            key={item.title}
            className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800 transition hover:shadow-md"
          >
            <div
              className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${item.accent} opacity-10`}
            />
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.title}</p>
              <span className="text-xl">{item.emoji}</span>
            </div>

            <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-gray-100">
              {loading ? "…" : item.value}
            </h2>

            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{item.description}</p>
          </div>
        ))}
      </div>

      {plan && plan.plan === "community" && (
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Plan Usage
            </h2>
            <Link
              href="/settings"
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Manage plan
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Documents</span>
                <span>
                  {plan.document_count} / {plan.max_documents}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (plan.document_count / (plan.max_documents || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Storage</span>
                <span>
                  {(plan.storage_bytes / (1024 * 1024)).toFixed(1)} MB /{" "}
                  {((plan.max_storage_bytes || 0) / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (plan.storage_bytes / (plan.max_storage_bytes || 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent Documents
          </h2>

          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : recentDocuments.length === 0 ? (
              <p className="text-sm text-gray-400">No documents uploaded yet.</p>
            ) : (
              recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3 transition hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5"
                >
                  <span className="text-lg">📄</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {doc.filename}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Recent AI Conversations
          </h2>

          <div className="mt-4 space-y-2">
            {loading ? (
              <p className="text-sm text-gray-400">Loading...</p>
            ) : recentChats.length === 0 ? (
              <p className="text-sm text-gray-400">No conversations yet.</p>
            ) : (
              recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 transition hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5"
                >
                  <p className="line-clamp-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {chat.question}
                  </p>
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400 dark:text-gray-500">
                    {chat.answer}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-sm border border-gray-100 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Link
            href="/upload"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3 text-center text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
          >
            Upload Document
          </Link>

          <Link
            href="/chat"
            className="rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-4 py-3 text-center text-sm font-medium text-white shadow-md shadow-fuchsia-500/20 transition hover:shadow-lg"
          >
            Open AI Chat
          </Link>

          <Link
            href="/knowledge-base"
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-center text-sm font-medium text-white shadow-md shadow-emerald-500/20 transition hover:shadow-lg"
          >
            View Knowledge Base
          </Link>
        </div>
      </div>
    </div>
  );
}
