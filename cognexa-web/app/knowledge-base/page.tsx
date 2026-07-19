"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  deleteDocument,
  downloadDocument,
  getDocuments,
  getSettings,
  reindexDocument,
  SettingsPayload,
} from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import useAIProviderStatus from "@/lib/useAIProviderStatus";

interface DocumentItem {
  id: number;
  filename: string;
  file_type: string | null;
  chunks: number;
  preview: string | null;
  size_bytes: number | null;
  page_count: number | null;
  created_at: string;
}

type SortKey = "newest" | "oldest" | "name" | "chunks";
type ViewMode = "grid" | "list";

const PAGE_SIZE = 6;

function smartTruncate(text: string, maxLen: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;

  const slice = trimmed.slice(0, maxLen);

  const lastSentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf(".\n")
  );

  if (lastSentenceEnd > maxLen * 0.4) {
    return slice.slice(0, lastSentenceEnd + 1);
  }

  const lastSpace = slice.lastIndexOf(" ");
  return `${slice.slice(0, lastSpace > 0 ? lastSpace : maxLen)}...`;
}

function formatBytes(bytes: number | null) {
  if (!bytes && bytes !== 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgeBasePage() {
  return (
    <Suspense fallback={null}>
      <KnowledgeBasePageInner />
    </Suspense>
  );
}

function KnowledgeBasePageInner() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [settings, setSettings] = useState<SettingsPayload | null>(null);
  const [reindexingId, setReindexingId] = useState<number | null>(null);
  const { confirm, notify } = useDialog();
  const aiProvider = useAIProviderStatus();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stuckSinceRef = useRef<Map<number, number>>(new Map());
  const autoRetriedRef = useRef<Set<number>>(new Set());

  const fileTypes = useMemo(
    () => Array.from(new Set(documents.map((d) => d.file_type).filter(Boolean))) as string[],
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    let result = documents.filter((doc) =>
      doc.filename.toLowerCase().includes(search.trim().toLowerCase())
    );

    if (typeFilter !== "all") {
      result = result.filter((doc) => doc.file_type === typeFilter);
    }

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return a.filename.localeCompare(b.filename);
        case "chunks":
          return b.chunks - a.chunks;
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [documents, search, typeFilter, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / PAGE_SIZE));
  const pagedDocuments = filteredDocuments.slice(
    (page - 1) * PAGE_SIZE,
    (page - 1) * PAGE_SIZE + PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, sortKey]);

  function loadDocuments() {
    setLoading(true);
    getDocuments()
      .then((docs) => setDocuments(docs))
      .catch((err) =>
        notify(err instanceof Error ? err.message : "Failed to load documents.", "error")
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadDocuments();
    getSettings()
      .then(setSettings)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const STUCK_RETRY_MS = 8000;

  useEffect(() => {
    const stuckDocs = documents.filter((doc) => doc.chunks === 0);
    if (stuckDocs.length === 0) return;

    const now = Date.now();
    for (const doc of stuckDocs) {
      if (!stuckSinceRef.current.has(doc.id)) {
        stuckSinceRef.current.set(doc.id, now);
        continue;
      }

      const stuckSince = stuckSinceRef.current.get(doc.id)!;
      if (
        settings?.auto_reindex_stuck &&
        !autoRetriedRef.current.has(doc.id) &&
        now - stuckSince >= STUCK_RETRY_MS
      ) {
        autoRetriedRef.current.add(doc.id);
        reindexDocument(doc.id)
          .then(() => notify(`Auto re-indexing "${doc.filename}"...`, "info"))
          .catch(() => {});
      }
    }

    const interval = setInterval(() => {
      getDocuments()
        .then(setDocuments)
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents, settings?.auto_reindex_stuck]);

  async function handleReindex(id: number, filename: string) {
    setReindexingId(id);
    try {
      await reindexDocument(id);
      notify(`Re-indexing "${filename}"...`, "success");
      loadDocuments();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to re-index document.", "error");
    } finally {
      setReindexingId(null);
    }
  }

  async function handleDelete(id: number, filename: string) {
    const confirmed = await confirm({
      title: "Delete document",
      message: `This will permanently remove "${filename}" and its indexed chunks.`,
      confirmLabel: "Delete",
      danger: true,
    });

    if (!confirmed) return;

    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      notify("Document deleted.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete document.", "error");
    }
  }

  async function handleDownload(id: number, filename: string) {
    try {
      await downloadDocument(id, filename);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to download document.", "error");
    }
  }

  function renderActions(doc: DocumentItem, status: string) {
    return (
      <>
        {status === "Processing" && (
          <button
            onClick={() => handleReindex(doc.id, doc.filename)}
            disabled={reindexingId === doc.id}
            title="Re-index"
            className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className={`h-4 w-4 ${reindexingId === doc.id ? "animate-spin" : ""}`}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        )}

        <button
          onClick={() => router.push(`/knowledge-base/${doc.id}`)}
          title="View details"
          className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={() => router.push(`/chat?doc=${doc.id}`)}
          title={`Ask AI about ${doc.filename}`}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.5-1.185C3.766 16.505 3 14.795 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Ask AI
        </button>

        <button
          onClick={() => handleDownload(doc.id, doc.filename)}
          title="Download"
          className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v1.5A2.25 2.25 0 005.25 20.25h13.5A2.25 2.25 0 0021 18v-1.5M7.5 12L12 16.5m0 0L16.5 12M12 16.5V3" />
          </svg>
        </button>

        <button
          onClick={() => handleDelete(doc.id, doc.filename)}
          title="Delete"
          className="flex shrink-0 items-center justify-center rounded-xl border border-red-200 dark:border-red-900 p-2 text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.166L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </>
    );
  }

  return (
    <div className="space-y-8">
      {!loading && documents.length > 0 && (
        <div className="flex flex-nowrap items-center justify-end gap-3 overflow-x-auto">
          <div className="flex shrink-0 flex-nowrap items-center gap-3">
          {/* <div className="relative w-48 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.75}
              stroke="currentColor"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </div> */}

          {fileTypes.length > 1 && (
            <div className="relative shrink-0">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-3 pr-9 text-sm text-gray-600 dark:text-gray-300 shadow-sm outline-none"
              >
                <option value="all">All types</option>
                {fileTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          )}

          <div className="relative shrink-0">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="w-full appearance-none rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-3 pr-9 text-sm text-gray-600 dark:text-gray-300 shadow-sm outline-none"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name">Name (A-Z)</option>
              <option value="chunks">Most chunks</option>
            </select>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <button
            onClick={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
            title={viewMode === "grid" ? "Switch to list view" : "Switch to grid view"}
            className="flex shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2.5 text-gray-500 dark:text-gray-400 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {viewMode === "grid" ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center shadow-sm text-gray-500 dark:text-gray-400">
          Loading documents...
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-14 text-center">
          <div className="text-5xl">📂</div>

          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {aiProvider.loading || aiProvider.connected
              ? "No documents found"
              : "Your knowledge base is empty"}
          </h2>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {aiProvider.loading || aiProvider.connected
              ? "Upload your first PDF or DOCX document."
              : "Configure an AI provider, then upload documents to start building your knowledge base."}
          </p>

          {!aiProvider.loading && !aiProvider.connected && (
            <Link
              href="/settings/model-provider"
              className="mt-5 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
            >
              Configure Now
            </Link>
          )}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-14 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            No matching documents
          </h2>

          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Try a different search term or filter.
          </p>
        </div>
      ) : (
        <>
          <div
            className={
              viewMode === "grid"
                ? "grid gap-5 md:grid-cols-2 xl:grid-cols-3"
                : "flex flex-col gap-3"
            }
          >
            {pagedDocuments.map((doc) => {
              const status = doc.chunks > 0 ? "Indexed" : "Processing";

              if (viewMode === "list") {
                return (
                  <div
                    key={doc.id}
                    className="flex flex-wrap items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm"
                  >
                    <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {doc.file_type ?? "file"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2
                        onClick={() => router.push(`/knowledge-base/${doc.id}`)}
                        className="cursor-pointer truncate text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                      >
                        {doc.filename}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {doc.chunks} chunks · {formatBytes(doc.size_bytes)}
                        {doc.page_count != null ? ` · ${doc.page_count} pages` : ""} ·{" "}
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        status === "Indexed"
                          ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {status}
                    </span>

                    <div className="flex shrink-0 items-center gap-2">
                      {renderActions(doc, status)}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={doc.id}
                  className="group rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {doc.file_type ?? "file"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        status === "Indexed"
                          ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {status}
                    </span>
                  </div>

                  <h2
                    onClick={() => router.push(`/knowledge-base/${doc.id}`)}
                    className="mt-4 line-clamp-2 cursor-pointer text-lg font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                  >
                    {doc.filename}
                  </h2>

                  {doc.preview && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {smartTruncate(doc.preview, 160)}
                    </p>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <p>
                      <strong>Chunks:</strong> {doc.chunks}
                    </p>
                    <p>
                      <strong>Size:</strong> {formatBytes(doc.size_bytes)}
                    </p>
                    {doc.page_count != null && (
                      <p>
                        <strong>Pages:</strong> {doc.page_count}
                      </p>
                    )}
                    <p className="col-span-2">
                      <strong>Uploaded:</strong>{" "}
                      {doc.created_at ? new Date(doc.created_at).toLocaleString() : "Unknown"}
                    </p>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    {renderActions(doc, status)}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 shadow-sm transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
