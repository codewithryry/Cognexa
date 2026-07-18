"use client";

import { useEffect, useState } from "react";
import {
  ChatChannelPayload,
  createChatChannel,
  deleteChatChannel,
  getBillingPlan,
  getChatChannels,
  PlanPayload,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

const AVAILABLE_CHANNELS = [
  { name: "Telegram", description: "Connect a Telegram bot", available: false },
];

export default function ChatChannelsSettingsPage() {
  const { notify, confirm } = useDialog();
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [channels, setChannels] = useState<ChatChannelPayload[]>([]);
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  function loadChannels() {
    getChatChannels()
      .then(setChannels)
      .catch(() => {});
  }

  useEffect(() => {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
    loadChannels();
  }, []);

  const atLimit = plan?.max_chat_channels != null && channels.length >= plan.max_chat_channels;
  const connectedNames = new Set(channels.map((c) => c.channel_name));

  async function handleConnect(channelName: string) {
    setConnecting(true);
    try {
      const saved = await createChatChannel(channelName, botToken.trim() || null);
      setChannels((prev) => [...prev, saved]);
      setConnectingChannel(null);
      setBotToken("");
      notify(`${channelName} connected.`, "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to connect chat channel.", "error");
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect(channel: ChatChannelPayload) {
    const confirmed = await confirm({
      title: "Disconnect chat channel",
      message: `Disconnect ${channel.channel_name}? People on that platform will no longer be able to reach this chatbot.`,
      confirmLabel: "Disconnect",
      danger: true,
    });
    if (!confirmed) return;

    setRemovingId(channel.id);
    try {
      await deleteChatChannel(channel.id);
      setChannels((prev) => prev.filter((c) => c.id !== channel.id));
      notify("Chat channel disconnected.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to disconnect chat channel.", "error");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chat Channels
          </h2>

          {plan && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
              <span
                className={`h-2 w-2 rounded-full ${channels.length > 0 ? "bg-emerald-500" : "bg-gray-400"}`}
              />
              {plan.max_chat_channels != null
                ? `${channels.length}/${plan.max_chat_channels} connected`
                : `${channels.length} connected · Unlimited`}
            </span>
          )}
        </div>
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          This is different from the <strong>Chat</strong> page in the sidebar. That&apos;s
          Cognexa&apos;s own in-app AI chat, answered using retrieved context from your
          Dataset (real RAG, running right now). A chat channel instead exposes that same
          RAG-backed chatbot through an outside messaging app — connect a Discord or
          Telegram bot here, and people can ask it questions from Discord/Telegram directly,
          with answers still grounded in your uploaded documents.
        </p>

        {channels.length === 0 ? (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No chat channels added yet. Select one below to connect.
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {channels.map((channel) => (
              <li
                key={channel.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {channel.channel_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {channel.connected ? "Connected" : "Saved without bot token"}
                  </p>
                </div>
                <button
                  onClick={() => handleDisconnect(channel)}
                  disabled={removingId === channel.id}
                  className="rounded-lg border border-red-200 dark:border-red-900 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                >
                  {removingId === channel.id ? "Removing..." : "Disconnect"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Available channels
        </h2>
        <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
          Select a chat channel to add.
        </p>

        {atLimit && (
          <div className="mb-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-4 text-sm text-indigo-800 dark:text-indigo-300">
            You&apos;ve connected {channels.length}/{plan?.max_chat_channels} channels for your
            plan. Disconnect one or upgrade to connect more.
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABLE_CHANNELS.map((channel) => {
            const alreadyConnected = connectedNames.has(channel.name);
            const isOpen = connectingChannel === channel.name;

            return (
              <div
                key={channel.name}
                className={`rounded-xl border border-gray-100 dark:border-gray-800 p-4 ${
                  !channel.available ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {channel.name}
                  </span>
                  {alreadyConnected ? (
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      Connected
                    </span>
                  ) : !channel.available ? (
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Coming soon
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setConnectingChannel(isOpen ? null : channel.name);
                        setBotToken("");
                      }}
                      disabled={atLimit}
                      className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isOpen ? "Cancel" : "Connect"}
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {channel.description}
                </p>

                {isOpen && (
                  <div className="mt-3 space-y-2">
                    <input
                      value={botToken}
                      onChange={(e) => setBotToken(e.target.value)}
                      placeholder="Paste the bot token (optional)"
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                    />
                    <button
                      onClick={() => handleConnect(channel.name)}
                      disabled={connecting}
                      className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-2 text-xs font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
                    >
                      {connecting ? "Connecting..." : `Connect ${channel.name}`}
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
