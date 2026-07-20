/* eslint-disable react-hooks/refs -- false positive: useScrollAnimation returns
   { ref, isVisible } from a plain useRef + useState; isVisible is normal render
   state, not a ref read, but this rule can't tell the two apart once they're
   bundled in one object. */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import DemoCheckoutModal from "@/components/DemoCheckoutModal";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

const FEATURES = [
  {
    title: "Upload Anything",
    description:
      "Drop in PDFs, DOCX files, and images — Cognexa extracts and indexes the text automatically.",
  },
  {
    title: "Retrieval-Augmented Answers",
    description:
      "Ask questions and get answers grounded in your own documents, not just general model knowledge.",
  },
  {
    title: "Runs Locally",
    description:
      "Powered by a local Ollama LLM and ChromaDB vector store — your data never leaves your machine.",
  },
  {
    title: "Model Provider",
    description:
      "Connect Cline — or any other API-key based chatbot/assistant — from Settings so it can pull project context before prompting.",
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
  { value: "12+", label: "AI Models" },
  { value: "5+", label: "Integrations" },
  { value: "100%", label: "Self-hosted" },
  { value: "24/7", label: "AI Access" },
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
  const { user } = useAuth();
  const router = useRouter();
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  function handlePlanClick(planName: string) {
    if (planName === "Free") {
      router.push(user ? "/dashboard" : "/login");
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    setCheckoutPlan(planName === "Pro" ? "pro" : "team");
  }

  const heroRef = useScrollAnimation();
  const featuresRef = useScrollAnimation();
  const integrationsRef = useScrollAnimation();
  const pricingRef = useScrollAnimation();
  const ctaRef = useScrollAnimation();

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

      {/* Hero Section - Updated pt-20 to pt-16, mt-8 to mt-6, and mt-20 to mt-16 */}
      <section className="relative mx-auto max-w-7xl px-6 pt-8 pb-32">
        <div
          ref={heroRef.ref}
          className={`relative mx-auto max-w-5xl text-center transition-all duration-1000 ${
            heroRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          <h1 className="bg-gradient-to-r from-gray-950 via-indigo-600 to-fuchsia-600 bg-clip-text text-6xl font-bold leading-[1.1] text-transparent sm:text-7xl md:text-8xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200 animate-fade-in-up animation-delay-200">
            Your documents.
            <br />
            Your AI dataset.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-slate-400 animate-fade-in-up animation-delay-400">
            Upload documents, build a searchable dataset, and ask questions in plain
            language — answered through Retrieval-Augmented Generation
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4 animate-fade-in-up animation-delay-600">
            {user ? (
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                Go to Dashboard
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
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
                </Link>
                  <div className="relative inline-flex group/tooltip">
                    <a
                      href="https://github.com/codewithryry/Cognexa"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open the Cognexa GitHub repository"
                      className="group inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white/80 px-8 py-4 text-sm font-semibold text-gray-900 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-900 hover:bg-gray-900 hover:text-white hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/10 backdrop-blur-sm"
                    >
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.09 3.29 9.4 7.86 10.93.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.87-1.54-3.87-1.54-.53-1.33-1.29-1.69-1.29-1.69-1.05-.72.08-.7.08-.7 1.17.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.02 11.02 0 0 1 5.79 0c2.2-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.08.78 2.17 0 1.57-.01 2.83-.01 3.22 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
                      </svg>

                      <span>View on GitHub</span>

                      <svg
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 17L17 7M17 7H9m8 0v8"
                        />
                      </svg>
                    </a>

                    <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white opacity-0 shadow-lg transition-all duration-200 group-hover/tooltip:translate-y-1 group-hover/tooltip:opacity-100 dark:bg-white dark:text-gray-900">
                      Source code available on GitHub
                    </div>
                  </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4 animate-fade-in-up animation-delay-800">
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
        <div className="mx-auto mt-16 max-w-4xl animate-fade-in-up animation-delay-1000">
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
          ref={featuresRef.ref}
          className={`transition-all duration-1000 ${
            featuresRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
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
                className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-none ${
                  featuresRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 opacity-0 transition group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 group-hover:opacity-100 dark:group-hover:from-indigo-500/10 dark:group-hover:to-fuchsia-500/10" />

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
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
          ref={integrationsRef.ref}
          className={`overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-12 shadow-sm backdrop-blur-sm transition-all duration-1000 dark:border-white/10 dark:from-indigo-500/10 dark:via-white/5 dark:to-fuchsia-500/10 dark:shadow-none ${
            integrationsRef.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/70 px-4 py-1.5 text-xs font-medium text-indigo-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                Bring your own model
              </span>
              <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
                Integrate with any AI
              </h2>
              <p className="mt-3 max-w-xl text-gray-600 dark:text-slate-400">
                Stay on the free local model, or plug in Cline, OpenAI, Anthropic
                Claude, Cohere, Google Gemini, Groq, OpenRouter, Mistral, Together
                AI, DeepSeek, Ollama, or LM Studio.
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
                  className="rounded-full border border-gray-200 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
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
          ref={pricingRef.ref}
          className={`transition-all duration-1000 ${
            pricingRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
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

          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-8 backdrop-blur-sm transition-all hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-indigo-200 bg-gradient-to-b from-indigo-50 to-fuchsia-50 shadow-xl shadow-indigo-500/10 dark:border-indigo-500/50 dark:from-indigo-500/20 dark:to-fuchsia-500/10 dark:shadow-2xl dark:shadow-indigo-500/20"
                    : "border-gray-200 bg-white shadow-sm hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-white/20"
                } ${
                  pricingRef.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-1 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30">
                    Most Popular
                  </span>
                )}

                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">{plan.description}</p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 dark:text-slate-400">{plan.period}</span>
                </div>

                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`mt-6 rounded-xl px-6 py-3 text-sm font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                      : "border border-gray-200 bg-white text-gray-900 shadow-sm hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none dark:hover:bg-white/10 dark:hover:border-white/20"
                  }`}
                >
                  {plan.cta}
                </button>

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
          ref={ctaRef.ref}
          className={`overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 p-12 text-center shadow-sm backdrop-blur-sm transition-all duration-1000 dark:border-white/10 dark:from-indigo-600/30 dark:via-fuchsia-600/20 dark:to-indigo-600/30 dark:shadow-none ${
            ctaRef.isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          }`}
        >
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
              Ready to build your dataset?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-300">
              Sign in and start uploading documents — your first indexed answer
              is minutes away.
            </p>

            <div className="mt-8">
              <Link
                href={user ? "/dashboard" : "/login"}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />

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
