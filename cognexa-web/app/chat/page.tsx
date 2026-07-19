"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  askAIStream,
  createChatSession,
  deleteChatSession,
  generateSessionReport,
  getChatSessionMessages,
  getChatSessions,
  getIntegrations,
  IntegrationPayload,
  ReportPayload,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import useAIProviderStatus from "@/lib/useAIProviderStatus";
import AIProviderNotice from "@/components/AIProviderNotice";
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
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [scopedDocIds, setScopedDocIds] = useState<number[]>([]);
  const [source, setSource] = useState<"auto" | "local" | "integration">("auto");
  const [integrations, setIntegrations] = useState<IntegrationPayload[]>([]);
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number | null>(null);

  const selectedIntegration =
    integrations.find((i) => i.id === selectedIntegrationId) ?? null;
  const defaultIntegration = integrations[0] ?? null;
  const [providerMenuOpen, setProviderMenuOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [startingNewChat, setStartingNewChat] = useState(false);
  const [deletingChat, setDeletingChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);
  const { confirm, notify } = useDialog();
  const aiProvider = useAIProviderStatus();
  const searchParams = useSearchParams();
  const router = useRouter();
  const autoSentRef = useRef(false);

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
    let cancelled = false;

    async function syncFromUrl() {
      const sessionParam = searchParams.get("session");
      const requestedId = sessionParam ? Number(sessionParam) : null;

      // Coming from a dataset's "Ask AI" button (a `doc` param with no explicit
      // `session`), or an explicit "New Chat" click (`new=1`), should always
      // start a fresh chat instead of resuming whatever chat was last used.
      const startFresh = !sessionParam && (searchParams.get("doc") || searchParams.get("new"));
      if (startFresh) {
        setSessionId(null);
        setMessages([]);
        setLoading(false);
        return;
      }

      // A specific session is requested in the URL (e.g. the sidebar link for
      // another chat was clicked). If it's already the one loaded, there's
      // nothing to refetch; otherwise load it — this is what makes switching
      // sessions from the sidebar actually update the page.
      if (requestedId) {
        if (requestedId === sessionId) {
          setLoading(false);
          return;
        }
        try {
          const history = await getChatSessionMessages(requestedId);
          if (cancelled) return;
          setSessionId(requestedId);
          setMessages(history);
        } catch (err) {
          if (!cancelled) {
            notify(err instanceof Error ? err.message : "Failed to load chat history.", "error");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      // No session/doc/new param at all — this is the first load of /chat
      // with a bare URL, so resume the most recently used session, if any.
      if (sessionId !== null) {
        setLoading(false);
        return;
      }
      try {
        const sessions = await getChatSessions();
        const target = sessions[0];
        if (cancelled) return;

        // No session yet — leave sessionId null instead of eagerly creating one here.
        // Creating it lazily on the first message avoids racing duplicate "New Chat"
        // rows when this effect fires more than once (e.g. React StrictMode + a slow DB).
        if (!target) {
          setMessages([]);
          return;
        }

        setSessionId(target.id);
        const history = await getChatSessionMessages(target.id);
        if (cancelled) return;
        setMessages(history);
      } catch (err) {
        if (!cancelled) {
          notify(err instanceof Error ? err.message : "Failed to load chat history.", "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    syncFromUrl();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    getIntegrations()
      .then(setIntegrations)
      .catch(() => setIntegrations([]))
      .finally(() => setIntegrationsLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  async function handleSend(question?: string) {
    const q = (question ?? input).trim();
    if (!q || asking) return;

    if (source === "auto" && !defaultIntegration) {
      notify(
        "Add an AI provider under Settings > Integrations first, or switch to Local (Ollama) from the provider menu.",
        "error"
      );
      return;
    }

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      try {
        const session = await createChatSession();
        activeSessionId = session.id;
        setSessionId(session.id);
        router.replace(`/chat?session=${session.id}`);
      } catch (err) {
        notify(err instanceof Error ? err.message : "Failed to start a new chat.", "error");
        return;
      }
    }

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
        activeSessionId,
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
        source,
        selectedIntegration?.id
      );
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== questionId && m.id !== answerId));
      notify(err instanceof Error ? err.message : "Failed to get AI response.", "error");
    } finally {
      setAsking(false);
    }
  }

  useEffect(() => {
    if (loading || !integrationsLoaded || autoSentRef.current) return;

    const q = searchParams.get("q");
    if (!q) return;

    autoSentRef.current = true;
    router.replace(sessionId ? `/chat?session=${sessionId}` : "/chat");
    handleSend(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, integrationsLoaded]);

  async function handleNewChat() {
    if (startingNewChat) return;

    setStartingNewChat(true);
    try {
      const session = await createChatSession();
      setSessionId(session.id);
      setMessages([]);
      router.replace(`/chat?session=${session.id}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to start a new chat.", "error");
    } finally {
      setStartingNewChat(false);
    }
  }

  async function handleDeleteChat() {
    if (!sessionId) return;

    const confirmed = await confirm({
      title: "Delete this chat",
      message: "This will permanently delete this conversation. This cannot be undone.",
      confirmLabel: "Delete",
      danger: true,
    });

    if (!confirmed) return;

    setDeletingChat(true);
    try {
      await deleteChatSession(sessionId);
      const session = await createChatSession();
      setSessionId(session.id);
      setMessages([]);
      router.replace(`/chat?session=${session.id}`);
      notify("Chat deleted.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete this chat.", "error");
    } finally {
      setDeletingChat(false);
    }
  }

  async function handleGenerateReport() {
    if (messages.length === 0 || generatingReport || !sessionId) return;

    setGeneratingReport(true);
    try {
      const result = await generateSessionReport(sessionId, source, selectedIntegration?.id);
      setReport(result);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to generate report.", "error");
    } finally {
      setGeneratingReport(false);
    }
  }

  function handleDownloadReport() {
    if (!report) return;
    const blob = new Blob([report.report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cognexa-report-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!aiProvider.loading && !aiProvider.connected) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <AIProviderNotice variant="chat" className="max-w-md" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="space-y-4">
          {!loading && messages.length === 0 && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-semibold text-white">
                CX
              </div>
              <div className="max-w-lg rounded-2xl rounded-tl-sm bg-gray-100 dark:bg-gray-800 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                Hello! Ask me anything about your uploaded documents.
              </div>
            </div>
          )}

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
                    CX
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
            <DocumentFilter selected={scopedDocIds} onChange={setScopedDocIds} openUpward compact />
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
                    : source === "integration" && selectedIntegration
                    ? `${selectedIntegration.provider_name}${selectedIntegration.model ? ` (${selectedIntegration.model})` : ""}`
                    : `Auto${defaultIntegration ? ` (${defaultIntegration.provider_name})` : " (no provider)"}`}
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
                    Auto{defaultIntegration ? ` (${defaultIntegration.provider_name})` : " (no provider)"}
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

                  {integrations.map((i) => (
                    <button
                      key={i.id}
                      onClick={() => {
                        setSource("integration");
                        setSelectedIntegrationId(i.id);
                        setProviderMenuOpen(false);
                      }}
                      className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        source === "integration" && selectedIntegrationId === i.id
                          ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-gray-100"
                          : "text-gray-600 dark:text-gray-300"
                      }`}
                    >
                      {i.provider_name}
                      {i.model ? ` (${i.model})` : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleNewChat}
              disabled={startingNewChat}
              title="New Chat"
              className="flex items-center justify-center rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>

            <button
              onClick={handleGenerateReport}
              disabled={messages.length === 0 || generatingReport}
              title="Generate report from this conversation"
              className="flex items-center justify-center rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {generatingReport ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                  className="h-4 w-4 animate-spin"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              ) : (
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
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={handleDeleteChat}
              disabled={!sessionId || deletingChat}
              title="Delete this chat"
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

      {report && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-6"
          onClick={() => setReport(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Conversation Report
              </h2>

              <button
                onClick={() => setReport(null)}
                className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="whitespace-pre-wrap rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-700 dark:text-gray-300">
              {stripMarkdown(report.report)}
            </div>

            {report.sources.length > 0 && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Sources: {report.sources.join(", ")}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleDownloadReport}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-2 text-sm font-medium text-white transition hover:shadow-md"
              >
                Download as .txt
              </button>
              <button
                onClick={() => setReport(null)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
