"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  backupAccount,
  createIntegration,
  deleteAccount,
  deleteAllDocuments,
  deleteIntegration,
  exportKnowledgeBase,
  getBillingPlan,
  getIntegrations,
  getSettings,
  IntegrationPayload,
  PlanPayload,
  restoreAccount,
  SettingsPayload,
  subscribePlan,
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
  email_notifications: true,
  auto_reindex_stuck: false,
  duplicate_detection: true,
};

const COMING_SOON_INTEGRATIONS = [
  { name: "Google Drive", description: "Sync documents directly from Google Drive" },
  { name: "GitHub", description: "Index a repository's docs and README files" },
  { name: "Notion", description: "Pull in a Notion workspace as a knowledge source" },
];

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
  community: "Community",
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { notify, confirm } = useDialog();
  const { user, refreshUser, logout } = useAuth();

  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  const [clineApiKey, setClineApiKey] = useState("");
  const [providerName, setProviderName] = useState("Cline");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [savingCline, setSavingCline] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationPayload[]>([]);
  const [deletingIntegrationId, setDeletingIntegrationId] = useState<number | null>(null);

  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);

  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingAllDocuments, setDeletingAllDocuments] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  function loadPlan() {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
  }

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

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load settings.", "error")
      )
      .finally(() => setLoading(false));

    loadPlan();
    loadIntegrations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadIntegrations() {
    getIntegrations()
      .then(setIntegrations)
      .catch(() => {});
  }

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

  const maxIntegrations = PLAN_INTEGRATION_LIMITS[plan?.plan ?? "community"] ?? 1;
  const atIntegrationLimit =
    maxIntegrations !== null && integrations.length >= maxIntegrations;

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

  async function handleExportKnowledgeBase() {
    setExporting(true);
    try {
      await exportKnowledgeBase();
      notify("Knowledge base exported.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to export knowledge base.", "error");
    } finally {
      setExporting(false);
    }
  }

  async function handleBackupAccount() {
    setBackingUp(true);
    try {
      await backupAccount();
      notify("Backup downloaded.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create backup.", "error");
    } finally {
      setBackingUp(false);
    }
  }

  async function handleRestoreFile(file: File) {
    const confirmed = await confirm({
      title: "Restore from backup",
      message:
        "This replaces your current settings, chat history, and saved integrations with the ones in this backup file. Documents are not restored (a backup only stores document metadata, not the files) — this cannot be undone.",
      confirmLabel: "Restore",
      danger: true,
    });
    if (!confirmed) return;

    setRestoring(true);
    try {
      const result = await restoreAccount(file);
      notify(
        `Restored ${result.restored_chat_messages} chat message(s) and ${result.restored_integrations} integration(s). API keys must be re-entered.`,
        "success"
      );
      loadIntegrations();
      getSettings().then(setSettings).catch(() => {});
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to restore backup.", "error");
    } finally {
      setRestoring(false);
    }
  }

  async function handleDeleteAllDocuments() {
    const confirmed = await confirm({
      title: "Delete all documents",
      message: "This permanently removes every uploaded document and its indexed chunks. This cannot be undone.",
      confirmLabel: "Delete all",
      danger: true,
    });
    if (!confirmed) return;

    setDeletingAllDocuments(true);
    try {
      await deleteAllDocuments();
      notify("All documents deleted.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete documents.", "error");
    } finally {
      setDeletingAllDocuments(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = await confirm({
      title: "Delete account",
      message:
        "This permanently deletes your account, documents, chat history, and integrations. This cannot be undone.",
      confirmLabel: "Delete account",
      danger: true,
    });
    if (!confirmed) return;

    const doubleConfirmed = await confirm({
      title: "Are you absolutely sure?",
      message: "Type nothing needed — just confirm again. There is no way to recover your data after this.",
      confirmLabel: "Yes, delete everything",
      danger: true,
    });
    if (!doubleConfirmed) return;

    setDeletingAccount(true);
    try {
      await deleteAccount();
      logout();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete account.", "error");
      setDeletingAccount(false);
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

          <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {PLAN_DISPLAY_NAMES[plan?.plan ?? "community"]} plan
          </span>
        </div>

        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          This is a demo billing panel — usage is real (pulled from your account), but
          checkout is simulated and no real payment is processed.
        </p>

        {plan && (
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            {plan.max_ai_credits != null && (
              <div className="sm:col-span-2">
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>AI questions (OpenRouter, resets monthly)</span>
                  <span>
                    {Math.max(0, plan.max_ai_credits - (plan.ai_credits_remaining ?? plan.max_ai_credits))}
                    {` / ${plan.max_ai_credits}`}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{
                      width: `${Math.min(
                        100,
                        ((plan.max_ai_credits - (plan.ai_credits_remaining ?? plan.max_ai_credits)) /
                          plan.max_ai_credits) *
                          100
                      )}%`,
                    }}
                  />
                </div>
                {plan.ai_credits_remaining === 0 && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Out of AI questions — chat is now answering from the local model until next month.
                  </p>
                )}
              </div>
            )}

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
            {plan?.plan === "team" ? "Currently on Unlimited" : "Upgrade to Unlimited — $49/mo"}
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
              The Community plan can connect OpenRouter&apos;s free models. Once saved,
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
              Connect Cline, a local Ollama/LM Studio model, or a hosted provider like
              OpenAI, Anthropic, Cohere, Gemini, or OpenRouter using your own API key or
              endpoint. Once saved, this becomes a selectable answer source in AI Chat —
              your questions are still answered using retrieved context from your
              Knowledge Base, but generated by whichever model you pick instead of the
              local default. This is optional.
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
                ? "The Community plan allows 1 saved integration. Remove it or upgrade to add another."
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
        </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          These preferences are saved to your account, but no mail provider is connected yet —
          no emails are sent until one is.
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <span className="text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={(e) => update("email_notifications", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Notification Preferences"}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Automation
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Applies to documents in your Knowledge Base.
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <div>
              <span className="block text-sm text-gray-700 dark:text-gray-300">Auto Re-index</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                If a document gets stuck in Processing, automatically re-index it.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.auto_reindex_stuck}
              onChange={(e) => update("auto_reindex_stuck", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <div>
              <span className="block text-sm text-gray-700 dark:text-gray-300">
                Duplicate Detection
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Block uploads that are byte-for-byte identical to a document you already have.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.duplicate_detection}
              onChange={(e) => update("duplicate_detection", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Automation Settings"}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Integrations
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Sync external sources into your knowledge base. Not available yet.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {COMING_SOON_INTEGRATIONS.map((integration) => (
            <div
              key={integration.name}
              className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 opacity-60"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {integration.name}
                </span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Coming soon
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {integration.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Data Management
        </h2>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Export Knowledge Base
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Download your uploaded documents and their metadata as a .zip file.
              </p>
            </div>
            <button
              onClick={handleExportKnowledgeBase}
              disabled={exporting}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              {exporting ? "Exporting..." : "Export"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Backup</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Download a JSON backup of your settings, chat history, and integrations
                (API keys excluded).
              </p>
            </div>
            <button
              onClick={handleBackupAccount}
              disabled={backingUp}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              {backingUp ? "Backing up..." : "Backup"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Restore</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Restore settings, chat history, and integrations from a backup file.
              </p>
            </div>
            <input
              ref={restoreInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) handleRestoreFile(file);
              }}
            />
            <button
              onClick={() => restoreInputRef.current?.click()}
              disabled={restoring}
              className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60"
            >
              {restoring ? "Restoring..." : "Restore"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Delete All Documents
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Permanently remove every uploaded document and its indexed chunks.
              </p>
            </div>
            <button
              onClick={handleDeleteAllDocuments}
              disabled={deletingAllDocuments}
              className="rounded-lg border border-red-200 dark:border-red-900 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-60"
            >
              {deletingAllDocuments ? "Deleting..." : "Delete All"}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50/40 dark:bg-red-500/5 p-4">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Delete Account
              </p>
              <p className="text-xs text-red-600/80 dark:text-red-400/70">
                Permanently delete your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={deletingAccount}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {deletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
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
