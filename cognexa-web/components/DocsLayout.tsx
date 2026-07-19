"use client";

import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { REPO_URL } from "@/lib/constants";

export { REPO_URL };

export const DOCS_SIDEBAR = [
  { name: "Releases", href: "/docs/releases" },
  { name: "Quickstart", href: "/docs" },
  { name: "User guides", href: "/docs/user-guides" },
  { name: "Administrator guides", href: "/docs/admin-guides" },
  { name: "Developer guides", href: "/docs/developer-guides" },
  { name: "References", href: "/docs/references" },
  { name: "FAQs", href: "/docs/faqs" },
];

export function DocsCrumb({ label }: { label: string }) {
  return (
    <p className="text-sm text-gray-500 dark:text-slate-500">
      <Link href="/docs" className="hover:text-gray-900 dark:hover:text-white">
        Docs
      </Link>{" "}
      / {label}
    </p>
  );
}

export function DocsHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mt-10 scroll-mt-24 text-xl font-semibold text-gray-900 dark:text-white">
      {children}
    </h2>
  );
}

export function DocsParagraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-gray-600 dark:text-slate-400">{children}</p>;
}

export function DocsList({ children }: { children: React.ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1.5 pl-5 text-gray-600 dark:text-slate-400">{children}</ul>;
}

export default function DocsLayout({
  activeHref,
  toc,
  children,
}: {
  activeHref: string;
  toc: { id: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[220px_1fr_200px]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            {DOCS_SIDEBAR.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2 font-medium transition ${
                  item.href === activeHref
                    ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
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
