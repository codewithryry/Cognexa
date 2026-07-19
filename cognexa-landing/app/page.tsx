/* eslint-disable react-hooks/refs -- false positive: useScrollAnimation returns
   { ref, isVisible } from a plain useRef + useState; isVisible is normal render
   state, not a ref read, but this rule can't tell the two apart once they're
   bundled in one object. */
"use client";

import { useState, useEffect, useRef } from "react";
import MarketingNav from "@/components/MarketingNav";
import { APP_URL, REPO_URL } from "@/lib/constants";

const FEATURES = [
  {
    title: "Upload Anything",
    description:
      "Drop in PDFs, DOCX files, and images — Cognexa extracts and indexes the text automatically.",
    icon: "📄",
  },
  {
    title: "Retrieval-Augmented Answers",
    description:
      "Ask questions and get answers grounded in your own documents, not just general model knowledge.",
    icon: "🧠",
  },
  {
    title: "Runs Locally",
    description:
      "Powered by a local Ollama LLM and ChromaDB vector store — your data never leaves your machine.",
    icon: "💻",
  },
  {
    title: "Model Provider",
    description:
      "Connect Cline — or any other API-key based chatbot/assistant — so it can pull project context before prompting.",
    icon: "🔌",
  },
];

const DEMO_VIDEO_URL = "/Product walkthrough.mp4";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started locally.",
    features: [
      "Up to 25 documents",
      "15 MB storage",
      "Unlimited local questions",
      "50 AI questions/month",
      "2 connected apps",
      "PDF, DOCX & image uploads",
      "Free AI models via OpenRouter",
      "Standard indexing speed",
    ],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For power users who need more flexibility.",
    features: [
      "Up to 100 documents",
      "10 GB storage",
      "Unlimited AI questions",
      "3 AI providers supported",
      "10 connected apps",
      "Priority indexing",
      "Email support",
      "Advanced retrieval",
    ],
    cta: "Upgrade Now",
    highlighted: true,
  },
  {
    name: "Unlimited",
    price: "$49",
    period: "/month",
    description: "For teams who want no ceilings.",
    features: [
      "Unlimited documents",
      "Unlimited storage",
      "Unlimited AI questions",
      "Unlimited providers",
      "Unlimited connected apps",
      "Priority indexing",
      "Priority support",
      "Custom integrations",
    ],
    cta: "Go Unlimited",
    highlighted: false,
  },
];

const STATS = [
  { value: "100%", label: "Self-hosted" },
  { value: "12+", label: "AI Providers" },
  { value: "3", label: "File Types" },
  { value: "24/7", label: "Local Access" },
];

