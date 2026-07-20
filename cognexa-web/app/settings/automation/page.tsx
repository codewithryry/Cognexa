"use client";

import { useEffect, useState } from "react";
import { getEmailStatus, getSettings, SettingsPayload, updateSettings } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

const DEFAULT_SETTINGS: SettingsPayload = {
  ollama_url: "http://localhost:11434",
  llm_model: "llama3.2",
  embedding_model: "all-MiniLM-L6-v2",
  chunk_size: 500,
  chunk_overlap: 50,
  theme: "dark",
  email_notifications: true,
  security_email_alerts: true,
  auto_reindex_stuck: false,
  duplicate_detection: true,
};

export default function AutomationSettingsPage() {
  const { notify } = useDialog();
  const [settings, setSettings] = useState<SettingsPayload>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings()
      .then((data) => setSettings(data))
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load settings.", "error")
      )
      .finally(() => setLoading(false));
    getEmailStatus()
      .then((data) => setEmailConfigured(data.configured))
      .catch(() => setEmailConfigured(null));
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
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notifications
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          {emailConfigured === false
            ? "These preferences are saved to your account, but no mail provider is connected yet — no emails are sent until one is."
            : "These preferences control which emails Cognexa sends to your account."}
        </p>

        <div className="space-y-3">
          <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <div>
              <span className="block text-sm text-gray-700 dark:text-gray-300">Email notifications</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Welcome email and other general account notifications.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.email_notifications}
              onChange={(e) => update("email_notifications", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
            <div>
              <span className="block text-sm text-gray-700 dark:text-gray-300">Security alerts</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Password changed and new login emails. Separate from the toggle above and on by
                default — recommended to leave enabled.
              </span>
            </div>
            <input
              type="checkbox"
              checked={settings.security_email_alerts}
              onChange={(e) => update("security_email_alerts", e.target.checked)}
              className="h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
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
          Applies to documents in your Dataset.
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
    </div>
  );
}
