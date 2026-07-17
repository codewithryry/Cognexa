"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { askAIStream, clearChatHistory, getChatHistory, getClineIntegration } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import DocumentFilter from "@/components/DocumentFilter";

interface ChatMessage {
  id: number | string;
  question: string;
  answer: string;
  sources?: string[];
  streaming?: boolean;
}

const SUGGESTED_QUESTIONS = [
  "Summarize my uploaded documents.",
  "What are the key points in my knowledge base?",
  "List the documents I've uploaded so far.",
];

function stripMarkdown(text: string) {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "• ");
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [scopedDocIds, setScopedDocIds] = useState<number[]>([]);
  const [source, setSource] = useState<"auto" | "local" | "integration">("auto");
  const [integration, setIntegration] = useState<{
    connected: boolean;
    provider_name: string;
    model: string | null;
  } | null>(null);
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const { confirm, notify } = useDialog();
  const searchParams = useSearchParams();

  useEffect(() => {
    const docParam = searchParams.get("doc");
    if (docParam) {
      const id = Number(docParam);
      if (!Number.isNaN(id)) setScopedDocIds([id]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
        setProviderMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    getChatHistory()
      .then((history) => setMessages(history))
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load chat history.", "error")
      )
      .finally(() => setLoading(false));

    getClineIntegration()
      .then((data) =>
        setIntegration({
          connected: data.connected,
          provider_name: data.provider_name,
          model: data.model,
        })
      )
      .catch(() => setIntegration(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function handleSend(question?: string) {
    const q = (question ?? input).trim();
    if (!q || asking) return;

    setInput("");
    setAsking(true);

    const questionId = `q-${Date.now()}`;
    const answerId = `a-${Date.now()}`;

    // Show the user's message immediately instead of waiting on the AI response.
    setMessages((prev) => [
      ...prev,
      { id: questionId, question: q, answer: "" },
      { id: answerId, question: "", answer: "", streaming: true },
    ]);

    try {
      await askAIStream(
        q,
        scopedDocIds.length ? scopedDocIds : undefined,
        {
          onSources: (sources) => {
            setMessages((prev) =>
              prev.map((m) => (m.id === answerId ? { ...m, sources } : m))
            );
          },
          onToken: (content) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === answerId ? { ...m, answer: m.answer + content } : m
              )
            );
          },
          onDone: (sources) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === answerId ? { ...m, sources, streaming: false } : m
              )
            );
          },
        },
        source
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== questionId && m.id !== answerId));
      notify(err instanceof Error ? err.message : "Failed to get AI response.", "error");
    } finally {
      setAsking(false);
    }
  }

  async function handleClear() {
    const confirmed = await confirm({
      title: "Clear conversation",
      message: "This will permanently delete your entire chat history.",
      confirmLabel: "Clear",
      danger: true,
    });

    if (!confirmed) return;

    try {
      await clearChatHistory();
      setMessages([]);
      notify("Conversation cleared.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to clear conversation.", "error");
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
              AI
            </div>
            <div className="max-w-lg rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
              Hello! Ask me anything about your uploaded documents.
            </div>
          </div>

          {loading && (
            <p className="text-sm text-gray-400">Loading conversation...</p>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.question && (
                <div className="mb-4 flex items-start justify-end gap-3">
                  <div className="max-w-lg rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-3 text-sm text-white">
                    {msg.question}
                  </div>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-xs font-semibold text-gray-600 dark:text-gray-300">
                    You
                  </div>
                </div>
              )}

              {(msg.answer || msg.streaming) && (
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
                    AI
                  </div>
                  <div className="max-w-lg space-y-2">
                    <div className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {msg.streaming && !msg.answer ? (
                        <span className="text-gray-400 dark:text-gray-500">Thinking...</span>
                      ) : (
                        <>
                          {stripMarkdown(msg.answer)}
                          {msg.streaming && (
                            <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse rounded-sm bg-indigo-400 align-middle" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {messages.length === 0 && !loading && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              className="rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          disabled={asking}
          className="w-full bg-transparent px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-400"
          placeholder="Ask something..."
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <DocumentFilter selected={scopedDocIds} onChange={setScopedDocIds} />
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative" ref={providerMenuRef}>
              <button
                onClick={() => setProviderMenuOpen((prev) => !prev)}
                className="flex items-center gap-1 rounded-full bg-transparent py-1.5 pl-3 pr-2 text-xs font-medium text-gray-600 dark:text-gray-300 outline-none transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="max-w-[9rem] truncate">
                  {source === "local"
                    ? "Local (llama3.2)"
                    : source === "integration" && integration
                    ? `${integration.provider_name}${integration.model ? ` (${integration.model})` : ""}`
                    : `Auto${integration?.connected ? ` (${integration.provider_name})` : " (Local)"}`}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-3.5 w-3.5 text-gray-400"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {providerMenuOpen && (
                <div className="absolute right-0 bottom-full z-20 mb-2 w-56 animate-fade-in rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-1.5 shadow-xl">
                  <button
                    onClick={() => {
                      setSource("auto");
                      setProviderMenuOpen(false);
                    }}
                    className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      source === "auto"
                        ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Auto{integration?.connected ? ` (${integration.provider_name})` : " (Local)"}
                  </button>

                  <button
                    onClick={() => {
                      setSource("local");
                      setProviderMenuOpen(false);
                    }}
                    className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      source === "local"
                        ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    Local (llama3.2)
                  </button>

                  {integration?.connected && (
                    <button
                      onClick={() => {
                        setSource("integration");
                        setProviderMenuOpen(false);
                      }}
                      className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        source === "integration"
                          ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {integration.provider_name}
                      {integration.model ? ` (${integration.model})` : ""}
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleClear}
              disabled={messages.length === 0}
              title="Clear conversation"
              className="flex items-center justify-center rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
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

            <button
              onClick={() => handleSend()}
              disabled={asking || !input.trim()}
              title="Send"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
