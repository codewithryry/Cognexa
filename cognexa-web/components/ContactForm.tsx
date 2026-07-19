"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
        Thanks — we&apos;ve received your message and will get back to you
        shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            First Name
          </label>
          <input
            type="text"
            required
            placeholder="First Name"
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
            Last Name
          </label>
          <input
            type="text"
            required
            placeholder="Last Name"
            className="mt-1.5 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          Company Name
        </label>
        <input
          type="text"
          placeholder="Company Name"
          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          <span className="text-red-500">*</span>Email
        </label>
        <input
          type="email"
          required
          placeholder="Email"
          className="mt-1.5 w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-slate-300">
          What would you like to talk to us about?
        </label>
        <textarea
          rows={4}
          placeholder="Please briefly describe what you'd like to discuss, such as your use case, challenges, or what you're looking to achieve."
          className="mt-1.5 w-full resize-none rounded-lg border border-gray-200 bg-transparent px-3 py-2.5 text-sm outline-none transition focus:border-indigo-400 dark:border-white/10 dark:focus:border-indigo-400/60"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <span className="text-xs text-gray-500 dark:text-slate-500">
          You can also email us at{" "}
          <a
            href="mailto:hello@cognexa.io"
            className="font-medium text-indigo-600 dark:text-indigo-300"
          >
            hello@cognexa.io
          </a>
        </span>

        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
