"use client";

import { useEffect, useState } from "react";
import { getBillingPlan, PlanPayload, subscribePlan } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";
import DemoCheckoutModal from "@/components/DemoCheckoutModal";

const PLAN_DISPLAY_NAMES: Record<string, string> = {
  community: "Free",
  pro: "Pro",
  team: "Unlimited",
};

const TABS = ["Overview", "Billing History", "Points"] as const;
type Tab = (typeof TABS)[number];

function formatStorage(bytes: number) {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toISOString();
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  usedLabel?: string;
  usedValue?: string;
  fraction: number | null;
  warn?: boolean;
}

function StatCard({ icon, label, value, usedLabel, usedValue, fraction, warn }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span className="text-gray-400 dark:text-gray-500">{icon}</span>
          {label}
        </span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-full rounded-full ${warn ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: fraction != null ? `${Math.min(100, fraction * 100)}%` : "8%" }}
        />
      </div>

      {usedLabel && (
        <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>{usedLabel}</span>
          {usedValue && <span>{usedValue}</span>}
        </div>
      )}
    </div>
  );
}

const ICONS = {
  storage: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 3.75c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  ),
  documents: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  ),
  apps: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  ),
  team: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  ),
};

export default function BillingSettingsPage() {
  const { notify } = useDialog();
  const [plan, setPlan] = useState<PlanPayload | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<"pro" | "team" | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");

  function loadPlan() {
    getBillingPlan()
      .then(setPlan)
      .catch(() => {});
  }

  useEffect(() => {
    loadPlan();
  }, []);

  const planName = PLAN_DISPLAY_NAMES[plan?.plan ?? "community"];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t
                  ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">Need more?</span>
          <button
            onClick={() => setCheckoutPlan(plan?.plan === "pro" ? "team" : "pro")}
            disabled={plan?.plan === "team"}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-900 dark:text-gray-100 transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Upgrade Now
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </button>
        </div>
      </div>

      {tab !== "Overview" ? (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-500 dark:text-gray-400 shadow-sm">
          {tab} isn&apos;t available in this demo yet.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {planName} Plan
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Billing cycle: {formatDate(plan?.billing_cycle_start ?? null)} -{" "}
                {formatDate(plan?.billing_cycle_end ?? null)}
              </p>
            </div>

            <button
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => notify("Payment methods aren't available in this demo.", "info")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-9-8.25h16.5a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H3.75a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5z" />
              </svg>
              Manage payment methods
            </button>
          </div>

          {plan && (
            <div className="grid gap-4 sm:grid-cols-2">
              <StatCard
                icon={ICONS.storage}
                label="Storage"
                value={
                  plan.max_storage_bytes != null
                    ? `${formatStorage(plan.storage_bytes)} / ${formatStorage(plan.max_storage_bytes)}`
                    : `${formatStorage(plan.storage_bytes)} / Unlimited`
                }
                fraction={
                  plan.max_storage_bytes != null ? plan.storage_bytes / plan.max_storage_bytes : null
                }
                usedLabel={`${planName} Plan used`}
                usedValue={
                  plan.max_storage_bytes != null
                    ? `${formatStorage(plan.storage_bytes)} / ${formatStorage(plan.max_storage_bytes)}`
                    : undefined
                }
              />

              <StatCard
                icon={ICONS.documents}
                label="Documents"
                value={
                  plan.max_documents != null
                    ? `${plan.document_count}/${plan.max_documents}`
                    : `${plan.document_count} / Unlimited`
                }
                fraction={plan.max_documents != null ? plan.document_count / plan.max_documents : null}
                usedLabel={`${planName} Plan used`}
                usedValue={
                  plan.max_documents != null
                    ? `${plan.document_count} /${plan.max_documents}`
                    : undefined
                }
              />

              <StatCard
                icon={ICONS.apps}
                label="Apps"
                value={
                  plan.max_apps != null
                    ? `${plan.apps_connected} / ${plan.max_apps}`
                    : `${plan.apps_connected} / Unlimited`
                }
                fraction={plan.max_apps != null ? plan.apps_connected / plan.max_apps : null}
              />

              <StatCard
                icon={ICONS.team}
                label="Team Member"
                value="1 / 1"
                fraction={1}
                warn
              />
            </div>
          )}

          {plan?.max_ai_credits != null && (
            <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>AI questions (OpenRouter, resets monthly)</span>
                <span>
                  {Math.max(0, plan.max_ai_credits - (plan.ai_credits_remaining ?? plan.max_ai_credits))}
                  {` / ${plan.max_ai_credits}`}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((plan.max_ai_credits - (plan.ai_credits_remaining ?? plan.max_ai_credits)) /
                        plan.max_ai_credits) *
                        100
                    )}%`,
                  }}
                />
              </div>
              {plan.ai_credits_remaining === 0 && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Out of AI questions — chat is now answering from the local model until next month.
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              This is a demo billing panel — usage is real (pulled from your account), but
              checkout is simulated and no real payment is processed.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setCheckoutPlan("pro")}
                disabled={plan?.plan === "pro"}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {plan?.plan === "pro" ? "Currently on Pro" : "Upgrade to Pro — $19/mo"}
              </button>

              <button
                onClick={() => setCheckoutPlan("team")}
                disabled={plan?.plan === "team"}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2.5 text-sm font-semibold text-gray-900 dark:text-white transition hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {plan?.plan === "team" ? "Currently on Unlimited" : "Upgrade to Unlimited — $49/mo"}
              </button>

              {plan && plan.plan !== "community" && (
                <button
                  onClick={async () => {
                    try {
                      const updated = await subscribePlan({ plan: "community" });
                      setPlan(updated);
                      notify("Reverted to the Free plan.", "success");
                    } catch (err) {
                      notify(err instanceof Error ? err.message : "Failed to change plan.", "error");
                    }
                  }}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Downgrade to Free
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {checkoutPlan && (
        <DemoCheckoutModal
          plan={checkoutPlan}
          price={checkoutPlan === "pro" ? "$19/month" : "$49/month"}
          onClose={() => setCheckoutPlan(null)}
          onSubscribed={() => {
            setCheckoutPlan(null);
            loadPlan();
          }}
        />
      )}
    </div>
  );
}
