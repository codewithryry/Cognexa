"use client";

import { useEffect, useState } from "react";
import { getIntegrations, getSettings } from "@/lib/api";

interface AIProviderStatus {
  loading: boolean;
  connected: boolean;
  hasIntegration: boolean;
  ollamaConnected: boolean;
}

const OLLAMA_PROBE_TIMEOUT_MS = 1500;

async function probeOllama(ollamaUrl: string): Promise<boolean> {
  if (!ollamaUrl) return false;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_PROBE_TIMEOUT_MS);

  try {
    // Ollama runs on the same machine as the browser, not the API server, so
    // this check has to happen client-side — the backend can't reach it.
    const response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`, {
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Whether the user has *some* way to actually generate an AI answer: a saved
 * BYOK integration, or a reachable local Ollama instance. */
export default function useAIProviderStatus(): AIProviderStatus {
  const [loading, setLoading] = useState(true);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getIntegrations().catch(() => []),
      getSettings().catch(() => null),
    ]).then(async ([integrations, settings]) => {
      if (cancelled) return;
      setHasIntegration(integrations.length > 0);

      const reachable = settings ? await probeOllama(settings.ollama_url) : false;
      if (cancelled) return;
      setOllamaConnected(reachable);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    loading,
    connected: hasIntegration || ollamaConnected,
    hasIntegration,
    ollamaConnected,
  };
}
