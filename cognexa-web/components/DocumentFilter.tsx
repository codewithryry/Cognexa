"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getDocuments } from "@/lib/api";

interface DocOption {
  id: number;
  filename: string;
}

interface DocumentFilterProps {
  /** Document ids to search. Empty array means "search the whole knowledge base". */
  selected: number[];
  onChange: (ids: number[]) => void;
  /** Open the panel upward instead of downward — for triggers near the bottom of the viewport. */
  openUpward?: boolean;
  /** Smaller trigger button, for tight toolbars like the chat composer. */
  compact?: boolean;
}

export default function DocumentFilter({ selected, onChange, openUpward, compact }: DocumentFilterProps) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<DocOption[]>([]);
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<number[]>(selected);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getDocuments()
      .then((docs) => setDocuments(docs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setPending(selected);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selected]);

  function openPanel() {
    setPending(selected);
    setSearch("");
    setOpen(true);
  }

  // pending=[] is the default "search everything" state, so every document
  // reads as checked until the user explicitly unchecks one.
  const isPendingIncluded = (id: number) => pending.length === 0 || pending.includes(id);
  const pendingAllIncluded = pending.length === 0;

  function togglePendingDoc(id: number) {
    if (pending.length === 0) {
      // Currently searching everything — unchecking one excludes just that doc.
      setPending(documents.filter((d) => d.id !== id).map((d) => d.id));
      return;
    }

    if (pending.includes(id)) {
      setPending(pending.filter((x) => x !== id));
    } else {
      const next = [...pending, id];
      // Re-included everything that was excluded — collapse back to "all".
      setPending(next.length === documents.length ? [] : next);
    }
  }

  function applyAndClose() {
    onChange(pending);
    setOpen(false);
    setSearch("");
  }

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) =>
        doc.filename.toLowerCase().includes(search.trim().toLowerCase())
      ),
    [documents, search]
  );

  const allIncluded = selected.length === 0;
  const label = allIncluded
    ? "All Documents"
    : selected.length === 0
    ? "No documents"
    : `${selected.length} of ${documents.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={
          compact
            ? "flex items-center gap-1.5 whitespace-nowrap rounded-full py-1.5 pl-3 pr-2 text-xs font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-100 dark:hover:bg-gray-800"
            : "flex h-11 items-center gap-1.5 whitespace-nowrap rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.75}
          stroke="currentColor"
          className="h-4 w-4 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m1 5H8a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>{allIncluded ? "Select Documents" : label}</span>
      </button>

      {open && (
        <div
          className={`absolute left-0 z-20 w-80 animate-fade-in rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl ${
            openUpward ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Select Documents
              </h3>
              {pending.length > 0 && (
                <button
                  onClick={() => setPending([])}
                  className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Select all
                </button>
              )}
            </div>

            <p className="mb-2 text-xs text-gray-400">
              All documents are searched by default — uncheck any that don&apos;t belong.
            </p>

            <div className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto px-2">
            {documents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">
                No documents uploaded yet.
              </p>
            ) : filteredDocuments.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">
                No documents match &quot;{search}&quot;.
              </p>
            ) : (
              filteredDocuments.map((doc) => (
                <label
                  key={doc.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={isPendingIncluded(doc.id)}
                    onChange={() => togglePendingDoc(doc.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                  />
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {doc.filename}
                  </span>
                </label>
              ))
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800 p-3">
            <span className="text-xs text-gray-400">
              {pendingAllIncluded ? "All documents" : `${pending.length} selected`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setOpen(false);
                  setPending(selected);
                  setSearch("");
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={applyAndClose}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:shadow-md"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
