"use client";

import { useEffect, useRef, useState } from "react";
import { getBillingPlan, getDocuments, PlanPayload, uploadDocument } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import DemoCheckoutModal from "@/components/DemoCheckoutModal";

interface UploadResult {
  filename: string;
  characters: number;
  chunks_saved: number;
  preview: string;
}

interface RecentDocument {
  id: number;
  filename: string;
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [recentUploads, setRecentUploads] = useState<RecentDocument[]>([]);
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useDialog();

  function loadRecentUploads() {
    getDocuments()
      .then((docs) => setRecentUploads(docs.slice(0, 5)))
      .catch(() => {});
  }

  function loadPlan() {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
  }

  useEffect(() => {
    loadRecentUploads();
    loadPlan();
  }, []);

  const atDocumentLimit =
    plan?.max_documents != null && plan.document_count >= plan.max_documents;
  const atStorageLimit =
    plan?.max_storage_bytes != null && plan.storage_bytes >= plan.max_storage_bytes;
  const limitReached = atDocumentLimit || atStorageLimit;

  function isValidFile(file: File) {
    return ALLOWED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
  }

  function pickFile(file: File) {
    if (!isValidFile(file)) {
      notify("Only PDF, DOCX, JPG and PNG files are supported.", "error");
      return;
    }
    if (limitReached) {
      notify("You've reached your plan's limit. Upgrade to upload more.", "error");
      return;
    }
    setSelectedFile(file);
    setResult(null);
  }

  async function handleUpload() {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setProgress(15);

      const progressTimer = setInterval(() => {
        setProgress((p) => (p < 85 ? p + 10 : p));
      }, 200);

      const response = await uploadDocument(selectedFile);

      clearInterval(progressTimer);
      setProgress(100);

      setResult(response);
      setSelectedFile(null);
      loadRecentUploads();
      loadPlan();

      notify("Document uploaded successfully!", "success");
    } catch (error) {
      console.error(error);
      notify(
        error instanceof Error ? error.message : "Upload failed. Please try again.",
        "error"
      );
      loadPlan();
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 600);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      pickFile(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-8">
      {limitReached && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You&apos;ve reached your Community plan limit. Manage your plan in Settings to
            upload more.
          </p>
          <button
            onClick={() => setCheckoutOpen(true)}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:shadow-md"
          >
            Upgrade to Pro
          </button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !limitReached && !selectedFile && fileInputRef.current?.click()}
        className={`group cursor-pointer rounded-2xl border-2 border-dashed p-14 text-center transition ${
          limitReached
            ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900/50"
            : dragActive
            ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10"
            : "border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-gray-900 hover:border-indigo-400 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5"
        }`}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl shadow-lg shadow-indigo-500/30">
          📤
        </div>

        <h2 className="mt-5 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {selectedFile ? selectedFile.name : "Drag & Drop Files Here"}
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {selectedFile
            ? `${(selectedFile.size / 1024).toFixed(1)} KB — click Upload to continue`
            : "or click anywhere to browse (PDF, DOCX, JPG, PNG)"}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) pickFile(e.target.files[0]);
          }}
        />

        {uploading && (
          <div className="mx-auto mt-6 h-2 w-full max-w-xs overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="mt-6 flex justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          {selectedFile && !uploading && (
            <button
              onClick={() => setSelectedFile(null)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || limitReached}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-3 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>

      {checkoutOpen && (
        <DemoCheckoutModal
          plan="pro"
          price="$19/month"
          onClose={() => setCheckoutOpen(false)}
          onSubscribed={() => {
            setCheckoutOpen(false);
            loadPlan();
          }}
        />
      )}

      {result && (
        <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-green-700 dark:text-green-400">
            Uploaded
          </h2>

          <div className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
            <p>
              <strong>Filename:</strong> {result.filename}
            </p>

            <p>
              <strong>Characters:</strong> {result.characters}
            </p>

            <p>
              <strong>Chunks Saved:</strong> {result.chunks_saved}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              Preview
            </h3>

            <div className="max-h-64 overflow-auto rounded-xl bg-gray-100 dark:bg-gray-800 p-4 text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
              {result.preview.slice(0, 600)}
              {result.preview.length > 600 && "…"}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Recent Uploads
        </h2>

        {recentUploads.length === 0 ? (
          <p className="text-sm text-gray-400">No uploads yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentUploads.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition hover:border-indigo-200 dark:hover:border-indigo-700 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5"
              >
                <span className="text-lg">📄</span>
                {doc.filename}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
