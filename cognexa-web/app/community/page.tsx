"use client";

import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import { REPO_URL } from "@/lib/constants";
import { COMMUNITY_CHANNELS } from "@/lib/communityData";

const INTEGRATIONS = [
  "OpenAI",
  "Anthropic",
  "Cohere",
  "Gemini",
  "Groq",
  "Mistral",
  "Ollama",
  "+ more",
];

const CHANNELS = [
  {
    title: "GitHub",
    description: "Browse the source, open issues, and track releases.",
    href: REPO_URL,
    emoji: "🐙",
    cta: "View repository",
    comingSoon: false,
  },
  {
    title: "Report a Bug",
    description: "File an issue directly, or describe it through a quick form.",
    href: "/community/report-bug",
    emoji: "🐛",
    cta: "Report a bug",
    comingSoon: false,
  },
  ...COMMUNITY_CHANNELS.map((c) => ({
    title: c.title,
    description: c.tagline,
    href: `/community/${c.slug}`,
    emoji: c.emoji,
    cta: "Learn more",
    comingSoon: true,
  })),
];

export default function Community() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
            Community
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
            Cognexa is open source and built in the open. Here&apos;s where to
            follow along, ask questions, and connect your own tools.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-transparent dark:hover:shadow-indigo-500/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl text-white shadow-md shadow-indigo-500/20 transition group-hover:scale-110">
                  {channel.emoji}
                </div>
                {channel.comingSoon && <ComingSoonBadge />}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {channel.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {channel.description}
              </p>
              <span className="mt-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {channel.cta} →
              </span>
            </a>
          ))}
        </div>

        <div className="mt-20">
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-xl">
            <div className="grid gap-8 p-10 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                  🔌 Bring your own model
                </span>
                <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                  Can integrate with any AI you already use
                </h2>
                <p className="mt-3 max-w-xl text-gray-600 dark:text-slate-400">
                  Stay on the free local model, or plug in Cline, OpenAI, Anthropic
                  Claude, Cohere, Google Gemini, Groq, OpenRouter, Mistral, Together
                  AI, DeepSeek, Ollama, or LM Studio — just paste an API key or
                  local endpoint in Settings and Cognexa routes questions there
                  instead.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end">
                {INTEGRATIONS.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-10 text-center shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:via-white/[0.02] dark:to-fuchsia-500/10 dark:shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Want to contribute?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            Star the repo, open an issue, or send a pull request — every bit
            of feedback helps shape Cognexa.
          </p>

          <div className="mt-7">
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Visit GitHub →
            </a>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </main>
  );
}
