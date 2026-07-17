"use client";

import { useState } from "react";
import { subscribePlan } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

interface DemoCheckoutModalProps {
  plan: "pro" | "team";
  price: string;
  onClose: () => void;
  onSubscribed: () => void;
}

export default function DemoCheckoutModal({
  plan,
  price,
  onClose,
  onSubscribed,
}: DemoCheckoutModalProps) {
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/29");
  const [cardCvc, setCardCvc] = useState("123");
  const [submitting, setSubmitting] = useState(false);
  const { notify } = useDialog();

  async function handleSubmit() {
    setSubmitting(true);

    try {
      await subscribePlan({ plan, cardNumber, cardExpiry, cardCvc });
      notify(`Subscribed to the ${plan === "pro" ? "Pro" : "Team"} plan.`, "success");
      onSubscribed();
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to subscribe.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Upgrade to {plan === "pro" ? "Pro" : "Team"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {price} — demo checkout, no real charge.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
              Card number
            </span>
            <input
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                Expiry
              </span>
              <input
                value={cardExpiry}
                onChange={(e) => setCardExpiry(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-300">
                CVC
              </span>
              <input
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
              />
            </label>
          </div>

          <p className="text-xs text-gray-400">
            This is a demo checkout — no payment processor is connected and no real
            card is charged. Submitting immediately activates the plan on your account.
          </p>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg disabled:opacity-60"
          >
            {submitting ? "Processing..." : `Confirm & Subscribe — ${price}`}
          </button>
        </div>
      </div>
    </div>
  );
}
