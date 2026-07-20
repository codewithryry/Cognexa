"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { REPO_URL } from "@/lib/constants";

const VALUES = [
  {
    title: "AI-Driven Innovation",
    description:
      "We build around Retrieval-Augmented Generation and modern LLMs, so every answer stays grounded in your own knowledge instead of generic guesses.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-2.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    ),
  },
  {
    title: "Privacy First",
    description:
      "Self-hosting is a first-class option, not an afterthought. Your documents and vector store can stay entirely on infrastructure you control.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3 4.5 6v6c0 4.5 3.5 7.5 7.5 9 4-1.5 7.5-4.5 7.5-9V6L12 3Zm-1.5 8.25 1.5 1.5 3-3.5"
      />
    ),
  },
  {
    title: "Simplicity",
    description:
      "Uploading a file and asking a question should feel effortless. We keep the interface minimal so the AI does the heavy lifting, not the user.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4.5 12a7.5 7.5 0 1 1 15 0 7.5 7.5 0 0 1-15 0Zm7.5-4.5v4.5l3 1.5"
      />
    ),
  },
  {
    title: "Collaboration",
    description:
      "Knowledge is more useful when it's shared. Cognexa is built so teams, not just individuals, can search and reason over the same dataset.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    ),
  },
];

const TEAM = [
  { name: "Vincent Nino Acha", photo: null, role: null },
  { name: "Reymel Mislang", photo: "/ReymelMislang.jpg", role: "Full Stack Developer" },
  { name: "Harlyn Nebreja", photo: null, role: null },
  { name: "Darlyd Tupaz", photo: null, role: null },
  { name: "Jenilyn Zaulda", photo: null, role: null },
];

const REASONS = [
  {
    title: "AI-Powered Search",
    description:
      "Ask questions in plain language and get precise answers pulled directly from your own uploaded documents.",
  },
  {
    title: "Retrieval-Augmented Generation (RAG)",
    description:
      "Every answer is grounded in retrieved context from your dataset, cutting down on hallucinated or generic responses.",
  },
  {
    title: "Multi-AI Provider Support",
    description:
      "Stay on the free local model, or connect OpenAI, Anthropic, Gemini, Groq, Mistral, and more — switch providers without switching platforms.",
  },
  {
    title: "Self-Hosted & Cloud Ready",
    description:
      "Run Cognexa entirely on your own machine for full data control, or scale it up in the cloud when your team grows.",
  },
];

function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function Section({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function About() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0a0a0f] dark:text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-300/20 blur-[120px] dark:bg-indigo-600/20" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-fuchsia-300/20 blur-[120px] dark:bg-fuchsia-600/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] dark:opacity-[0.02]" />
      </div>

      <MarketingNav />

      {/* About Cognexa */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <Section className="grid gap-10 sm:grid-cols-2 sm:items-start">
          <div className="order-2 sm:order-1">
            <h1 className="bg-gradient-to-r from-gray-950 via-indigo-600 to-fuchsia-600 bg-clip-text text-5xl font-bold leading-[1.1] text-transparent sm:text-6xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
              An AI knowledge platform built for how you actually work
            </h1>

            <p className="mt-6 max-w-xl text-lg text-gray-600 dark:text-slate-400">
              Cognexa is an AI-powered knowledge management platform that helps
              you organize documents, build searchable knowledge bases, and
              retrieve accurate answers through Retrieval-Augmented Generation
              (RAG) — grounded in your own content, not generic guesses.
            </p>
          </div>

          <div className="order-1 flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 sm:order-2 dark:border-white/15 dark:bg-white/5 dark:text-slate-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="h-10 w-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 8.25v9a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5v-9m-18 0A1.5 1.5 0 0 1 4.5 6.75h15A1.5 1.5 0 0 1 21 8.25m-18 0v.75m18-.75v.75M9 9.75a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z"
              />
            </svg>
          </div>
        </Section>
      </section>

      {/* Our Story / Mission / Vision */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Section className="grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "Our Story",
              body:
                "Cognexa started as a response to a familiar problem: important knowledge scattered across drives, chats, and folders, with no fast way to find it again. We built a single intelligent workspace where documents become searchable, answerable knowledge instead of static files.",
            },
            {
              title: "Our Mission",
              body:
                "Our mission is to simplify knowledge management — helping individuals and teams work more efficiently by putting AI-powered search and retrieval directly on top of the documents they already have.",
            },
            {
              title: "Our Vision",
              body:
                "We're working toward a future where Cognexa is the trusted AI knowledge platform for students, developers, researchers, and organizations — anywhere information needs to be found, not just stored.",
            },
          ].map((block) => (
            <div
              key={block.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {block.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {block.body}
              </p>
            </div>
          ))}
        </Section>
      </section>

{/* Meet Our Team */}
<section className="mx-auto max-w-6xl px-6 pt-8 pb-12"> {/* Changed: py-24 to pt-20 pb-12 */}
  <Section>
    <div className="mb-12 text-center"> {/* Changed: mb-16 to mb-12 */}
      <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
        Meet{" "}
        <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
          our team
        </span>
      </h2>
    </div>

    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
      {TEAM.map((member, index) => (
        <div
          key={member.name}
          className="group flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-none"
          style={{ transitionDelay: `${index * 75}ms` }}
        >
          {member.photo ? (
            <div className="relative aspect-square w-full overflow-hidden rounded-xl">
              <Image
                src={member.photo}
                alt={member.name}
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
          ) : (
            <div className="flex aspect-square w-full items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors group-hover:border-indigo-300 dark:border-white/15 dark:bg-white/5 dark:text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="h-8 w-8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 8.25v9a1.5 1.5 0 0 0 1.5 1.5h15a1.5 1.5 0 0 0 1.5-1.5v-9m-18 0A1.5 1.5 0 0 1 4.5 6.75h15A1.5 1.5 0 0 1 21 8.25m-18 0v.75m18-.75v.75M9 9.75a1.125 1.125 0 1 1-2.25 0 1.125 1.125 0 0 1 2.25 0Z"
                />
              </svg>
            </div>
          )}

          <h3 className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">
            {member.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
            {member.role ?? "Cognexa Team"}
          </p>
        </div>
      ))}
    </div>
  </Section>
</section>

{/* EACOMM */}
<section className="mx-auto max-w-6xl px-6 pt--343 pb-24"> {/* Changed: pt-16 to pt-8 */}
  <Section className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5"> {/* Changed: p-10 to p-8 */}
    <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center"> {/* Changed: gap-8 to gap-6 */}
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
        EA
      </div>
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
          Industry Partner
        </span>
        <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white"> {/* Changed: mt-3 to mt-2 */}
          In partnership with EACOMM
        </h2>
        <p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400"> {/* Changed: mt-3 to mt-2 */}
          EACOMM is the company connected to the team&apos;s internship
          experience, where members gained practical experience in
          technology, development, and professional collaboration —
          experience that directly shaped how Cognexa was built.
        </p>
      </div>
    </div>
  </Section>
</section>

      {/* CTA Section */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Section className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-12 text-center shadow-sm backdrop-blur-sm dark:border-white/10 dark:from-indigo-600/30 dark:via-fuchsia-600/20 dark:to-indigo-600/30 dark:shadow-none">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              Ready to build your own knowledge base?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-300">
              Start free, self-host, or explore the source — Cognexa is
              open for anyone to run, extend, and trust.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Get Started Free
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-8 py-4 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10 backdrop-blur-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.02 11.02 0 0 1 5.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
                </svg>
                Get the Source
              </a>
            </div>
          </div>
        </Section>
      </section>

      <MarketingFooter />
    </main>
  );
}
