"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createIntegration,
  deleteIntegration,
  getBillingPlan,
  getIntegrations,
  getSettings,
  IntegrationPayload,
  PlanPayload,
  SettingsPayload,
  updateSettings,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import DemoCheckoutModal from "@/components/DemoCheckoutModal";
import SetupGuideLink from "@/components/SetupGuideLink";

const DEFAULT_SETTINGS: SettingsPayload = {
  ollama_url: "http://localhost:11434",
  llm_model: "llama3.2",
  embedding_model: "all-MiniLM-L6-v2",
  chunk_size: 500,
  chunk_overlap: 50,
  theme: "dark",
  email_notifications: true,
  auto_reindex_stuck: false,
  duplicate_detection: true,
};

interface ProviderOption {
  value: string;
  local: boolean;
  defaultBaseUrl?: string;
  modelPlaceholder: string;
  models: string[];
  apiKeyUrl?: string;
}

const CUSTOM_MODEL = "__custom__";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  community: "Free",
  pro: "Pro",
  team: "Unlimited",
};

const PLAN_INTEGRATION_LIMITS: Record<string, number | null> = {
  community: 1,
  pro: 3,
  team: null,
};

const PROVIDERS: ProviderOption[] = [
  {
    value: "Cline",
    local: false,
    modelPlaceholder: "anthropic/claude-sonnet-4-6",
    models: ["anthropic/claude-sonnet-4-6", "openai/gpt-5.5", "google/gemini-3.5-flash"],
    apiKeyUrl: "https://cline.bot/",
  },
  {
    value: "OpenAI",
    local: false,
    modelPlaceholder: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3", "o3-mini"],
    apiKeyUrl: "https://platform.openai.com/api-keys",
  },
  {
    value: "Anthropic Claude",
    local: false,
    modelPlaceholder: "claude-sonnet-5",
    models: ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001", "claude-fable-5"],
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    value: "Cohere",
    local: false,
    modelPlaceholder: "command-a-plus-05-2026",
    models: ["command-a-plus-05-2026", "command-r-plus", "command-r"],
    apiKeyUrl: "https://dashboard.cohere.com/api-keys",
  },
  {
    value: "Google Gemini",
    local: false,
    modelPlaceholder: "gemini-2.5-flash",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
    apiKeyUrl: "https://aistudio.google.com/apikey",
  },
  {
    value: "OpenRouter",
    local: false,
    modelPlaceholder: "openai/gpt-oss-20b:free",
    models: [
      "google/gemma-4-26b-a4b-it:free",
      "cohere/north-mini-code:free",
      "openai/gpt-oss-20b:free",
      "tencent/hy3:free",
    ],
    apiKeyUrl: "https://openrouter.ai/",
  },
  {
    value: "Ollama (Local)",
    local: true,
    defaultBaseUrl: "http://localhost:11434",
    modelPlaceholder: "llama3.2",
    models: ["llama3.2", "llama3.1", "mistral", "qwen2.5", "phi3", "gemma2"],
  },
];

export default function ModelProviderSettingsPage() {
  return (
    <Suspense fallback={null}>
      <ModelProviderSettingsPageInner />
    </Suspense>
  );
}

