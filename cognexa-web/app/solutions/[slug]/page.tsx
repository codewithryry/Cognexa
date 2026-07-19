"use client";

import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import MarketingNav from "@/components/MarketingNav";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import { getSolution } from "@/lib/solutionsData";

export default function SolutionPage() {
  const params = useParams<{ slug: string }>();
  const { user } = useAuth();
  const solution = getSolution(params.slug);

  if (!solution) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm text-gray-500 dark:text-slate-500">
          <Link href="/solutions" className="hover:text-gray-900 dark:hover:text-white">
            Solutions
          </Link>{" "}
          / {solution.title}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
            {solution.title}
          </h1>
          {solution.comingSoon && <ComingSoonBadge />}
        </div>
        <p className="mt-3 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
          {solution.tagline}
        </p>

        <h2 className="mt-12 text-xl font-semibold text-gray-900 dark:text-white">Overview</h2>
        <p className="mt-3 text-gray-600 dark:text-slate-400">{solution.overview}</p>

        <h2 className="mt-12 text-xl font-semibold text-gray-900 dark:text-white">
          {solution.comingSoon ? "Planned highlights" : "Key benefits"}
        </h2>
        <ul className="mt-4 space-y-3">
          {solution.benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2.5 text-gray-600 dark:text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400"
              >
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
              {benefit}
            </li>
          ))}
        </ul>

        <h2 className="mt-12 text-xl font-semibold text-gray-900 dark:text-white">
          {solution.comingSoon ? "Where this will help" : "Common use cases"}
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {solution.useCases.map((use) => (
            <div
              key={use.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{use.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {use.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-10 text-center shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:via-white/[0.02] dark:to-fuchsia-500/10 dark:shadow-xl">
          {solution.comingSoon ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Want to be the first to know?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
                This is in active development. Reach out and we&apos;ll keep you posted as it ships.
              </p>
              <div className="mt-7">
                <Link
                  href="/contact"
                  className="inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Contact us →
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ready to try it yourself?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
                Sign in and start uploading documents — your first indexed answer is minutes away.
              </p>
              <div className="mt-7">
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className="inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {user ? "Go to Home →" : "Get Started →"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="border-t border-gray-200 px-6 py-8 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row dark:text-slate-500">
          <span>© {new Date().getFullYear()} Cognexa. Self-hosted RAG platform. </span>
          <span>Built with Next.js, FastAPI, ChromaDB & Ollama.</span>
        </div>
      </footer>
    </main>
  );
}
