"use client";

import { useEffect, useState } from "react";
import {
  ChatSessionPayload,
  exportReportFile,
  generateDatasetReport,
  generateSessionReport,
  getChatSessions,
  getGeneratedReports,
  ReportPayload,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import DocumentFilter from "@/components/DocumentFilter";
import useAIProviderStatus from "@/lib/useAIProviderStatus";
import AIProviderNotice from "@/components/AIProviderNotice";

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

interface DatasetReportCache {
  topic: string;
  result: ReportPayload;
}

interface OpenReportCache {
  result: ReportPayload;
  title: string;
}

const STORAGE_KEY = "cognexa_report_cache";

interface PersistedCache {
  sessionReports: Record<number, ReportPayload>;
  datasetReport: DatasetReportCache | null;
  openReport: OpenReportCache | null;
}

function loadCache(): PersistedCache {
  if (typeof window === "undefined") {
    return { sessionReports: {}, datasetReport: null, openReport: null };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { sessionReports: {}, datasetReport: null, openReport: null };
    const parsed = JSON.parse(raw);
    return {
      sessionReports: parsed.sessionReports ?? {},
      datasetReport: parsed.datasetReport ?? null,
      openReport: parsed.openReport ?? null,
    };
  } catch {
    return { sessionReports: {}, datasetReport: null, openReport: null };
  }
}

export default function ReportPage() {
  const { notify } = useDialog();
  const aiProvider = useAIProviderStatus();
  const [sessions, setSessions] = useState<ChatSessionPayload[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [generatingSessionId, setGeneratingSessionId] = useState<number | null>(null);
  const [sessionReports, setSessionReports] = useState<Record<number, ReportPayload>>({});

  const [topic, setTopic] = useState("");
  const [scopedDocIds, setScopedDocIds] = useState<number[]>([]);
  const [generatingDataset, setGeneratingDataset] = useState(false);
  const [datasetReport, setDatasetReport] = useState<DatasetReportCache | null>(null);

  const [report, setReport] = useState<ReportPayload | null>(null);
  const [reportTitle, setReportTitle] = useState("Report");
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);

  useEffect(() => {
    getChatSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoadingSessions(false));

    // Instant paint from localStorage, then the DB (source of truth) overwrites it
    // once it loads — this is what makes reports survive across devices/browsers too.
    const cached = loadCache();
    setSessionReports(cached.sessionReports);
    setDatasetReport(cached.datasetReport);
    if (cached.openReport) {
      setReport(cached.openReport.result);
      setReportTitle(cached.openReport.title);
    }

    getGeneratedReports()
      .then((rows) => {
        const nextSessionReports: Record<number, ReportPayload> = {};
        let nextDatasetReport: DatasetReportCache | null = null;

        for (const row of rows) {
          const payload: ReportPayload = { report: row.report, sources: row.sources };
          if (row.session_id != null) {
            nextSessionReports[row.session_id] = payload;
          } else if (row.topic) {
            nextDatasetReport = { topic: row.topic, result: payload };
          }
        }

        setSessionReports(nextSessionReports);
        setDatasetReport(nextDatasetReport);
        persist({ sessionReports: nextSessionReports, datasetReport: nextDatasetReport });
      })
      .catch(() => {});
  }, []);

  function persist(next: Partial<PersistedCache>) {
    const current = loadCache();
    const merged = { ...current, ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  }

  function openReport(result: ReportPayload, title: string) {
    setReport(result);
    setReportTitle(title);
    persist({ openReport: { result, title } });
  }

  function closeReport() {
    setReport(null);
    persist({ openReport: null });
  }

  async function handleGenerateFromSession(session: ChatSessionPayload) {
    setGeneratingSessionId(session.id);
    try {
      const result = await generateSessionReport(session.id);
      setSessionReports((prev) => {
        const next = { ...prev, [session.id]: result };
        persist({ sessionReports: next });
        return next;
      });
      openReport(result, session.title);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to generate report.", "error");
    } finally {
      setGeneratingSessionId(null);
    }
  }

  function handlePreviewSession(session: ChatSessionPayload) {
    const cached = sessionReports[session.id];
    if (!cached) return;
    openReport(cached, session.title);
  }

  async function handleGenerateFromDataset() {
    const q = topic.trim();
    if (!q || generatingDataset) return;

    setGeneratingDataset(true);
    try {
      const result = await generateDatasetReport(q, scopedDocIds.length ? scopedDocIds : undefined);
      const cache = { topic: q, result };
      setDatasetReport(cache);
      persist({ datasetReport: cache });
      openReport(result, q);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to generate report.", "error");
    } finally {
      setGeneratingDataset(false);
    }
  }

  function handlePreviewDataset() {
    if (!datasetReport) return;
    openReport(datasetReport.result, datasetReport.topic);
  }

  function handleDownloadText(format: "txt" | "md") {
    if (!report) return;

    const content =
      format === "md"
        ? `# ${reportTitle}\n\n${report.report}\n\n${
            report.sources.length ? `## Sources\n\n${report.sources.map((s) => `- ${s}`).join("\n")}` : ""
          }`
        : report.report;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cognexa_report.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(stripMarkdown(report.report));
      notify("Report copied to clipboard.", "success");
    } catch {
      notify("Failed to copy report.", "error");
    }
  }

  function handlePrint() {
    window.print();
  }

  async function handleExportFile(format: "docx" | "pdf") {
    if (!report || exporting) return;

    setExporting(format);
    try {
      await exportReportFile(report, format, reportTitle);
    } catch (err) {
      notify(err instanceof Error ? err.message : `Failed to export as ${format}.`, "error");
    } finally {
      setExporting(null);
    }
  }

  if (!aiProvider.loading && !aiProvider.connected) {
    return (
      <div className="space-y-8">
        <AIProviderNotice variant="report" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Generate from your Dataset
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Ask a broad question or name a topic — this searches your documents directly, no
          chat history needed.
        </p>

        <div className="flex flex-wrap items-stretch gap-2">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleGenerateFromDataset();
            }}
            placeholder="e.g. Week 2 Deliverables, RAG Research Summary..."
            className="h-11 min-w-0 flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
          />
          <DocumentFilter selected={scopedDocIds} onChange={setScopedDocIds} />
          <button
            onClick={handleGenerateFromDataset}
            disabled={!topic.trim() || generatingDataset}
            className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generatingDataset ? "Generating..." : "Generate Report"}
          </button>
        </div>

        {datasetReport && (
          <button
            onClick={handlePreviewDataset}
            className="mt-3 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            View last report: &quot;{datasetReport.topic}&quot;
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Generate from a chat
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Turn a conversation you already had into a clean, structured document.
        </p>

        {loadingSessions ? (
          <p className="text-sm text-gray-400">Loading conversations...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-400">
            No conversations yet — start one in Chat first.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => {
              const cached = sessionReports[session.id];
              const isGenerating = generatingSessionId === session.id;

              return (
                <li
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {session.title}
                    </p>
                    {session.updated_at && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(session.updated_at).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div className="flex h-9 shrink-0 items-center gap-1.5">
                    <button
                      onClick={() =>
                        cached ? handlePreviewSession(session) : handleGenerateFromSession(session)
                      }
                      disabled={!cached && isGenerating}
                      className="flex h-9 w-36 items-center justify-center whitespace-nowrap rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                    >
                      {cached ? "Preview" : isGenerating ? "Generating..." : "Generate Report"}
                    </button>

                    {cached ? (
                      <button
                        onClick={() => handleGenerateFromSession(session)}
                        disabled={isGenerating}
                        title="Regenerate report"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.75}
                          stroke="currentColor"
                          className={`h-3.5 w-3.5 ${isGenerating ? "animate-spin" : ""}`}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                          />
                        </svg>
                      </button>
                    ) : (
                      <div className="h-9 w-9 shrink-0" aria-hidden />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {report && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/40" onClick={closeReport}>
          <div
            className="flex h-full w-full max-w-lg animate-slide-in-right flex-col bg-white dark:bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 dark:border-gray-800 p-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {reportTitle}
              </h2>
              <button
                onClick={closeReport}
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="whitespace-pre-wrap rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-700 dark:text-gray-300">
                {stripMarkdown(report.report)}
              </div>

              {report.sources.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Sources</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                    {report.sources.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 p-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Copy
                </button>
                <button
                  onClick={handlePrint}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Print
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleDownloadText("txt")}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  .txt
                </button>
                <button
                  onClick={() => handleDownloadText("md")}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  .md
                </button>
                <button
                  onClick={() => handleExportFile("docx")}
                  disabled={exporting === "docx"}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {exporting === "docx" ? "..." : ".docx"}
                </button>
                <button
                  onClick={() => handleExportFile("pdf")}
                  disabled={exporting === "pdf"}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  {exporting === "pdf" ? "..." : ".pdf"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
