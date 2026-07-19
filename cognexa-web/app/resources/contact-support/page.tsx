import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { REPO_URL } from "@/lib/constants";

const CHANNELS = [
  {
    title: "GitHub Issues",
    description: "Bug reports and technical issues, triaged by the team.",
    href: `${REPO_URL}/issues`,
    emoji: "🐙",
  },
  {
    title: "Documentation",
    description: "Setup, administration, and troubleshooting guides.",
    href: "/docs",
    emoji: "📖",
  },
  {
    title: "Email",
    description: "hello@cognexa.io for anything else.",
    href: "mailto:hello@cognexa.io",
    emoji: "✉️",
  },
];

export default function ContactSupport() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-sm text-gray-500 dark:text-slate-500">
          <Link href="/resources" className="hover:text-gray-900 dark:hover:text-white">
            Resources
          </Link>{" "}
          / Contact Support
        </p>

        <h1 className="mt-3 bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
          Contact Support
        </h1>

        <p className="mt-4 max-w-xl text-gray-600 dark:text-slate-400">
          Get help through our documentation, GitHub issues, or direct email support.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {CHANNELS.map((channel) => (
            <a
              key={channel.title}
              href={channel.href}
              target={channel.href.startsWith("http") ? "_blank" : undefined}
              rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-transparent dark:hover:shadow-indigo-500/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl text-white shadow-md shadow-indigo-500/20 transition group-hover:scale-110">
                {channel.emoji}
              </div>

              <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
                {channel.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {channel.description}
              </p>
            </a>
          ))}
        </div>
      </div>

      <footer className="border-t border-gray-200 px-6 py-8 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row dark:text-slate-500">
          <span>© {new Date().getFullYear()} Cognexa. Self-hosted RAG platform.</span>
          <span>Built with Next.js, FastAPI, ChromaDB & Ollama.</span>
        </div>
      </footer>
    </main>
  );
}