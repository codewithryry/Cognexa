"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import DemoCheckoutModal from "@/components/DemoCheckoutModal";

const FEATURES = [
  {
    title: "Upload Anything",
    description:
      "Drop in PDFs, DOCX files, and images — Cognexa extracts and indexes the text automatically.",
    emoji: "📤",
  },
  {
    title: "Retrieval-Augmented Answers",
    description:
      "Ask questions and get answers grounded in your own documents, not just general model knowledge.",
    emoji: "💬",
  },
  {
    title: "Runs Locally",
    description:
      "Powered by a local Ollama LLM and ChromaDB vector store — your data never leaves your machine.",
    emoji: "🔒",
  },
  {
    title: "Chatbot Integration",
    description:
      "Connect Cline — or any other API-key based chatbot/assistant — from Settings so it can pull project context before prompting.",
    emoji: "🔌",
  },
];

const DEMO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

const STEPS = [
  {
    step: "01",
    title: "Upload your documents",
    description: "PDFs, Word files, and images are parsed and chunked automatically.",
  },
  {
    step: "02",
    title: "Cognexa builds the index",
    description: "Text is embedded and stored in a local vector database for fast retrieval.",
  },
  {
    step: "03",
    title: "Ask, and get grounded answers",
    description: "Chat with your knowledge base — every answer is sourced from your own files.",
  },
];

const STATS = [
  { value: "100%", label: "Self-hosted" },
  { value: "0", label: "Cloud API calls" },
  { value: "3", label: "File types supported" },
  { value: "24/7", label: "Local availability" },
];

