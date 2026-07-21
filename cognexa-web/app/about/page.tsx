"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { REPO_URL } from "@/lib/constants";

const VALUES = [
  {
    title: "AI-Driven Development",
    description:
      "We build around large language models and intelligent automation, so every stage of your SDLC — from requirements to deployment — is accelerated by AI without sacrificing quality.",
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
      "Self-hosting is a first-class option, not an afterthought. Your project data, source code, and AI-generated artifacts can stay entirely on infrastructure you control.",
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
      "Describing your project and generating a complete SDLC pipeline should feel effortless. We keep the interface minimal so the AI does the heavy lifting, not the user.",
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
      "Software development is a team sport. Cognexa is built so teams, not just individuals, can plan, build, test, and deploy together with AI assistance at every step.",
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

const SDLC_CAPABILITIES = [
  {
    title: "Requirements Management",
    description:
      "Capture, organize, and refine project requirements with AI assistance. Generate functional and non-functional requirements documents from plain-language descriptions.",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    title: "Project Planning",
    description:
      "Automatically generate complete SDLC workflows with stages, milestones, and task breakdowns. AI analyzes your project description to create a tailored development roadmap.",
    icon: "M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5",
  },
  {
    title: "System Architecture",
    description:
      "Design system architecture, data models, and API contracts with AI-generated design documents, architecture diagrams, and technical specifications.",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  },
  {
    title: "AI Code Generation",
    description:
      "Generate production-ready source code from specifications. AI writes clean, well-structured code following best practices and modern design patterns.",
    icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  },
  {
    title: "Code Review",
    description:
      "Automated code review and quality analysis. AI examines generated code for potential issues, security vulnerabilities, and adherence to coding standards.",
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  },
  {
    title: "Testing",
    description:
      "Generate comprehensive test suites including unit tests, integration tests, and edge cases. AI creates test plans and test reports automatically.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    title: "Deployment",
    description:
      "Generate deployment scripts, configuration files, and runbooks. AI creates deployment plans with rollback strategies and monitoring configurations.",
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
  },
  {
    title: "Documentation",
    description:
      "Automatically generate comprehensive project documentation including user guides, API documentation, administrator manuals, and technical references.",
    icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  },
  {
    title: "Collaboration",
    description:
      "Work together with your team across the entire SDLC. Share artifacts, review generated content, and track progress through every stage of development.",
    icon: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  },
];

const EVOLUTION = [
  {
    era: "AI Knowledge Base",
    description: "Cognexa began as an intelligent document management system, helping teams organize and search their knowledge with AI-powered retrieval.",
    year: "July 07, 2026",
    icon: "📚",
  },
  {
    era: "RAG Platform",
    description: "Evolved into a full Retrieval-Augmented Generation platform, grounding AI answers in user-uploaded documents with multi-provider support.",
    year: "July 17, 2026",
    icon: "🧠",
  },
  {
    era: "AI Development Assistant",
    description: "Expanded beyond knowledge management into code generation, technical documentation, and software development workflows.",
    year: "July 20, 2026",
    icon: "🤖",
  },
  {
    era: "AI-Powered SDLC Platform",
    description: "Today, Cognexa is a complete AI-powered software development lifecycle platform — from requirements to deployment, all in one place.",
    year: "Current",
    icon: "⚡",
    current: true,
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

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-24">
        <Section className="grid gap-10 sm:grid-cols-2 sm:items-start">
          <div className="order-2 sm:order-1">
            <h1 className="bg-gradient-to-r from-gray-950 via-indigo-600 to-fuchsia-600 bg-clip-text text-5xl font-bold leading-[1.1] text-transparent sm:text-6xl dark:from-white dark:via-indigo-200 dark:to-fuchsia-200">
              An AI-powered SDLC platform built for modern software teams
            </h1>

            <p className="mt-6 max-w-xl text-lg text-gray-600 dark:text-slate-400">
              Cognexa is an intelligent platform that assists teams throughout the
              entire software development lifecycle — from requirements and planning
              to code generation, testing, deployment, and documentation — all
              powered by AI that works the way you do.
            </p>
          </div>

          <div className="order-1 flex aspect-[4/3] w-full items-center justify-center sm:order-2">
            <Image
              src="/Cognexa-Platform.png"
              alt="Cognexa AI-Powered SDLC Platform"
              width={700}
              height={525}
              priority
              className="h-auto w-full object-contain"
            />
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
                "Cognexa originally started as an AI knowledge management platform, helping teams organize documents and retrieve answers through intelligent search. As we worked with development teams, we realized the same AI capabilities could transform how software is built. Today, Cognexa has evolved into a complete AI-powered SDLC solution — assisting teams from requirements and planning through code generation, testing, deployment, and documentation.",
            },
            {
              title: "Our Mission",
              body:
                "Our mission is to accelerate software development using AI while improving collaboration and productivity. We believe every development team should have an intelligent assistant that understands their project context, generates high-quality artifacts, and automates repetitive tasks — so engineers can focus on building great software.",
            },
            {
              title: "Our Vision",
              body:
                "We envision a future where AI-assisted software engineering is the standard, not the exception. Where developers describe what they want to build and AI helps bring it to life — generating requirements, architecture, code, tests, and documentation in a seamless, collaborative workflow. Cognexa is leading that transformation.",
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

      {/* Platform Evolution Timeline */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Section>
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              Platform{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                Evolution
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
              From knowledge management to full SDLC automation — see how Cognexa has grown.
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-indigo-300 via-fuchsia-300 to-indigo-300 dark:from-indigo-600 dark:via-fuchsia-600 dark:to-indigo-600 hidden md:block" />

            <div className="space-y-12">
              {EVOLUTION.map((item, index) => (
                <div
                  key={item.era}
                  className={`relative flex flex-col md:flex-row items-center gap-6 ${
                    index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Content card */}
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                    <div
                      className={`rounded-2xl border p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 ${
                        item.current
                          ? "border-indigo-200 bg-gradient-to-br from-indigo-50 to-fuchsia-50 shadow-lg shadow-indigo-500/10 dark:border-indigo-500/50 dark:from-indigo-500/20 dark:to-fuchsia-500/10"
                          : "border-gray-200 bg-white dark:border-white/10 dark:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <span className="inline-flex items-center rounded-full border border-gray-200 bg-white/70 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                            {item.year}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {item.era}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        {item.description}
                      </p>
                      {item.current && (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                          </span>
                          Current
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute left-1/2 hidden md:flex h-6 w-6 -translate-x-1/2 items-center justify-center">
                    <div
                      className={`h-4 w-4 rounded-full border-2 ${
                        item.current
                          ? "border-indigo-500 bg-indigo-500 shadow-lg shadow-indigo-500/30"
                          : "border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800"
                      }`}
                    />
                  </div>

                  {/* Spacer for the other side */}
                  <div className="hidden md:block w-1/2" />
                </div>
              ))}
            </div>
          </div>
        </Section>
      </section>

      {/* SDLC Capabilities */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Section>
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              Complete{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                SDLC Coverage
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-slate-400">
              AI-powered assistance across every phase of software development.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SDLC_CAPABILITIES.map((cap, index) => (
              <div
                key={cap.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 opacity-0 transition group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 group-hover:opacity-100 dark:group-hover:from-indigo-500/10 dark:group-hover:to-fuchsia-500/10" />
                
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d={cap.icon} />
                  </svg>
                </div>

                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {cap.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {cap.description}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* Values */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Section>
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">
              What we{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                believe in
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => (
              <div
                key={value.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-transparent hover:shadow-lg hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10 dark:hover:shadow-none"
              >
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/0 to-fuchsia-500/0 opacity-0 transition group-hover:from-indigo-500/5 group-hover:to-fuchsia-500/5 group-hover:opacity-100 dark:group-hover:from-indigo-500/10 dark:group-hover:to-fuchsia-500/10" />
                
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    {value.icon}
                  </svg>
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                  {value.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-slate-400">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </Section>
      </section>

      {/* Meet Our Team */}
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-12">
        <Section>
          <div className="mb-12 text-center">
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
      <section className="mx-auto max-w-6xl px-6 pt-8 pb-24">
        <Section className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-lg font-bold text-white shadow-md shadow-indigo-500/20">
              EA
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
                Industry Partner
              </span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                In partnership with EACOMM Corporation
              </h2>
              <p className="mt-2 max-w-2xl text-gray-600 dark:text-slate-400">
                EACOMM served as the host company for the team's TESDA
                Supervised Industry Learning (SIL), where the members gained
                hands-on industry experience in software development, AI-powered
                technologies, research, and professional collaboration. The
                knowledge and skills acquired during the program became the
                foundation for building Cognexa.
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
              Ready to accelerate your software development?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-slate-300">
              Start free, self-host, or explore the source — Cognexa is
              open for any team to run, extend, and trust.
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