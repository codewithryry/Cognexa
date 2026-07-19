import { notFound } from "next/navigation";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import ComingSoonBadge from "@/components/ComingSoonBadge";
import { COMMUNITY_CHANNELS, getCommunityChannel } from "@/lib/communityData";
import { REPO_URL } from "@/lib/constants";

export function generateStaticParams() {
  return COMMUNITY_CHANNELS.map((channel) => ({ slug: channel.slug }));
}

export default async function CommunityChannelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const channel = getCommunityChannel(slug);

  if (!channel) {
    notFound();
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <MarketingNav />

      <div className="mx-auto max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-500">
          <Link href="/community" className="hover:text-gray-900 dark:hover:text-white">
            Community
          </Link>{" "}
          / {channel.title}
        </p>

        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl text-white shadow-md shadow-indigo-500/20">
          {channel.emoji}
        </div>

        <div className="mt-5 flex justify-center">
          <ComingSoonBadge />
        </div>

        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">{channel.title}</h1>
        <p className="mt-2 text-gray-600 dark:text-slate-400">{channel.tagline}</p>

        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-gray-600 dark:text-slate-400">
          {channel.description}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Visit GitHub →
          </a>
          <Link
            href="/community"
            className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/10"
          >
            Back to Community
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
