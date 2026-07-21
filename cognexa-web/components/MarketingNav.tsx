"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import GithubStars from "@/components/GithubStars";
import ThemeToggle from "@/components/ThemeToggle";
import { REPO_URL } from "@/lib/constants";

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 transition group-hover:rotate-180"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const SOLUTIONS_LINKS = [
  { label: "Knowledge Intelligence", href: "/solutions/knowledge-intelligence" },
  { label: "Document Analysis", href: "/solutions/document-analysis" },
  { label: "AI Research", href: "/solutions/ai-research" },
  { label: "AI Customer Support", href: "/solutions/ai-customer-support", comingSoon: true },
];

const RESOURCES_LINKS = [
  { label: "Basics", href: "/resources/basics" },
  { label: "Changelog", href: "/docs/releases" },
    { label: "Contact Support", href: "/resources/contact-support" },
    { label: "Blog", href: "/resources/blog", comingSoon: true },
  { label: "Roadmap", href: "/resources/roadmap", comingSoon: true },
  { label: "Status", href: "/resources/status", comingSoon: true },
];

const COMMUNITY_LINKS = [
  { label: "GitHub", href: REPO_URL, external: true },
    { label: "Report a Bug", href: "/community/report-bug" },
  { label: "Discord", href: "/community/discord", comingSoon: true },
  { label: "Discussions", href: "/community/discussions", comingSoon: true },
  { label: "Feature Requests", href: "/community/feature-requests", comingSoon: true },
];

function NavDropdown({
  label,
  active,
  links,
}: {
  label: string;
  active: boolean;
  links: { label: string; href: string; external?: boolean; comingSoon?: boolean }[];
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className={`flex items-center gap-1 transition hover:text-gray-900 dark:hover:text-white ${
          active ? "text-gray-900 dark:text-white" : ""
        }`}
      >
        {label}
        <Chevron />
      </button>

      <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
        <div className="min-w-[240px] rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-[#12121e]">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              {link.label}
              {link.comingSoon && (
                <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                  Soon
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MarketingNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const docsActive = pathname === "/docs" || pathname.startsWith("/docs/");
  const solutionsActive = pathname === "/solutions" || pathname.startsWith("/solutions/");
  const resourcesActive = pathname === "/resources" || pathname.startsWith("/resources/");
  const communityActive = pathname === "/community" || pathname.startsWith("/community/");

  return (
    <nav className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/70 backdrop-blur-md dark:border-white/5 dark:bg-[#0b0b14]/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/Cognexa.png" alt="Cognexa" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-lg font-semibold">Cognexa</span>
          </Link>

          <div className="hidden items-center gap-6 text-sm font-medium text-gray-600 dark:text-slate-400 lg:flex">
            <Link
              href="/about"
              className={`transition hover:text-gray-900 dark:hover:text-white ${
                pathname === "/about" ? "text-gray-900 dark:text-white" : ""
              }`}
            >
              Overview 
            </Link>
            <Link
              href="/docs"
              className={`transition hover:text-gray-900 dark:hover:text-white ${
                docsActive ? "text-gray-900 dark:text-white" : ""
              }`}
            >
              Docs
            </Link>
            <NavDropdown label="Solutions" active={solutionsActive} links={SOLUTIONS_LINKS} />
            <NavDropdown label="Resources" active={resourcesActive} links={RESOURCES_LINKS} />
            <NavDropdown label="Community" active={communityActive} links={COMMUNITY_LINKS} />
            <Link href="/#pricing" className="transition hover:text-gray-900 dark:hover:text-white">
              Pricing
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <GithubStars />
          <ThemeToggle />

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
  );
}
