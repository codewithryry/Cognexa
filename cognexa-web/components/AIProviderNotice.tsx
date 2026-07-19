"use client";

import Link from "next/link";
import SetupGuideLink from "@/components/SetupGuideLink";

type Variant = "dashboard" | "banner" | "upload" | "chat";

const COPY: Record<Variant, { title: string; body: string }> = {
  dashboard: {
    title: "No AI Provider Configured",
    body:
      "No AI provider is currently configured. Connect to Ollama or set up BYOK to start chatting and uploading documents.",
  },
  banner: {
    title: "AI Provider: Not Connected",
    body: "Configure Ollama or BYOK to enable AI-powered features.",
  },
  upload: {
    title: "AI setup required",
    body: "Configure an AI provider before uploading documents for indexing and analysis.",
  },
  chat: {
    title: "Chat is unavailable",
    body:
      "Chat is unavailable until an AI provider is configured. Connect to Ollama or use BYOK to continue.",
  },
};

const ICON = (
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
  />
);

/** A page-level "AI provider not configured" notice. `banner` is a slim
 * inline strip meant to sit above otherwise-usable content; the other
 * variants are full cards meant to replace the gated feature entirely. */
export default function AIProviderNotice({
  variant,
  className = "",
}: {
  variant: Variant;
  className?: string;
}) {
  const { title, body } = COPY[variant];

  if (variant === "banner") {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 ${className}`}
      >
        <div className="flex items-start gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
          >
            {ICON}
          </svg>
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong className="font-semibold">{title}.</strong> {body}
          </p>
        </div>
        <Link
          href="/settings/model-provider"
          className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Configure Now
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-amber-200 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-500/5 p-10 text-center ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="mx-auto h-10 w-10 text-amber-500"
      >
        {ICON}
      </svg>
      <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{body}</p>
      <Link
        href="/settings/model-provider"
        className="mt-5 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
      >
        Configure Now
      </Link>
      <div className="mt-3">
        <SetupGuideLink />
      </div>
    </div>
  );
}