const PLANS = [
  {
    name: "Community",
    price: "Free",
    period: "self-hosted",
    description: "For individuals running Cognexa locally on their own machine.",
    features: [
      "Up to 25 documents",
      "500 MB storage",
      "Unlimited questions (local model)",
      "PDF, DOCX & image uploads",
      "1 AI provider connection",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power users who want more room and any AI model they like.",
    features: [
      "Unlimited documents",
      "10 GB storage",
      "Unlimited questions",
      "Connect any AI provider — OpenAI, Anthropic, Cohere, Gemini, Groq & more",
      "Priority indexing & faster retrieval",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$49",
    period: "/month",
    description: "For small teams sharing one knowledge base across projects.",
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Up to 10 team members",
      "Shared knowledge bases & permissions",
      "Priority support",
    ],
    cta: "Contact Us",
    highlighted: false,
  },
];

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);

  function handlePlanClick(planName: string) {
    if (planName === "Community") {
      router.push(user ? "/dashboard" : "/login");
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    setCheckoutPlan(planName === "Pro" ? "pro" : "team");
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0b0b14] dark:text-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-60 dark:opacity-100"
        style={{
          background:
            "radial-gradient(600px circle at 15% 10%, rgba(99,102,241,0.14), transparent 60%), radial-gradient(600px circle at 85% 30%, rgba(217,70,239,0.10), transparent 60%)",
        }}
      />

      <nav className="sticky top-0 z-20 border-b border-gray-200/70 bg-white/70 backdrop-blur-md dark:border-white/5 dark:bg-[#0b0b14]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
              C
            </span>
            <span className="text-lg font-semibold">Cognexa</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />

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

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-12 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="bg-gradient-to-r from-gray-900 via-indigo-600 to-fuchsia-600 bg-clip-text text-5xl font-bold leading-tight text-transparent sm:text-6xl sm:leading-tight dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
            Your documents.
            <br />
            Your AI knowledge base.
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-gray-600 dark:text-slate-400">
            Upload documents, build a searchable knowledge base, and ask
            questions in plain language — answered through
            Retrieval-Augmented Generation, running entirely on your own
            machine.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Get Started →
                </Link>
                <Link
                  href="/login"
                  className="rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-sm font-semibold text-gray-900 transition hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20 dark:hover:bg-white/10"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-3xl font-bold text-transparent dark:from-indigo-300 dark:to-fuchsia-300">
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-lg">
            <video controls playsInline className="aspect-video w-full bg-black">
              <source src={DEMO_VIDEO_URL} type="video/mp4" />
            </video>
          </div>
          <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-500">
            Product walkthrough placeholder — swap in your own demo recording.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Everything you need, self-hosted
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            No external API keys required, no data leaving your infrastructure.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-transparent hover:shadow-xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-transparent dark:hover:shadow-indigo-500/20"
            >
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 opacity-0 transition group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 group-hover:opacity-100 dark:group-hover:from-indigo-500/10 dark:group-hover:to-fuchsia-500/10" />

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xl text-white shadow-md shadow-indigo-500/20 transition group-hover:scale-110">
                {feature.emoji}
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">How it works</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            Three steps between a raw file and a grounded answer.
          </p>
        </div>

        <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-6">
          <div className="absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent dark:via-indigo-400/30 sm:block" />

          {STEPS.map((item) => (
            <div key={item.step} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
              <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
                {item.step}
              </span>

              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:shadow-xl">
          <div className="grid gap-8 p-10 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                🔌 Bring your own model
              </span>
              <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                Can integrate with any AI you already use
              </h2>
              <p className="mt-3 max-w-xl text-gray-600 dark:text-slate-400">
                Stay on the free local model, or plug in Cline, OpenAI, Anthropic
                Claude, Cohere, Google Gemini, Groq, OpenRouter, Mistral, Together
                AI, DeepSeek, Ollama, or LM Studio — just paste an API key or
                local endpoint in Settings and Cognexa routes questions there
                instead.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 sm:max-w-xs sm:justify-end">
              {[
                "OpenAI",
                "Anthropic",
                "Cohere",
                "Gemini",
                "Groq",
                "Mistral",
                "Ollama",
                "+ more",
              ].map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Simple pricing, no surprises
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            Start free on your own machine. Upgrade when you need more room or
            want to bring in a hosted model.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 transition dark:bg-white/[0.03] ${
                plan.highlighted
                  ? "border-indigo-400 shadow-md dark:border-indigo-400/50"
                  : "border-gray-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:hover:border-white/20"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  ⭐ Most Popular
                </span>
              )}

              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {plan.name}
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {plan.description}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price}
                </span>
                <span className="text-xs text-gray-500 dark:text-slate-400">{plan.period}</span>
              </div>

              <button
                onClick={() => handlePlanClick(plan.name)}
                className={`mt-5 inline-block rounded-lg px-5 py-2.5 text-center text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-indigo-600 text-white shadow-sm hover:bg-indigo-700"
                    : "border border-gray-200 text-gray-900 hover:bg-gray-50 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
                }`}
              >
                {plan.cta}
              </button>

              <ul className="mt-5 space-y-2 border-t border-gray-100 pt-5 dark:border-white/10">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-xs text-gray-600 dark:text-slate-300"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500 dark:text-indigo-400"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-10 text-center shadow-sm dark:border-white/10 dark:from-indigo-500/10 dark:via-white/[0.02] dark:to-fuchsia-500/10 dark:shadow-xl">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
            Ready to build your knowledge base?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-400">
            Sign in and start uploading documents — your first indexed answer
            is minutes away.
          </p>

          <div className="mt-7">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="inline-block rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              {user ? "Go to Dashboard →" : "Get Started →"}
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-200 px-6 py-8 dark:border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row dark:text-slate-500">
          <span>© {new Date().getFullYear()} Cognexa. Self-hosted RAG platform.</span>
          <span>Built with Next.js, FastAPI, ChromaDB & Ollama.</span>
        </div>
      </footer>

      {checkoutPlan && (
        <DemoCheckoutModal
          plan={checkoutPlan}
          price={checkoutPlan === "pro" ? "$19/month" : "$49/month"}
          onClose={() => setCheckoutPlan(null)}
          onSubscribed={() => {
            setCheckoutPlan(null);
            router.push("/dashboard");
          }}
        />
      )}
    </main>
  );
}
