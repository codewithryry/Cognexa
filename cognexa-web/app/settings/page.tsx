"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getBillingPlan,
  getClineIntegration,
  getSettings,
  PlanPayload,
  SettingsPayload,
  subscribePlan,
  updateClineIntegration,
  updateProfile,
  updateSettings,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useDialog } from "@/lib/DialogContext";
import DemoCheckoutModal from "@/components/DemoCheckoutModal";

function formatMB(bytes: number) {
  return (bytes / (1024 * 1024)).toFixed(1);
}

const DEFAULT_SETTINGS: SettingsPayload = {
  ollama_url: "http://localhost:11434",
  llm_model: "llama3.2",
  embedding_model: "all-MiniLM-L6-v2",
  chunk_size: 500,
  chunk_overlap: 50,
  theme: "dark",
};

interface ProviderOption {
  value: string;
  local: boolean;
  defaultBaseUrl?: string;
  modelPlaceholder: string;
  models: string[];
}

const CUSTOM_MODEL = "__custom__";

const PROVIDERS: ProviderOption[] = [
  {
    value: "Cline",
    local: false,
    modelPlaceholder: "anthropic/claude-sonnet-4-6",
    models: ["anthropic/claude-sonnet-4-6", "openai/gpt-5.5", "google/gemini-3.5-flash"],
  },
  {
    value: "OpenAI",
    local: false,
    modelPlaceholder: "gpt-4o",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o3", "o3-mini"],
  },
  {
    value: "Anthropic Claude",
    local: false,
    modelPlaceholder: "claude-sonnet-5",
    models: ["claude-opus-4-8", "claude-sonnet-5", "claude-haiku-4-5-20251001", "claude-fable-5"],
  },
  {
    value: "Cohere",
    local: false,
    modelPlaceholder: "command-a-plus-05-2026",
    models: ["command-a-plus-05-2026", "command-r-plus", "command-r"],
  },
  {
    value: "Google Gemini",
    local: false,
    modelPlaceholder: "gemini-2.5-flash",
    models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"],
  },
  {
    value: "OpenRouter",
    local: false,
    modelPlaceholder: "openai/gpt-oss-20b:free",
    models: [
      "openai/gpt-oss-20b:free",
      "google/gemma-4-26b-a4b-it:free",
      "cohere/north-mini-code:free",
      "tencent/hy3:free",
    ],
  },
  {
    value: "Ollama (Local)",
    local: true,
    defaultBaseUrl: "http://localhost:11434",
    modelPlaceholder: "llama3.2",
    models: ["llama3.2", "llama3.1", "mistral", "qwen2.5", "phi3", "gemma2"],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify } = useDialog();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [clineApiKey, setClineApiKey] = useState("");
  const [providerName, setProviderName] = useState("Cline");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [clineConnected, setClineConnected] = useState(false);
  const [savingCline, setSavingCline] = useState(false);

  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);

  function loadPlan() {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
  }

  const provider = useMemo(
    () => PROVIDERS.find((p) => p.value === providerName) ?? PROVIDERS[0],
    [providerName]
  );

  function handleProviderChange(nextValue: string) {
    setProviderName(nextValue);
    const next = PROVIDERS.find((p) => p.value === nextValue);
    if (next?.local && !baseUrl) setBaseUrl(next.defaultBaseUrl ?? "");
    if (next && !next.models.includes(model)) setModel(next.models[0] ?? "");
  }

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load settings.", "error")
      )
      .finally(() => setLoading(false));

    loadPlan();

    getClineIntegration()
      .then((data) => {
        setClineApiKey(data.cline_api_key ?? "");
        setClineConnected(data.connected);
        setProviderName(data.provider_name || "Cline");
        setBaseUrl(data.base_url ?? "");
        setModel(data.model ?? "");
      })
      .catch(() => setClineConnected(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

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

  async function handleSaveAccount() {
    setSavingAccount(true);

    try {
      await updateProfile(name, newPassword || undefined);
      await refreshUser();
      setNewPassword("");
      notify("Account updated successfully.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update account.", "error");
    } finally {
      setSavingAccount(false);
    }
  }

  async function handleSaveCline() {
    setSavingCline(true);

    try {
      const saved = await updateClineIntegration({
        apiKey: provider.local ? null : clineApiKey.trim() || null,
        providerName,
        baseUrl: provider.local ? baseUrl.trim() || null : null,
        model: model.trim() || null,
      });
      setClineApiKey(saved.cline_api_key ?? "");
      setClineConnected(saved.connected);
      setProviderName(saved.provider_name || "Cline");
      setBaseUrl(saved.base_url ?? "");
      setModel(saved.model ?? "");
      notify(
        saved.connected
          ? `${saved.provider_name || "Chatbot"} integration connected.`
          : "API key removed.",
        "success"
      );
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to save integration.", "error");
    } finally {
      setSavingCline(false);
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
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Account
        </h2>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Email
            </span>
            <input
              value={user?.email ?? ""}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 p-3 text-sm text-gray-500 dark:text-gray-400"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              New Password
            </span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </label>

          <button
            onClick={handleSaveAccount}
            disabled={savingAccount || !name.trim()}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
          >
            {savingAccount ? "Saving..." : "Save Account"}
          </button>
        </div>
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

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Billing &amp; Subscription
          </h2>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium capitalize text-gray-600 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {plan?.plan ?? "community"} plan
          </span>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          This is a demo billing panel — usage is real (pulled from your account), but
          checkout is simulated and no real payment is processed.
        </p>

        {plan && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Documents</span>
                <span>
                  {plan.document_count}
                  {plan.max_documents != null ? ` / ${plan.max_documents}` : " / Unlimited"}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width:
                      plan.max_documents != null
                        ? `${Math.min(100, (plan.document_count / plan.max_documents) * 100)}%`
                        : "8%",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Storage</span>
                <span>
                  {formatMB(plan.storage_bytes)} MB
                  {plan.max_storage_bytes != null
                    ? ` / ${formatMB(plan.max_storage_bytes)} MB`
                    : " / Unlimited"}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width:
                      plan.max_storage_bytes != null
                        ? `${Math.min(
                            100,
                            (plan.storage_bytes / plan.max_storage_bytes) * 100
                          )}%`
                        : "8%",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setCheckoutPlan("pro")}
            disabled={plan?.plan === "pro"}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {plan?.plan === "pro" ? "Currently on Pro" : "Upgrade to Pro — $19/mo"}
          </button>

          <button
            onClick={() => setCheckoutPlan("team")}
            disabled={plan?.plan === "team"}
            className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {plan?.plan === "team" ? "Currently on Team" : "Upgrade to Team — $49/mo"}
          </button>

          {plan && plan.plan !== "community" && (
            <button
              onClick={async () => {
                try {
                  const updated = await subscribePlan({ plan: "community" });
                  setPlan(updated);
                  notify("Reverted to the Community plan.", "success");
                } catch (err) {
                  notify(
                    err instanceof Error ? err.message : "Failed to change plan.",
                    "error"
                  );
                }
              }}
              className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Downgrade to Community
            </button>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chatbot Integration
          </h2>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span
              className={`h-2 w-2 rounded-full ${
                clineConnected ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
            {clineConnected ? "Connected" : "Not Connected"}
          </span>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Connect Cline, a local Ollama/LM Studio model, or a hosted provider like
          OpenAI, Anthropic, Cohere, Gemini, or OpenRouter using your own API key or
          endpoint. Once saved, this becomes a selectable answer source in AI Chat —
          your questions are still answered using retrieved context from your
          Knowledge Base, but generated by whichever model you pick instead of the
          local default. This is optional.
        </p>

        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Provider
            </span>
            <div className="relative">
              <select
                value={providerName}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 pr-10 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              >
                {PROVIDERS.map((p) => (
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
              <input
                type="password"
                value={clineApiKey}
                onChange={(e) => setClineApiKey(e.target.value)}
                placeholder="Paste your chatbot's API key"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
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
                    <option value={CUSTOM_MODEL}>Custom...</option>
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

                {!provider.models.includes(model) && (
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
        </div>
      </div>

      {checkoutPlan && (
        <DemoCheckoutModal
          plan={checkoutPlan}
          price={checkoutPlan === "pro" ? "$19/month" : "$49/month"}
          onClose={() => setCheckoutPlan(null)}
          onSubscribed={() => {
            setCheckoutPlan(null);
            loadPlan();
          }}
        />
      )}
    </div>
  );
}
