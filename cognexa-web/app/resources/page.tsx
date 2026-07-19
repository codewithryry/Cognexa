"use client";

import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import ComingSoonBadge from "@/components/ComingSoonBadge";

const RESOURCE_CARDS = [
  {
    title: "Basics",
    description: "A beginner-friendly hub for what Cognexa is and how it works.",
    href: "/resources/basics",
    emoji: "🌱",
    comingSoon: false,
  },
  {
    title: "Blog",
    description: "Product updates, engineering deep dives, and customer stories.",
    href: "/resources/blog",
    emoji: "✍️",
    comingSoon: true,
  },
  {
    title: "Changelog",
    description: "Version history and release notes, pulled live from GitHub.",
    href: "/docs/releases",
    emoji: "📋",
    comingSoon: false,
  },
  {
    title: "Roadmap",
    description: "What's planned, in progress, and recently shipped.",
    href: "/resources/roadmap",
    emoji: "🗺️",
    comingSoon: true,
  },
  {
    title: "Status",
    description: "Live status for hosted services.",
    href: "/resources/status",
    emoji: "🟢",
    comingSoon: true,
  },
  {
    title: "Contact Support",
    description: "Support channels and a direct line to the team.",
    href: "/resources/contact-support",
    emoji: "🎧",
    comingSoon: false,
  },
];

const DOCS_LINKS = [
  { label: "Quickstart", href: "/docs" },
  { label: "User guides", href: "/docs/user-guides" },
  { label: "Administrator guides", href: "/docs/admin-guides" },
  { label: "Developer guides", href: "/docs/developer-guides" },
  { label: "References", href: "/docs/references" },
  { label: "FAQs", href: "/docs/faqs" },
];

export default function Resources() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
            Resources
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
            Everything to learn, build with, and get help from Cognexa in one
            place.
          </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {RESOURCE_GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {group.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {group.description}
              </p>

              <ul className="mt-5 space-y-2.5 border-t border-gray-100 pt-5 dark:border-white/10">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {link.label} →
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-20 rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-10 text-center shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:via-white/[0.02] dark:to-fuchsia-500/10 dark:shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Still have questions?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            Reach out and the team will help you find the right resource, or
            walk you through a demo.
          </p>

          <div className="mt-7">
            <Link
              href="/contact"
              className="inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Contact us →
            </Link>
          </div>
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
