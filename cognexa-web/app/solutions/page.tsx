"use client";

import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { SOLUTIONS } from "@/lib/solutionsData";

const AVAILABLE_SOLUTIONS = SOLUTIONS.filter((solution) => !solution.comingSoon);

export default function Solutions() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
            Solutions
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
            What Cognexa can do for your team today, and what we&apos;re
            building next.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {AVAILABLE_SOLUTIONS.map((solution) => (
            <Link
              key={solution.slug}
              href={`/solutions/${solution.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-transparent dark:hover:shadow-indigo-500/20"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 opacity-0 transition group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 group-hover:opacity-100 dark:group-hover:from-indigo-500/10 dark:group-hover:to-fuchsia-500/10" />

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {solution.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {solution.tagline}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-slate-500">
          Also building{" "}
          <Link
            href="/solutions/ai-customer-support"
            className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            AI Customer Support
          </Link>
          .
        </p>
      </div>

      <MarketingFooter />
    </main>
  );
}
