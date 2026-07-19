"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph } from "@/components/DocsLayout";

const TOC = [
  { id: "is-my-data-private", label: "Is my data private?" },
  { id: "do-i-need-a-gpu", label: "Do I need a GPU?" },
  { id: "can-i-use-cloud-models", label: "Can I use cloud models?" },
  { id: "how-do-i-upgrade", label: "How do I upgrade my plan?" },
];

export default function Faqs() {
  return (
    <DocsLayout activeHref="/docs/faqs" toc={TOC}>
      <DocsCrumb label="FAQs" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">FAQs</h1>

      <DocsHeading id="is-my-data-private">Is my data private?</DocsHeading>
      <DocsParagraph>
        On the Free plan, everything runs locally through Ollama and
        ChromaDB — your documents never leave your machine. Paid plans that
        connect a hosted provider send prompts to that provider per its own
        terms.
      </DocsParagraph>

      <DocsHeading id="do-i-need-a-gpu">Do I need a GPU?</DocsHeading>
      <DocsParagraph>
        No, but a GPU speeds up local inference through Ollama. CPU-only
        setups work fine for smaller models and datasets.
      </DocsParagraph>

      <DocsHeading id="can-i-use-cloud-models">Can I use cloud models?</DocsHeading>
      <DocsParagraph>
        Yes. Connect OpenAI, Anthropic, Cohere, Gemini, Groq, OpenRouter, or
        other providers from Settings → Model Provider on the Pro or
        Unlimited plan.
      </DocsParagraph>

      <DocsHeading id="how-do-i-upgrade">How do I upgrade my plan?</DocsHeading>
      <DocsParagraph>
        Go to Settings → Billing, or pick a plan from the pricing section on
        the homepage.
      </DocsParagraph>
    </DocsLayout>
  );
}
