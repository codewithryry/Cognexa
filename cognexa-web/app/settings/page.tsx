"use client";

import { useEffect, useState } from "react";
import { updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { useDialog } from "@/lib/DialogContext";

export default function AccountSettingsPage() {
  const { notify } = useDialog();
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingAccount, setSavingAccount] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

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

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
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
  );
}
