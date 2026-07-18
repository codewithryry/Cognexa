"use client";

import { useEffect, useState } from "react";
import {
  createDataSource,
  DataSourcePayload,
  deleteDataSource,
  getBillingPlan,
  getDataSources,
  PlanPayload,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

const AVAILABLE_SOURCES = [
  {
    name: "GitHub",
    description: "Access a repository and index its docs and README files",
    available: true,
    placeholder: "Repo URL (e.g. github.com/org/repo) or access token",
  },
  {
    name: "Google Drive",
    description: "Sync documents directly from Google Drive",
    available: false,
    placeholder: "Paste an API key / access token (optional)",
  },
];

export default function DataSourcesSettingsPage() {
  const { notify, confirm } = useDialog();
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [connections, setConnections] = useState<DataSourcePayload[]>([]);
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [credential, setCredential] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  function loadConnections() {
    getDataSources()
      .then(setConnections)
      .catch(() => {});
  }

  useEffect(() => {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
    loadConnections();
  }, []);

  const atLimit = plan?.max_apps != null && connections.length >= plan.max_apps;
  const connectedNames = new Set(connections.map((c) => c.source_name));

  async function handleConnect(sourceName: string) {
    setConnecting(true);
    try {
      const saved = await createDataSource(sourceName, credential.trim() || null);
      setConnections((prev) => [...prev, saved]);
      setConnectingSource(null);
      setCredential("");
      notify(`${sourceName} connected.`, "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to connect data source.", "error");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(connection: DataSourcePayload) {
    const confirmed = await confirm({
      title: "Disconnect data source",
      message: `Disconnect ${connection.source_name}? Any documents already synced from it stay in your Dataset.`,
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!confirmed) return;

    setRemovingId(connection.id);
    try {
      await deleteDataSource(connection.id);
      setConnections((prev) => prev.filter((c) => c.id !== connection.id));
      notify("Data source disconnected.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to disconnect data source.", "error");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Data Sources</h2>

          {plan && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              <span
                className={`h-2 w-2 rounded-full ${connections.length > 0 ? "bg-emerald-500" : "bg-gray-400"}`}
              />
              {plan.max_apps != null
                ? `${connections.length}/${plan.max_apps} connected`
                : `${connections.length} connected · Unlimited`}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sync external sources into your Dataset. The Free plan can connect up to 2 apps, Pro
          up to 10, and Unlimited has no cap.
        </p>

        {connections.length === 0 ? (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No data sources connected yet. Select one below to connect.
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {connections.map((connection) => (
              <li
                key={connection.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {connection.source_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {connection.connected ? "Connected" : "Saved without credential"}
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(connection)}
                  disabled={removingId === connection.id}
                  className="rounded-lg border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  {removingId === connection.id ? "Removing..." : "Disconnect"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Available sources
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Select a source to connect.
        </p>

        {atLimit && (
          <div className="mb-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-4 text-sm text-indigo-800 dark:text-indigo-300">
            You&apos;ve connected {connections.length}/{plan?.max_apps} apps for your plan.
            Disconnect one or upgrade to connect more.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABLE_SOURCES.map((source) => {
            const alreadyConnected = connectedNames.has(source.name);
            const isOpen = connectingSource === source.name;

            return (
              <div
                key={source.name}
                className={`rounded-xl border border-gray-100 dark:border-gray-800 p-4 ${
                  !source.available ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {source.name}
                  </span>
                  {alreadyConnected ? (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Connected
                    </span>
                  ) : !source.available ? (
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Coming soon
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setConnectingSource(isOpen ? null : source.name);
                        setCredential("");
                      }}
                      disabled={atLimit}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isOpen ? "Cancel" : "Connect"}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {source.description}
                </p>

                {isOpen && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder={source.placeholder}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={() => handleConnect(source.name)}
                      disabled={connecting}
                      className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
                    >
                      {connecting ? "Connecting..." : `Connect ${source.name}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
