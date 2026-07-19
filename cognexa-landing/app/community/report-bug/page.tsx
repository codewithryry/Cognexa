"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { REPO_URL } from "@/lib/constants";

export default function ReportBug() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 sm:py-24 lg:grid-cols-2 lg:items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-slate-500">
            <Link href="/community" className="hover:text-gray-900 dark:hover:text-white">
              Community
            </Link>{" "}
            / Report a Bug
          </p>

          <h1 className="mt-3 bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-4xl font-bold leading-tight text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
            Found a bug?
          </h1>
          <p className="mt-5 max-w-md text-lg text-gray-600 dark:text-slate-400">
            The fastest way to get a bug fixed is to file it directly on
            GitHub, where the team triages issues.
          </p>

          <a
            href={`${REPO_URL}/issues/new`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Open a GitHub issue →
          </a>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Or describe it here
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-500">
            Prefer not to use GitHub? Send the details this way instead.
          </p>

          {submitted ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              Thanks — we&apos;ve received your report and will follow up if we
              need more detail.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  <span className="text-red-500">*</span>Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="Email"
                  className="mt-1.5 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  <span className="text-red-500">*</span>What happened?
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="What did you expect to happen, and what happened instead?"
                  className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  Steps to reproduce
                </label>
                <textarea
                  rows={3}
                  placeholder="1. Go to...  2. Click on...  3. See error"
                  className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
                >
                  Submit report
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200 px-6 py-8 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row dark:text-slate-500">
          <span>© {new Date().getFullYear()} Cognexa. Self-hosted RAG platform. </span>
        </div>
      </footer>
    </main>
  );
}