// Custom hook for scroll animations
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

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const heroAnim = useScrollAnimation();
  const featuresAnim = useScrollAnimation();
  const integrationsAnim = useScrollAnimation();
  const pricingAnim = useScrollAnimation();
  const ctaAnim = useScrollAnimation();

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f7f7fb] text-gray-900 dark:bg-[#0a0a0f] dark:text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-indigo-300/20 blur-[120px] transition-transform duration-700 dark:bg-indigo-600/20"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`,
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-fuchsia-300/20 blur-[120px] transition-transform duration-700 dark:bg-fuchsia-600/20"
          style={{
            transform: `translate(${-mousePosition.x * 0.02}px, ${-mousePosition.y * 0.02}px)`,
          }}
        />
        <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-300/10 blur-[100px] dark:bg-blue-500/10" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.04] dark:opacity-[0.02]" />
      </div>

      <MarketingNav />

      {/* Hero Section - Changed pt-20 to pt-16, and mt-8 to mt-6 */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20">
        <div
          ref={heroAnim.ref}
          className={`relative mx-auto max-w-5xl text-center transition-all duration-1000 ${
            heroAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-indigo-600 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              Self-hosted RAG Platform
            </span>
          </div>

          <h1 className="mt-6 bg-gradient-to-r from-gray-950 via-indigo-600 to-fuchsia-600 bg-clip-text text-6xl font-bold leading-[1.1] text-transparent sm:text-7xl md:text-8xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200 animate-fade-in-up animation-delay-200">
            Your documents.
            <br />
            Your AI dataset.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-slate-400 animate-fade-in-up animation-delay-400">
            Upload documents, build a searchable dataset, and ask questions in plain
            language — answered through Retrieval-Augmented Generation, running
            entirely on your own machine.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-600">
            <a
              href={APP_URL}
              className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
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
            </a>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-gray-200 bg-white/80 px-8 py-4 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:border-gray-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:border-white/20 backdrop-blur-sm"
            >
              View on GitHub
            </a>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4 animate-fade-in-up animation-delay-800">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Section */}
        <div className="mx-auto mt-20 max-w-4xl animate-fade-in-up animation-delay-1000">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-indigo-500/10 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:shadow-black/40">
            <video controls playsInline className="aspect-video w-full bg-black/50">
              <source src={DEMO_VIDEO_URL} type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-32">
        <div
          ref={featuresAnim.ref}
          className={`transition-all duration-1000 ${
            featuresAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              Everything you need,
              <br className="sm:hidden" />{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                self-hosted
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
              No external API keys required, no data leaving your infrastructure.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-none ${
                  featuresAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 opacity-0 transition group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 group-hover:opacity-100 dark:group-hover:from-indigo-500/10 dark:group-hover:to-fuchsia-500/10" />
                
                <div className="text-4xl mb-4">{feature.icon}</div>

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section id="integrations" className="mx-auto max-w-7xl px-6 py-16">
        <div
          ref={integrationsAnim.ref}
          className={`overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-12 shadow-sm backdrop-blur-sm transition-all duration-1000 dark:border-white/10 dark:from-indigo-500/10 dark:via-white/5 dark:to-fuchsia-500/10 dark:shadow-none ${
            integrationsAnim.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-indigo-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                🔌 Bring your own model
              </span>
              <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                Integrate with any AI
              </h2>
              <p className="mt-3 text-gray-600 dark:text-slate-400">
                Stay on the free local model, or plug in Cline, OpenAI, Anthropic
                Claude, Cohere, Google Gemini, Groq, OpenRouter, Mistral, Together
                AI, DeepSeek, Ollama, or LM Studio.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
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
                  className="rounded-full border border-gray-200 bg-white/70 px-4 py-2 text-sm font-medium text-gray-600 backdrop-blur-sm transition hover:border-gray-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:border-white/20"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-32">
        <div
          ref={pricingAnim.ref}
          className={`transition-all duration-1000 ${
            pricingAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              Simple pricing,
              <br className="sm:hidden" />{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                no surprises
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
              Start free on your own machine. Upgrade when you need more room.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {PLANS.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 backdrop-blur-sm transition-all hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-indigo-200 bg-gradient-to-b from-indigo-50 to-fuchsia-50 shadow-xl shadow-indigo-500/10 dark:border-indigo-500/50 dark:from-indigo-500/20 dark:to-fuchsia-500/10 dark:shadow-2xl dark:shadow-indigo-500/20"
                    : "border-gray-200 bg-white shadow-sm hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-white/20"
                } ${
                  pricingAnim.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30">
                    ⭐ Most Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{plan.period}</span>
                </div>

                <a
                  href={APP_URL}
                  className={`mt-6 inline-block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                      : "border border-gray-200 bg-white text-gray-900 shadow-sm hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10 dark:hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </a>

                <ul className="mt-6 space-y-3 border-t border-gray-200 pt-6 dark:border-white/10">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-slate-300"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400"
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
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-6 pb-32">
        <div
          ref={ctaAnim.ref}
          className={`relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-16 text-center shadow-sm backdrop-blur-sm transition-all duration-1000 dark:border-white/10 dark:from-indigo-600/30 dark:via-fuchsia-600/20 dark:to-indigo-600/30 dark:shadow-none ${
            ctaAnim.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
          <div className="relative">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              Ready to build your dataset?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-300">
              Sign in and start uploading documents — your first indexed answer
              is minutes away.
            </p>

            <div className="mt-10">
              <a
                href={APP_URL}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
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
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-8 dark:border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row dark:text-slate-500">
          <span>© {new Date().getFullYear()} Cognexa. Self-hosted RAG platform.</span>
          <span className="flex items-center gap-2">
            Built with Next.js, FastAPI, ChromaDB & Ollama.
            <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
        </div>
      </footer>

      {/* Add these styles to your global CSS or in a style tag */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        .animation-delay-400 {
          animation-delay: 400ms;
        }
        .animation-delay-600 {
          animation-delay: 600ms;
        }
        .animation-delay-800 {
          animation-delay: 800ms;
        }
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </main>
  );
}
