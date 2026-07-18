"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { deleteDocument, downloadDocument, getDocument, reindexDocument } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

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

function formatBytes(bytes: number | null) {
  if (!bytes && bytes !== 0) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { confirm, notify } = useDialog();
  const [doc, setDoc] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = Number(params?.id);

  useEffect(() => {
    if (Number.isNaN(id)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    getDocument(id)
      .then(setDoc)
      .catch((err) => {
        if (err?.status === 404) setNotFound(true);
        else notify(err instanceof Error ? err.message : "Failed to load document.", "error");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleReindex() {
    if (!doc) return;
    setReindexing(true);
    try {
      await reindexDocument(doc.id);
      notify(`Re-indexing "${doc.filename}"...`, "success");
      const refreshed = await getDocument(doc.id);
      setDoc(refreshed);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to re-index document.", "error");
    } finally {
      setReindexing(false);
    }
  }

  async function handleDownload() {
    if (!doc) return;
    try {
      await downloadDocument(doc.id, doc.filename);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to download document.", "error");
    }
  }

  async function handleDelete() {
    if (!doc) return;
    const confirmed = await confirm({
      title: "Delete document",
      message: `This will permanently remove "${doc.filename}" and its indexed chunks.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteDocument(doc.id);
      notify("Document deleted.", "success");
      router.push("/knowledge-base");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete document.", "error");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white dark:bg-gray-900 p-10 text-center shadow-sm text-gray-500 dark:text-gray-400">
        Loading document...
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-14 text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Document not found
        </h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          It may have been deleted, or the link is no longer valid.
        </p>
        <button
          onClick={() => router.push("/knowledge-base")}
          className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
        >
          Back to Dataset
        </button>
      </div>
    );
  }

  const status = doc.chunks > 0 ? "Indexed" : "Processing";

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/knowledge-base")}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:text-gray-900 dark:hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Dataset
      </button>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {doc.file_type ?? "file"}
              </span>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  status === "Indexed"
                    ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                    : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                {status}
              </span>
            </div>
            <h1 className="mt-2 break-words text-xl font-semibold text-gray-900 dark:text-gray-100">
              {doc.filename}
            </h1>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {status === "Processing" && (
              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                  className={`h-4 w-4 ${reindexing ? "animate-spin" : ""}`}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Re-index
              </button>
            )}
            <button
              onClick={() => router.push(`/chat?doc=${doc.id}`)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm shadow-indigo-500/20 transition hover:shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4 shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm3.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.5-1.185C3.766 16.505 3 14.795 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Ask AI
            </button>
            <button
              onClick={handleDownload}
              title="Download"
              className="flex items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v1.5A2.25 2.25 0 005.25 20.25h13.5A2.25 2.25 0 0021 18v-1.5M7.5 12L12 16.5m0 0L16.5 12M12 16.5V3" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete"
              className="flex items-center justify-center rounded-xl border border-red-200 dark:border-red-900 p-2 text-red-600 dark:text-red-400 transition hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.166L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-3">
          <span>
            <strong className="block text-xs text-gray-400">Type</strong>
            {(doc.file_type ?? "file").toUpperCase()}
          </span>
          <span>
            <strong className="block text-xs text-gray-400">Status</strong>
            {status}
          </span>
          <span>
            <strong className="block text-xs text-gray-400">Size</strong>
            {formatBytes(doc.size_bytes)}
          </span>
          {doc.page_count != null && (
            <span>
              <strong className="block text-xs text-gray-400">Pages</strong>
              {doc.page_count}
            </span>
          )}
          <span>
            <strong className="block text-xs text-gray-400">Chunks</strong>
            {doc.chunks}
          </span>
          <span>
            <strong className="block text-xs text-gray-400">Uploaded</strong>
            {doc.created_at ? new Date(doc.created_at).toLocaleString() : "Unknown"}
          </span>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Extracted Content Preview
          </p>
          <div className="whitespace-pre-wrap rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-700 dark:text-gray-300">
            {doc.preview || "No preview available for this document."}
          </div>
        </div>
      </div>
    </div>
  );
}
