"use client";

import Link from "next/link";
import BasicsLayout from "@/components/BasicsLayout";
import { BASICS_ARTICLES } from "@/lib/basicsData";

export default function Basics() {
  return (
    <BasicsLayout toc={[]}>
      <p className="text-sm text-gray-500 dark:text-slate-500">
        <Link href="/resources" className="hover:text-gray-900 dark:hover:text-white">
          Resources
        </Link>{" "}
        / Basics
      </p>

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Basics</h1>
      <p className="mt-3 text-gray-600 dark:text-slate-400">
        A beginner-friendly introduction to Cognexa and the ideas behind it — separate
        from the technical documentation. Start anywhere.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {BASICS_ARTICLES.map((article) => (
          <Link
            key={article.slug}
            href={`/resources/basics/${article.slug}`}
            className="rounded-2xl border border-gray-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-transparent"
          >
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {article.title}
            </h3>
            <p className="mt-1.5 text-sm text-gray-600 dark:text-slate-400">
              {article.summary}
            </p>
          </Link>
        ))}
      </div>
    </BasicsLayout>
  );
}
