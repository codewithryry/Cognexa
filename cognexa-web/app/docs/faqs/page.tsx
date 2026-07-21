"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "is-my-data-private", label: "Is my data private?" },
  { id: "do-i-need-a-gpu", label: "Do I need a GPU?" },
  { id: "can-i-use-cloud-models", label: "Can I use cloud models?" },
  { id: "how-do-i-upgrade", label: "How do I upgrade my plan?" },
  { id: "what-files-are-supported", label: "What files are supported?" },
  { id: "how-many-documents-can-i-upload", label: "How many documents can I upload?" },
  { id: "can-i-export-my-data", label: "Can I export my data?" },
  { id: "what-happens-if-i-exceed-limits", label: "What happens if I exceed limits?" },
  { id: "is-there-a-free-tier", label: "Is there a free tier?" },
  { id: "how-do-i-get-help", label: "How do I get help?" },
];

export default function Faqs() {
  return (
    <DocsLayout activeHref="/docs/faqs" toc={TOC}>
      <DocsCrumb label="FAQs" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">FAQs</h1>

      <DocsParagraph>
        Frequently asked questions about Cognexa's features, privacy,
        plans, and capabilities.
      </DocsParagraph>

      <DocsHeading id="is-my-data-private">Is my data private?</DocsHeading>
      <DocsParagraph>
        On the Free plan, everything runs locally through Ollama and
        ChromaDB &mdash; your documents never leave your machine. Paid plans that
        connect a hosted provider send prompts to that provider per its own
        terms. Documents, embeddings, and chat history are stored on the
        self-hosted server. No data leaves the deployment unless the user
        explicitly connects an external AI provider.
      </DocsParagraph>

      <DocsHeading id="do-i-need-a-gpu">Do I need a GPU?</DocsHeading>
      <DocsParagraph>
        No, but a GPU speeds up local inference through Ollama. CPU-only
        setups work fine for smaller models like <code>llama3.2</code> and
        moderate-sized datasets. If you plan to index many large documents or
        need faster response times, a GPU is recommended.
      </DocsParagraph>

      <DocsHeading id="can-i-use-cloud-models">Can I use cloud models?</DocsHeading>
      <DocsParagraph>
        Yes. Connect OpenAI, Anthropic, Cohere, Gemini, Groq, OpenRouter,
        or other providers from Settings &rarr; Model Provider on the Pro or
        Unlimited plan. The Community plan allows local Ollama plus
        OpenRouter's free tier models.
      </DocsParagraph>

      <DocsHeading id="how-do-i-upgrade">How do I upgrade my plan?</DocsHeading>
      <DocsParagraph>
        Go to Settings &rarr; Billing, or pick a plan from the pricing section on
        the homepage. The demo checkout flow lets you switch between Community,
        Pro, and Unlimited plans. Usage bars show real-time document, storage,
        and AI credit consumption.
      </DocsParagraph>

      <DocsHeading id="what-files-are-supported">What files are supported?</DocsHeading>
      <DocsParagraph>
        Cognexa supports PDF (.pdf), Word documents (.docx), and images (.jpg,
        .png with OCR via Tesseract). Text is extracted automatically, chunked,
        embedded using <code>all-MiniLM-L6-v2</code>, and stored in the ChromaDB
        vector store.
      </DocsParagraph>

      <DocsHeading id="how-many-documents-can-i-upload">How many documents can I upload?</DocsHeading>
      <DocsParagraph>
        This depends on your plan:
      </DocsParagraph>
      <DocsList>
        <li><strong>Community (Free)</strong> &mdash; Up to 25 documents, 15 MB storage</li>
        <li><strong>Pro ($19/month)</strong> &mdash; Up to 100 documents, 10 GB storage</li>
        <li><strong>Unlimited ($49/month)</strong> &mdash; Unlimited documents and storage (fair use policy)</li>
      </DocsList>

      <DocsHeading id="can-i-export-my-data">Can I export my data?</DocsHeading>
      <DocsParagraph>
        Yes. From Settings &rarr; Data Management you can:
      </DocsParagraph>
      <DocsList>
        <li>Export your entire knowledge base as a .zip archive</li>
        <li>Export and restore your account configuration as .json</li>
        <li>Export individual reports as .txt, .md, .docx, or .pdf from the Report page</li>
      </DocsList>

      <DocsHeading id="what-happens-if-i-exceed-limits">What happens if I exceed limits?</DocsHeading>
      <DocsParagraph>
        If you reach your plan's document count or storage limit, new
        uploads will be blocked until you upgrade your plan or free up space
        by deleting existing documents. Chat functionality continues to work
        normally.
      </DocsParagraph>

      <DocsHeading id="is-there-a-free-tier">Is there a free tier?</DocsHeading>
      <DocsParagraph>
        Yes. The Community plan is completely free to self-host. It includes
        up to 25 documents, 15 MB of storage, unlimited local Ollama
        inference, and 50 AI questions per month via OpenRouter's free
        models. No credit card required.
      </DocsParagraph>

      <DocsHeading id="how-do-i-get-help">How do I get help?</DocsHeading>
      <DocsParagraph>
        There are several ways to get assistance:
      </DocsParagraph>
      <DocsList>
        <li>
          Visit the <a href="/docs/user-guides" className="font-medium text-indigo-600 underline dark:text-indigo-300">User guides</a> for
          detailed walkthroughs
        </li>
        <li>
          Check the <a href="/docs/admin-guides" className="font-medium text-indigo-600 underline dark:text-indigo-300">Administrator guides</a> for
          configuration help
        </li>
        <li>
          Browse the <a href="/docs/references" className="font-medium text-indigo-600 underline dark:text-indigo-300">References</a> for
          quick-reference tables
        </li>
        <li>
          Open an issue on{" "}
          <a
            href="https://github.com/codewithryry/Cognexa"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline dark:text-indigo-300"
          >
            GitHub
          </a>
        </li>
        <li>
          Contact support through the{" "}
          <a href="/resources/contact-support" className="font-medium text-indigo-600 underline dark:text-indigo-300">Contact Support</a> page
        </li>
      </DocsList>
    </DocsLayout>
  );
}