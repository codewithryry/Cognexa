"use client";

import { useState } from "react";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { BASICS_ARTICLES } from "@/lib/basicsData";

export default function BasicsLayout({
  activeSlug,
  toc,
  children,
}: {
  activeSlug?: string;
  toc: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  const [query, setQuery] = useState("");

  const filtered = BASICS_ARTICLES.filter((article) =>
    article.title.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[240px_1fr_200px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <p className="text-sm text-gray-500 dark:text-slate-500">
              <Link href="/resources/basics" className="hover:text-gray-900 dark:hover:text-white">
                Basics
              </Link>
            </p>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search articles..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:bg-white/[0.03] dark:focus:border-indigo-400/60"
            />

            <nav className="space-y-1 text-sm">
              {filtered.map((article) => (
                <Link
                  key={article.slug}
                  href={`/resources/basics/${article.slug}`}
                  className={`block rounded-lg px-3 py-2 font-medium transition ${
                    article.slug === activeSlug
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  {article.title}
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-500 dark:text-slate-500">No articles match.</p>
              )}
            </nav>
          </div>
        </aside>

        <article className="min-w-0">{children}</article>

        <aside className="hidden lg:block">
          <div className="sticky top-24 text-sm">
            <p className="font-semibold text-gray-900 dark:text-white">On this page</p>
            <nav className="mt-3 space-y-2 border-l border-gray-200 dark:border-white/10">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block border-l-2 border-transparent py-0.5 pl-3 text-gray-500 transition hover:border-indigo-400 hover:text-gray-900 dark:text-slate-500 dark:hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>
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
