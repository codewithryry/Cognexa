"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "model-providers", label: "Model providers" },
  { id: "data-sources", label: "Data sources" },
  { id: "data-management", label: "Data management" },
  { id: "billing-plans", label: "Billing & plans" },
];

export default function AdminGuides() {
  return (
    <DocsLayout activeHref="/docs/admin-guides" toc={TOC}>
      <DocsCrumb label="Administrator guides" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
        Administrator guides
      </h1>

      <DocsParagraph>
        Configuration and account-level settings for whoever manages the
        Cognexa instance — model providers, connected data sources, and
        billing.
      </DocsParagraph>

      <DocsHeading id="model-providers">Model providers</DocsHeading>
      <DocsParagraph>
        Under Settings → Model Provider, stay on the free local Ollama model
        or connect a hosted provider with an API key (OpenAI, Anthropic,
        Cohere, Gemini, Groq, OpenRouter, and more).
      </DocsParagraph>

      <DocsHeading id="data-sources">Data sources</DocsHeading>
      <DocsParagraph>
        Manage connected apps and integrations from Settings → Data Sources.
        Free plans support up to 2 connected apps; paid plans support more.
      </DocsParagraph>

      <DocsHeading id="data-management">Data management</DocsHeading>
      <DocsList>
        <li>Review storage usage per dataset</li>
        <li>Remove documents that are no longer needed</li>
        <li>Reindex a dataset after bulk changes</li>
      </DocsList>

      <DocsHeading id="billing-plans">Billing & plans</DocsHeading>
      <DocsParagraph>
        Upgrade or downgrade between Free, Pro, and Unlimited from Settings →
        Billing.
      </DocsParagraph>
    </DocsLayout>
  );
}
