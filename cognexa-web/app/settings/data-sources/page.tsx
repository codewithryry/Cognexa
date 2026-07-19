"use client";

import { useEffect, useRef, useState } from "react";
import {
  createDataSource,
  DataSourcePayload,
  deleteDataSource,
  getBillingPlan,
  getDataSources,
  PlanPayload,
  syncDataSource,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

const AVAILABLE_SOURCES = [
  {
    name: "Google Drive",
    description: "Sync documents from My Drive and shared folders into your Dataset",
    available: true,
  },
];

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function GoogleDriveConnectForm({
  connecting,
  onCancel,
  onSubmit,
}: {
  connecting: boolean;
  onCancel: () => void;
  onSubmit: (args: {
    credentialJson: string;
    name: string;
    primaryAdminEmail: string;
    myDriveEmails: string;
    sharedFolderUrls: string;
    syncDeleted: boolean;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [primaryAdminEmail, setPrimaryAdminEmail] = useState("");
  const [myDriveEmails, setMyDriveEmails] = useState("");
  const [sharedFolderUrls, setSharedFolderUrls] = useState("");
  const [syncDeleted, setSyncDeleted] = useState(true);
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!credentialFile) return;
    const credentialJson = await credentialFile.text();
    onSubmit({
      credentialJson,
      name,
      primaryAdminEmail,
      myDriveEmails,
      sharedFolderUrls,
      syncDeleted,
    });
  }

  const canSubmit = Boolean(name.trim() && primaryAdminEmail.trim() && credentialFile);

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Team Drive"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Primary Admin Email
        </label>
        <input
          value={primaryAdminEmail}
          onChange={(e) => setPrimaryAdminEmail(e.target.value)}
          placeholder="admin@example.com"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          A Workspace admin the service account impersonates to reach shared folders.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          OAuth Token JSON
        </label>
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) setCredentialFile(e.dataTransfer.files[0]);
          }}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center text-[11px] transition ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10"
              : "border-gray-200 dark:border-gray-700 hover:border-indigo-300"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setCredentialFile(e.target.files[0]);
            }}
          />
          <p className="text-gray-600 dark:text-gray-300">
            {credentialFile ? credentialFile.name : "No file chosen"}
          </p>
          <p className="mt-1 text-gray-400">Drag and drop your file here to upload</p>
        </div>
        <p className="mt-1 text-[11px] text-gray-400">
          Upload your Google service account JSON key (domain-wide delegation enabled).
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          My Drive Emails
        </label>
        <input
          value={myDriveEmails}
          onChange={(e) => setMyDriveEmails(e.target.value)}
          placeholder="user1@example.com,user2@example.com"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Shared Folder URLs
        </label>
        <input
          value={sharedFolderUrls}
          onChange={(e) => setSharedFolderUrls(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/XXXXX,https://drive.google.com/drive/folders/YYYYY"
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={syncDeleted}
          onChange={(e) => setSyncDeleted(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Sync deleted files
      </label>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || connecting}
          className="flex-1 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
        >
          {connecting ? "Connecting..." : "Connect Google Drive"}
        </button>
      </div>
    </div>
  );
}

export default function DataSourcesSettingsPage() {
  const { notify, confirm } = useDialog();
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [connections, setConnections] = useState<DataSourcePayload[]>([]);
  const [connectingSource, setConnectingSource] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [syncingId, setSyncingId] = useState<number | null>(null);

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

  async function handleConnectGoogleDrive(args: {
    credentialJson: string;
    name: string;
    primaryAdminEmail: string;
    myDriveEmails: string;
    sharedFolderUrls: string;
    syncDeleted: boolean;
  }) {
    setConnecting(true);
    try {
      const saved = await createDataSource("Google Drive", args.credentialJson, {
        name: args.name,
        primary_admin_email: args.primaryAdminEmail,
        my_drive_emails: splitList(args.myDriveEmails),
        shared_folder_urls: splitList(args.sharedFolderUrls),
        sync_deleted: args.syncDeleted,
      });
      setConnections((prev) => [...prev, saved]);
      setConnectingSource(null);
      notify("Google Drive connected. Click Sync to pull in documents.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to connect Google Drive.", "error");
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

  async function handleSync(connection: DataSourcePayload) {
    setSyncingId(connection.id);
    try {
      const result = await syncDataSource(connection.id);
      loadConnections();
      const parts = [`${result.added} added`, `${result.removed} removed`, `${result.skipped} skipped`];
      notify(
        result.errors.length
          ? `Synced with issues: ${parts.join(", ")}. ${result.errors[0]}`
          : `Sync complete: ${parts.join(", ")}.`,
        result.errors.length ? "error" : "success"
      );
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
                    {connection.config?.name
                      ? `${connection.source_name} · ${connection.config.name}`
                      : connection.source_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {connection.status_message ||
                      (connection.connected ? "Connected" : "Saved without credential")}
                  </p>
                  {connection.last_synced_at && (
                    <p className="text-[11px] text-gray-400">
                      Last synced {new Date(connection.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {connection.source_name === "Google Drive" && (
                    <button
                      onClick={() => handleSync(connection)}
                      disabled={syncingId === connection.id}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      {syncingId === connection.id ? "Syncing..." : "Sync now"}
                    </button>
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
            const alreadyConnected = connectedNames.has(source.name) && source.name !== "Google Drive";
            const isOpen = connectingSource === source.name;

            return (
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
                      onClick={() => setConnectingSource(isOpen ? null : source.name)}
                      disabled={atLimit && !isOpen}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isOpen ? "Cancel" : "Add another"}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {source.description}
                </p>

                {isOpen && (
                  <GoogleDriveConnectForm
                    connecting={connecting}
                    onCancel={() => setConnectingSource(null)}
                    onSubmit={handleConnectGoogleDrive}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
