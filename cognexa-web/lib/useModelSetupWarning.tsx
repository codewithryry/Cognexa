"use client";

import { useEffect } from "react";
import { getBillingPlan, getIntegrations } from "@/lib/api";
import { useDialog } from "@/lib/DialogContext";

const STORAGE_KEY = "cognexa_model_setup_warned";

export default function useModelSetupWarning() {
  const { warn } = useDialog();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    Promise.all([getBillingPlan().catch(() => null), getIntegrations().catch(() => [])]).then(
      ([plan, integrations]) => {
        const isCommunity = (plan?.plan ?? "community") === "community";
        if (!isCommunity || integrations.length > 0) return;

        localStorage.setItem(STORAGE_KEY, "1");

        warn({
          message: (
            <>
              Please add both an embedding model and LLM in{" "}
              <strong>Settings &gt; Model Provider</strong> first. Don&apos;t have Ollama
              installed? Connect OpenRouter instead — it&apos;s free on the Free plan.
            </>
          ),
          confirmLabel: "Go to Settings",
          confirmHref: "/settings/model-provider",
        });
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
