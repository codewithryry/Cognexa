"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DataSourcePayload,
  deleteDataSource,
  getBillingPlan,
  getDataSources,
  getGoogleDriveAuthorizeUrl,
  getGoogleDrivePickerToken,
  PlanPayload,
  syncDataSource,
  updateGoogleDriveFolders,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import { openGoogleDrivePicker } from "@/lib/googlePicker";

const AVAILABLE_SOURCES = [
  {
    name: "Google Drive",
    description: "Sync documents from My Drive and anything shared with your Google account",
    available: true,
  },
];

function formatSyncedStorage(bytes: number): string {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export default function DataSourcesSettingsPage() {
  return (
    <Suspense fallback={null}>
      <DataSourcesSettingsPageInner />
    </Suspense>
  );
}

function DataSourcesSettingsPageInner() {
  const { notify, confirm } = useDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [connections, setConnections] = useState<DataSourcePayload[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [managingFoldersId, setManagingFoldersId] = useState<number | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatusesRef = useRef<Record<number, string | null>>({});

  function applyConnections(list: DataSourcePayload[]) {
    const prevStatuses = prevStatusesRef.current;
    list.forEach((c) => {
      if (prevStatuses[c.id] === "syncing" && c.status !== "syncing") {
        notify(
          c.status_message || (c.status === "error" ? "Sync failed." : "Sync complete."),
          c.status === "error" ? "error" : "success"
        );
      }
    });
    prevStatusesRef.current = Object.fromEntries(list.map((c) => [c.id, c.status ?? null]));
    setConnections(list);

    const anySyncing = list.some((c) => c.status === "syncing");
    if (anySyncing && !pollRef.current) {
      pollRef.current = setInterval(() => {
        getDataSources().then(applyConnections).catch(() => {});
      }, 2000);
    } else if (!anySyncing && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function loadConnections() {
    getDataSources().then(applyConnections).catch(() => {});
  }

  useEffect(() => {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
    loadConnections();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      notify("Google Drive connected. Click Sync to pull in documents.", "success");
      loadConnections();
      router.replace("/settings/data-sources");
    } else if (error) {
      notify(`Failed to connect Google Drive: ${error.replaceAll("_", " ")}`, "error");
      router.replace("/settings/data-sources");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const atLimit = plan?.max_apps != null && connections.length >= plan.max_apps;

  async function handleConnectGoogleDrive() {
    setConnecting(true);
    try {
      const { url } = await getGoogleDriveAuthorizeUrl();
      window.location.href = url;
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to connect Google Drive.", "error");
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

  async function handleManageFolders(connection: DataSourcePayload) {
    setManagingFoldersId(connection.id);
    try {
      const { access_token } = await getGoogleDrivePickerToken(connection.id);
      await openGoogleDrivePicker({
        accessToken: access_token,
        onPicked: async (folders) => {
          try {
            const updated = await updateGoogleDriveFolders(connection.id, folders);
            setConnections((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            notify(
              folders.length
                ? `Now syncing ${folders.length} folder(s). Click Sync to pull in documents.`
                : "No folders selected — this connection will sync your entire Drive.",
              "success"
            );
          } catch (err) {
            notify(err instanceof Error ? err.message : "Failed to save folder selection.", "error");
          }
        },
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to open the Google Drive folder picker.", "error");
    } finally {
      setManagingFoldersId(null);
    }
  }

  async function handleSync(connection: DataSourcePayload) {
    setSyncingId(connection.id);
    try {
      await syncDataSource(connection.id);
      loadConnections();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to sync.", "error");
    } finally {
      setSyncingId(null);
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
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {connection.config?.account_email
                      ? `${connection.source_name} · ${connection.config.account_email}`
                      : connection.source_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {connection.status_message ||
                      (connection.connected ? "Connected" : "Saved without credential")}
                  </p>
                  {connection.source_name === "Google Drive" && (
                    <p className="text-[11px] text-gray-400">
                      {connection.config?.folders?.length
                        ? `Syncing: ${connection.config.folders.map((f) => f.name).join(", ")}`
                        : "Syncing entire Drive — pick folders to narrow this down"}
                    </p>
                  )}
                  {connection.last_synced_at && (
                    <p className="text-[11px] text-gray-400">
                      Last synced {new Date(connection.last_synced_at).toLocaleString()}
                    </p>
                  )}
                  <p className="text-[11px] text-gray-400">
                    Synced Storage: {formatSyncedStorage(connection.synced_size_bytes)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {connection.source_name === "Google Drive" && (
                    <>
                      <button
                        onClick={() => handleManageFolders(connection)}
                        disabled={managingFoldersId === connection.id || connection.status === "syncing"}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        {managingFoldersId === connection.id ? "Opening..." : "Manage folders"}
                      </button>
                      <button
                        onClick={() => handleSync(connection)}
                        disabled={syncingId === connection.id || connection.status === "syncing"}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        {syncingId === connection.id || connection.status === "syncing" ? "Syncing..." : "Sync now"}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDisconnect(connection)}
                    disabled={removingId === connection.id}
                    className="rounded-lg border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {removingId === connection.id ? "Removing..." : "Disconnect"}
                  </button>
                </div>
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
          Select a source to connect. Each connection represents one Google account — add
          another connection to sync a second account.
        </p>

        {atLimit && (
          <div className="mb-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-4 text-sm text-indigo-800 dark:text-indigo-300">
            You&apos;ve connected {connections.length}/{plan?.max_apps} apps for your plan.
            Disconnect one or upgrade to connect more.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABLE_SOURCES.map((source) => (
            <div
              key={source.name}
              className={`rounded-xl border border-gray-100 dark:border-gray-800 p-4 ${
                !source.available ? "opacity-60" : ""
              } ${source.name === "Google Drive" ? "sm:col-span-2" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {source.name}
                </span>
                {!source.available ? (
                  <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Coming soon
                  </span>
                ) : (
                  <button
                    onClick={handleConnectGoogleDrive}
                    disabled={atLimit || connecting}
                    className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connecting ? "Redirecting..." : "Connect with Google"}
                  </button>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {source.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
