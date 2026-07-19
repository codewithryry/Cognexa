"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "supported-file-types", label: "Supported file types" },
  { id: "supported-ai-providers", label: "Supported AI providers" },
  { id: "plan-limits", label: "Plan limits" },
];

export default function References() {
  return (
    <DocsLayout activeHref="/docs/references" toc={TOC}>
      <DocsCrumb label="References" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">References</h1>

      <DocsParagraph>
        Quick-reference tables for what Cognexa supports.
      </DocsParagraph>

      <DocsHeading id="supported-file-types">Supported file types</DocsHeading>
      <DocsList>
        <li>PDF</li>
        <li>DOCX</li>
        <li>Images (PNG, JPG)</li>
      </DocsList>

      <DocsHeading id="supported-ai-providers">Supported AI providers</DocsHeading>
      <DocsList>
        <li>Ollama (local, free)</li>
        <li>OpenAI, Anthropic, Cohere, Gemini, Groq, Mistral, Together AI, DeepSeek, LM Studio, OpenRouter</li>
        <li>Cline (bring-your-own API key)</li>
      </DocsList>

      <DocsHeading id="plan-limits">Plan limits</DocsHeading>
      <DocsList>
        <li>Free — up to 25 documents, 15 MB storage, 2 connected apps</li>
        <li>Pro — up to 100 documents, 10 GB storage, 10 connected apps</li>
        <li>Unlimited — unlimited documents, storage, and connected apps (fair use policy)</li>
      </DocsList>
    </DocsLayout>
  );
}
