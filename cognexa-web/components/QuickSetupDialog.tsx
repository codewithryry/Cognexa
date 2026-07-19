"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAIProviderStatus from "@/lib/useAIProviderStatus";
import { useAuth } from "@/lib/AuthContext";
import SetupGuideLink from "@/components/SetupGuideLink";

const STORAGE_KEY = "cognexa_quick_setup_dismissed";

/** One-time (per browser) onboarding prompt shown until the user has some
 * working AI provider — a saved BYOK integration or a reachable Ollama. */
export default function QuickSetupDialog() {
  const router = useRouter();
  const { user } = useAuth();
  const { loading, connected } = useAIProviderStatus();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(Boolean(localStorage.getItem(STORAGE_KEY)));
  }, []);

  if (!user || loading || connected || dismissed) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  function goTo(hint: "ollama" | "byok") {
    dismiss();
    router.push(`/settings/model-provider?setup=${hint}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl animate-fade-in">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Welcome to Cognexa!
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Before using AI features, you&apos;ll need to configure an AI provider. You can connect
          to a local Ollama instance or use your own API key (BYOK).
        </p>

        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Choose how you&apos;d like to use Cognexa
        </p>

        <div className="mt-2 space-y-2">
          <button
            onClick={() => goTo("ollama")}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5"
          >
            Connect to Ollama (Local AI)
            <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
              Runs on your machine, keeps your data offline.
            </span>
          </button>

          <button
            onClick={() => goTo("byok")}
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100 transition hover:border-indigo-300 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5"
          >
            Use BYOK (Cloud AI Provider)
            <span className="mt-0.5 block text-xs font-normal text-gray-500 dark:text-gray-400">
              Connect your own API key from OpenAI, Anthropic, and more.
            </span>
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <SetupGuideLink />
          <button
            onClick={dismiss}
            className="shrink-0 text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
