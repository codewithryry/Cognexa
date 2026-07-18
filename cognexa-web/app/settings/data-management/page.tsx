"use client";

import { useRef, useState } from "react";
import {
  backupAccount,
  deleteAccount,
  deleteAllDocuments,
  exportKnowledgeBase,
  getSettings,
  restoreAccount,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useDialog } from "@/lib/DialogContext";

export default function DataManagementSettingsPage() {
  const { notify, confirm } = useDialog();
  const { logout } = useAuth();

  const [exporting, setExporting] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingAllDocuments, setDeletingAllDocuments] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  async function handleExportKnowledgeBase() {
    setExporting(true);
    try {
      await exportKnowledgeBase();
      notify("Dataset exported.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to export dataset.", "error");
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
      getSettings().catch(() => {});
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

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Export Dataset
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
  );
}
