import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import ComingSoonBadge from "@/components/ComingSoonBadge";

export default function ComingSoonPage({
  crumb,
  emoji,
  title,
  description,
}: {
  crumb: string;
  emoji: string;
  title: string;
  description: string;
}) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-500">
          <Link href="/resources" className="hover:text-gray-900 dark:hover:text-white">
            Resources
          </Link>{" "}
          / {crumb}
        </p>

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl text-white shadow-md shadow-indigo-500/20">
          {emoji}
        </div>

        <div className="mt-5 flex justify-center">
          <ComingSoonBadge />
        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-600 dark:text-slate-400">
          {description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/resources"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Back to Resources
          </Link>
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
