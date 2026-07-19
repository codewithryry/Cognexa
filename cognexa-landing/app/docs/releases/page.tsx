"use client";

import { useEffect, useState } from "react";
import DocsLayout, { DocsCrumb, REPO_URL } from "@/components/DocsLayout";
import Markdown from "@/components/Markdown";

const REPO = "codewithryry/Cognexa";

type Release = {
  id: number;
  tag_name: string;
  name: string | null;
  html_url: string;
  published_at: string;
  body: string | null;
  prerelease: boolean;
  draft: boolean;
};

export default function Releases() {
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`https://api.github.com/repos/${REPO}/releases`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setReleases(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const toc = (releases ?? [])
    .filter((r) => !r.draft)
    .map((r) => ({ id: r.tag_name, label: r.name || r.tag_name }));

  return (
    <DocsLayout activeHref="/docs/releases" toc={toc}>
      <DocsCrumb label="Releases" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Releases</h1>
      <p className="mt-3 text-gray-600 dark:text-slate-400">
        Key features, improvements and bug fixes in the latest releases,
        pulled live from{" "}
        <a
          href={`${REPO_URL}/releases`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:underline dark:text-indigo-400"
        >
          GitHub
        </a>
        .
      </p>

      {error && (
        <p className="mt-6 text-sm text-red-500">
          Couldn&apos;t load releases from GitHub right now. Try again later, or
          view them{" "}
          <a
            href={`${REPO_URL}/releases`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            directly on GitHub
          </a>
          .
        </p>
      )}

      {!error && releases === null && (
        <p className="mt-6 text-sm text-gray-500 dark:text-slate-500">Loading releases…</p>
      )}

      {!error && releases !== null && releases.filter((r) => !r.draft).length === 0 && (
        <p className="mt-6 text-sm text-gray-500 dark:text-slate-500">No releases published yet.</p>
      )}

      <div className="mt-8 space-y-8">
        {releases
          ?.filter((r) => !r.draft)
          .map((r) => (
            <section
              key={r.id}
              id={r.tag_name}
              className="scroll-mt-24 rounded-xl border border-gray-200 p-5 dark:border-white/10"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {r.name || r.tag_name}
                </h2>
                {r.prerelease && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                    Pre-release
                  </span>
                )}
              </div>
              {r.body && <Markdown body={r.body} />}
              <a
                href={r.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View on GitHub →
              </a>
            </section>
          ))}
      </div>
    </DocsLayout>
  );
}
