"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser, registerUser, setToken } from "@/lib/api";

const HIGHLIGHTS = [
  "Upload PDFs, DOCX & images — indexed automatically",
  "Retrieval-augmented answers grounded in your own files",
  "Runs locally, or bring your own AI provider",
];

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const data =
        mode === "login"
          ? await loginUser(email, password)
          : await registerUser(name, email, password);

      setToken(data.access_token);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#f7f7fb] dark:bg-[#0b0b14]">
      <div
        className={`relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-indigo-600 to-fuchsia-600 p-12 text-white transition-transform duration-500 ease-in-out lg:flex ${
          mode === "register" ? "translate-x-full" : "translate-x-0"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(500px circle at 20% 20%, rgba(255,255,255,0.25), transparent 60%), radial-gradient(500px circle at 80% 80%, rgba(255,255,255,0.15), transparent 60%)",
          }}
        />

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold backdrop-blur-sm">
            C
          </span>
          <span className="text-xl font-semibold">Cognexa</span>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">
            Your documents.
            <br />
            Your AI knowledge base.
          </h1>
          <p className="mt-4 max-w-md text-indigo-100">
            Upload once, ask forever — Cognexa turns your files into a
            searchable, AI-ready knowledge base.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-indigo-50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="mt-0.5 h-4 w-4 shrink-0"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-100/80">
          © {new Date().getFullYear()} Cognexa. Self-hosted RAG platform.
        </p>
      </div>

      <div
        className={`flex w-full items-center justify-center px-6 py-12 transition-transform duration-500 ease-in-out lg:w-1/2 ${
          mode === "register" ? "lg:-translate-x-full" : "lg:translate-x-0"
        }`}
      >
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 font-bold text-white shadow-lg shadow-indigo-500/30">
              C
            </span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Cognexa
            </span>
          </div>

          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to home
          </Link>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {mode === "login"
              ? "Sign in to access your knowledge base."
              : "Sign up to start building your knowledge base."}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                  placeholder="Juan Dela Cruz"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
