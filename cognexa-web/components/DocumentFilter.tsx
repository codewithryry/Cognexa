"use client";

import { useEffect, useRef, useState } from "react";
import { getDocuments } from "@/lib/api";

interface DocOption {
  id: number;
  filename: string;
}

interface DocumentFilterProps {
  /** Document ids to search. Empty array means "search the whole knowledge base". */
  selected: number[];
  onChange: (ids: number[]) => void;
}

export default function DocumentFilter({ selected, onChange }: DocumentFilterProps) {
  const [open, setOpen] = useState(false);
  const [documents, setDocuments] = useState<DocOption[]>([]);
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
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // selected=[] is the default "search everything" state, so every document
  // reads as checked until the user explicitly unchecks one.
  const isIncluded = (id: number) => selected.length === 0 || selected.includes(id);
  const allIncluded = selected.length === 0;
  const excludedCount = documents.length - selected.length;

  function toggleDoc(id: number) {
    if (selected.length === 0) {
      // Currently searching everything — unchecking one excludes just that doc.
      onChange(documents.filter((d) => d.id !== id).map((d) => d.id));
      return;
    }

    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      const next = [...selected, id];
      // Re-included everything that was excluded — collapse back to "all".
      onChange(next.length === documents.length ? [] : next);
    }
  }

  const label = allIncluded
    ? "All Documents"
    : selected.length === 0
    ? "No documents"
    : `${selected.length} of ${documents.length} documents`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        title={label}
        className="flex items-center justify-center rounded-full p-2 text-gray-500 dark:text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
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
            d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.122 2.122l7.81-7.81"
          />
        </svg>
        {!allIncluded && (
          <span className="ml-1 text-xs font-medium">{selected.length}</span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 bottom-full z-20 mb-2 w-72 animate-fade-in rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-xl">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Search scope
            </h3>
            {excludedCount > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Select all
              </button>
            )}
          </div>

          <p className="px-3 pb-1 text-xs text-gray-400">
            All documents are searched by default — uncheck any that don&apos;t belong.
          </p>

          <div className="max-h-64 overflow-y-auto">
            {documents.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-gray-400">
                No documents uploaded yet.
              </p>
            ) : (
              documents.map((doc) => (
                <label
                  key={doc.id}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <input
                    type="checkbox"
                    checked={isIncluded(doc.id)}
                    onChange={() => toggleDoc(doc.id)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-400"
                  />
                  <span className="truncate text-gray-700 dark:text-gray-300">
                    {doc.filename}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