function ModelProviderSettingsPageInner() {
  const { notify, confirm } = useDialog();
  const searchParams = useSearchParams();

  const [settings, setSettings] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [clineApiKey, setClineApiKey] = useState("");
  const [providerName, setProviderName] = useState("Cline");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [savingCline, setSavingCline] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationPayload[]>([]);
  const [deletingIntegrationId, setDeletingIntegrationId] = useState<number | null>(null);

  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);

  const isCommunity = plan?.plan === "community";
  const availableProviders = useMemo(
    () => (isCommunity ? PROVIDERS.filter((p) => p.value === "OpenRouter") : PROVIDERS),
    [isCommunity]
  );

  const provider = useMemo(
    () => availableProviders.find((p) => p.value === providerName) ?? availableProviders[0],
    [availableProviders, providerName]
  );

  function handleProviderChange(nextValue: string) {
    setProviderName(nextValue);
    const next = PROVIDERS.find((p) => p.value === nextValue);
    if (next?.local && !baseUrl) setBaseUrl(next.defaultBaseUrl ?? "");
    if (next && !next.models.includes(model)) setModel(next.models[0] ?? "");
  }

  useEffect(() => {
    if (!isCommunity) return;
    if (providerName !== "OpenRouter") {
      handleProviderChange("OpenRouter");
    } else if (!provider.models.includes(model)) {
      setModel(provider.models[0] ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommunity]);

  // Deep-linked from the Quick Setup dialog ("Connect to Ollama" / "Use BYOK")
  // -- preselect the matching provider once the plan-gated list is known.
  useEffect(() => {
    const setup = searchParams.get("setup");
    if (!setup || isCommunity) return;
    if (setup === "ollama") {
      handleProviderChange("Ollama (Local)");
    } else if (setup === "byok" && providerName === "Ollama (Local)") {
      handleProviderChange("Cline");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCommunity]);

  function loadIntegrations() {
    getIntegrations()
      .then(setIntegrations)
      .catch(() => {});
  }

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load settings.", "error")
      )
      .finally(() => setLoading(false));

    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
    loadIntegrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update<K extends keyof SettingsPayload>(key: K, value: SettingsPayload[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);

    try {
      const saved = await updateSettings(settings);
      setSettings(saved);
      notify("Settings saved successfully.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  const maxIntegrations = PLAN_INTEGRATION_LIMITS[plan?.plan ?? "community"] ?? 1;
  const atIntegrationLimit = maxIntegrations !== null && integrations.length >= maxIntegrations;

  async function handleSaveCline() {
    setSavingCline(true);

    try {
      const saved = await createIntegration({
        apiKey: provider.local ? null : clineApiKey.trim() || null,
        providerName,
        baseUrl: provider.local ? baseUrl.trim() || null : null,
        model: model.trim() || null,
      });
      setIntegrations((prev) => [...prev, saved]);
      setClineApiKey("");
      setBaseUrl(provider.local ? provider.defaultBaseUrl ?? "" : "");
      setModel(provider.models[0] ?? "");
      notify(`${saved.provider_name} integration saved.`, "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to save integration.", "error");
    } finally {
      setSavingCline(false);
    }
  }

  async function handleDeleteIntegration(integration: IntegrationPayload) {
    const confirmed = await confirm({
      title: "Remove integration",
      message: `Remove the ${integration.provider_name} integration? Any chat currently using it will fall back to the local model.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingIntegrationId(integration.id);
    try {
      await deleteIntegration(integration.id);
      setIntegrations((prev) => prev.filter((i) => i.id !== integration.id));
      notify("Integration removed.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to remove integration.", "error");
    } finally {
      setDeletingIntegrationId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center shadow-sm text-gray-500 dark:text-gray-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Model Provider
          </h2>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span
              className={`h-2 w-2 rounded-full ${
                integrations.length > 0 ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
            {integrations.length > 0
              ? `${integrations.length}${maxIntegrations != null ? `/${maxIntegrations}` : ""} saved`
              : "None saved"}
          </span>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {isCommunity ? (
            <>
              The Free plan can connect OpenRouter&apos;s free models. Once saved,
              this becomes a selectable answer source in AI Chat, generated by the free
              model you pick instead of the local default.{" "}
              <button
                onClick={() => setCheckoutPlan("pro")}
                className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Upgrade to Pro
              </button>{" "}
              to connect any provider and model.
            </>
          ) : (
            <>
              Connect Cline, a local Ollama/LM Studio model, or a hosted provider using your
              own API key. It becomes a selectable answer source in AI Chat, still grounded
              in your Dataset.
            </>
          )}
        </p>

        {integrations.length > 0 && (
          <ul className="mb-5 space-y-2">
            {integrations.map((integration) => (
              <li
                key={integration.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    {integration.provider_name}
                  </p>
                  {integration.model && (
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {integration.model}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteIntegration(integration)}
                  disabled={deletingIntegrationId === integration.id}
                  title="Remove integration"
                  className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.75}
                    stroke="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.166L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {atIntegrationLimit ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-4">
            <p className="text-sm text-indigo-800 dark:text-indigo-300">
              {isCommunity
                ? "The Free plan allows 1 saved integration. Remove it or upgrade to add another."
                : `You've saved ${integrations.length}/${maxIntegrations} integrations for the ${PLAN_DISPLAY_NAMES[plan?.plan ?? "community"]} plan. Remove one or upgrade for more.`}
            </p>
            <button
              onClick={() => setCheckoutPlan(plan?.plan === "pro" ? "team" : "pro")}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
            >
              {plan?.plan === "pro" ? "Upgrade to Unlimited" : "Upgrade to Pro"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Provider
              </span>
              <div className="relative">
                <select
                  value={providerName}
                  onChange={(e) => handleProviderChange(e.target.value)}
                  disabled={isCommunity}
                  className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pr-10 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {availableProviders.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.value}
                    </option>
                  ))}
                </select>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </label>

            <p className="-mt-1 rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3 text-xs text-gray-500 dark:text-gray-400">
              {provider.local
                ? "Ollama allows you to run AI models locally on your machine, providing offline access and keeping your data on your device."
                : "Bring Your Own Key (BYOK) lets you connect your own API key from supported AI providers, giving you full control over the model you use."}
            </p>

            {provider.local ? (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                  Base URL
                </span>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={provider.defaultBaseUrl}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                />
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                  API Key
                </span>
                <div className="relative">
                  <input
                    type="password"
                    value={clineApiKey}
                    onChange={(e) => setClineApiKey(e.target.value)}
                    placeholder="Paste your chatbot's API key"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pr-10 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                  />
                  {clineApiKey && (
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = await confirm({
                          title: "Remove API key",
                          message: "This will clear the saved API key from this field. You'll need to save afterwards for the removal to take effect.",
                          confirmLabel: "Remove",
                          danger: true,
                        });
                        if (confirmed) setClineApiKey("");
                      }}
                      title="Delete API key"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.75}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.166L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {provider.apiKeyUrl && (
                  <a
                    href={provider.apiKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    Don&apos;t have a key? Get one from {provider.value}
                  </a>
                )}
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Model
              </span>

              {provider.models.length > 0 ? (
                <>
                  <div className="relative">
                    <select
                      value={provider.models.includes(model) ? model : CUSTOM_MODEL}
                      onChange={(e) =>
                        setModel(e.target.value === CUSTOM_MODEL ? "" : e.target.value)
                      }
                      className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pr-10 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                    >
                      {provider.models.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                      {!isCommunity && <option value={CUSTOM_MODEL}>Custom...</option>}
                    </select>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>

                  {!isCommunity && !provider.models.includes(model) && (
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="Enter a custom model id"
                      className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                    />
                  )}
                </>
              ) : (
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder={provider.modelPlaceholder}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                />
              )}
            </label>

            <button
              onClick={handleSaveCline}
              disabled={savingCline}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
            >
              {savingCline ? "Saving..." : "Save Integration"}
            </button>

            <SetupGuideLink />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-gray-100">
          AI Configuration
        </h2>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Ollama URL
            </span>
            <input
              value={settings.ollama_url}
              onChange={(e) => update("ollama_url", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              placeholder="http://localhost:11434"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              LLM Model
            </span>
            <input
              value={settings.llm_model}
              onChange={(e) => update("llm_model", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              placeholder="llama3.2"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Embedding Model
            </span>
            <input
              value={settings.embedding_model}
              onChange={(e) => update("embedding_model", e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              placeholder="all-MiniLM-L6-v2"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Chunk Size
              </span>
              <input
                type="number"
                min={50}
                value={settings.chunk_size}
                onChange={(e) => update("chunk_size", Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Chunk Overlap
              </span>
              <input
                type="number"
                min={0}
                value={settings.chunk_overlap}
                onChange={(e) => update("chunk_overlap", Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>

      {checkoutPlan && (
        <DemoCheckoutModal
          plan={checkoutPlan}
          price={checkoutPlan === "pro" ? "$19/month" : "$49/month"}
          onClose={() => setCheckoutPlan(null)}
          onSubscribed={() => {
            setCheckoutPlan(null);
            getBillingPlan().then(setPlan).catch(() => {});
          }}
        />
      )}
    </div>
  );
}
