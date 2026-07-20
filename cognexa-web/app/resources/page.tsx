"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import GithubStars from "@/components/GithubStars";
import MarketingFooter from "@/components/MarketingFooter";
import { REPO_URL } from "@/components/DocsLayout";

const RESOURCE_GROUPS = [
  {
    title: "Documentation",
    description: "Quickstarts and guides for using and administering Cognexa.",
    links: [
      { label: "Quickstart", href: "/docs" },
      { label: "User guides", href: "/docs/user-guides" },
      { label: "Administrator guides", href: "/docs/admin-guides" },
      { label: "Developer guides", href: "/docs/developer-guides" },
      { label: "References", href: "/docs/references" },
      { label: "FAQs", href: "/docs/faqs" },
    ],
  },
  {
    title: "Releases & Source",
    description: "Track what shipped, or read the code directly.",
    links: [
      { label: "Release notes", href: "/docs/releases" },
      { label: "GitHub repository", href: REPO_URL, external: true },
      { label: "Issues & feature requests", href: `${REPO_URL}/issues`, external: true },
    ],
  },
  {
    title: "Get in touch",
    description: "Talk to the team about plans, self-hosting, or a demo.",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Community", href: "/community" },
    ],
  },
];

export default function Resources() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <nav className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/70 backdrop-blur-md dark:border-white/5 dark:bg-[#0b0b14]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
                C
              </span>
              <span className="text-lg font-semibold">Cognexa</span>
            </Link>

            <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 dark:text-slate-400 lg:flex">
              <Link href="/docs" className="transition hover:text-gray-900 dark:hover:text-white">
                Docs
              </Link>
              <Link href="/solutions" className="transition hover:text-gray-900 dark:hover:text-white">
                Solutions
              </Link>
              <Link href="/resources" className="text-gray-900 transition dark:text-white">
                Resources
              </Link>
              <Link href="/community" className="transition hover:text-gray-900 dark:hover:text-white">
                Community
              </Link>
              <Link href="/#pricing" className="transition hover:text-gray-900 dark:hover:text-white">
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <GithubStars />

            <Link
              href="/contact"
              className="hidden text-sm font-medium text-gray-600 transition hover:text-gray-900 sm:inline dark:text-slate-400 dark:hover:text-white"
            >
              Contact us
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

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

      <MarketingFooter />
    </main>
  );
}
