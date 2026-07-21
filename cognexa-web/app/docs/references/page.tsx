"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "supported-file-types", label: "Supported file types" },
  { id: "supported-ai-providers", label: "Supported AI providers" },
  { id: "supported-data-sources", label: "Supported data sources" },
  { id: "plan-limits", label: "Plan limits" },
  { id: "technology-stack", label: "Technology stack" },
  { id: "non-functional-characteristics", label: "Non-functional characteristics" },
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
      <DocsParagraph>
        Cognexa can parse and index the following file formats:
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>PDF</strong> (.pdf) &mdash; Extracted using <code>pypdf</code>;
          preserves text layout and structure
        </li>
        <li>
          <strong>Word documents</strong> (.docx) &mdash; Extracted using <code>python-docx</code>
        </li>
        <li>
          <strong>JPEG images</strong> (.jpg, .jpeg) &mdash; OCR via Tesseract (<code>pytesseract</code>)
        </li>
        <li>
          <strong>PNG images</strong> (.png) &mdash; OCR via Tesseract (<code>pytesseract</code>)
        </li>
      </DocsList>

      <DocsHeading id="supported-ai-providers">Supported AI providers</DocsHeading>
      <DocsParagraph>
        You can connect one or more of the following AI providers from
        Settings &rarr; Model Provider:
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Local (Ollama)</strong> &mdash; Default model <code>llama3.2</code>.
          Free, no cloud call required
        </li>
        <li>
          <strong>OpenAI</strong> &mdash; GPT-4, GPT-3.5, and other models via API key
        </li>
        <li>
          <strong>Anthropic</strong> &mdash; Claude 3 Opus, Sonnet, Haiku via API key
        </li>
        <li>
          <strong>Cohere</strong> &mdash; Command R / R+ via API key
        </li>
        <li>
          <strong>Google Gemini</strong> &mdash; Gemini 1.5 Pro / Flash via API key
        </li>
        <li>
          <strong>OpenRouter</strong> &mdash; Unified API for dozens of models
          (includes free tier models)
        </li>
        <li>
          <strong>Groq</strong> &mdash; Fast inference on open models via API key
        </li>
        <li>
          <strong>Cline</strong> &mdash; Local-first agentic coding assistant
        </li>
        <li>
          <strong>LM Studio</strong> &mdash; Run local models via LM Studio endpoint
        </li>
      </DocsList>

      <DocsHeading id="supported-data-sources">Supported data sources</DocsHeading>
      <DocsParagraph>
        External sources that can be connected and indexed alongside uploaded
        documents:
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>GitHub</strong> &mdash; Connect repositories to index code,
          issues, and documentation (available now)
        </li>
        <li>
          <strong>Google Drive</strong> &mdash; Connect Google Drive to index
          cloud documents (coming soon)
        </li>
      </DocsList>

      <DocsHeading id="plan-limits">Plan limits</DocsHeading>
      <DocsList>
        <li>
          <strong>Community (Free)</strong> &mdash; Up to 25 documents, 15 MB storage,
          local model + OpenRouter free models only
        </li>
        <li>
          <strong>Pro ($19/month)</strong> &mdash; Up to 100 documents, 10 GB storage,
          up to 3 AI provider connections, up to 2 data source connections
        </li>
        <li>
          <strong>Unlimited ($49/month)</strong> &mdash; Unlimited documents and storage
          (fair use policy), unlimited provider and data source connections
        </li>
      </DocsList>

      <DocsHeading id="technology-stack">Technology stack</DocsHeading>
      <DocsParagraph>
        The complete technology stack powering Cognexa:
      </DocsParagraph>
      <DocsList>
        <li><strong>Frontend framework</strong> &mdash; Next.js 16.2.10 (App Router), React 19.2.4</li>
        <li><strong>Frontend styling</strong> &mdash; Tailwind CSS v4</li>
        <li><strong>Frontend language</strong> &mdash; TypeScript 5</li>
        <li><strong>Backend framework</strong> &mdash; FastAPI 0.139.2 (Python), Uvicorn ASGI server</li>
        <li><strong>ORM / Database driver</strong> &mdash; SQLAlchemy 2.0.51, PyMySQL</li>
        <li><strong>Relational database</strong> &mdash; MySQL</li>
        <li><strong>Vector database</strong> &mdash; ChromaDB 1.5.9 (local, persistent, on-disk)</li>
        <li><strong>Embedding model</strong> &mdash; sentence-transformers/all-MiniLM-L6-v2</li>
        <li><strong>Local LLM runtime</strong> &mdash; Ollama (default model llama3.2)</li>
        <li><strong>Document parsing</strong> &mdash; pypdf (PDF), python-docx (DOCX), pytesseract + Pillow (image OCR)</li>
        <li><strong>Authentication</strong> &mdash; JWT (python-jose), bcrypt password hashing</li>
      </DocsList>

      <DocsHeading id="non-functional-characteristics">Non-functional characteristics</DocsHeading>
      <DocsList>
        <li>
          <strong>Data residency</strong> &mdash; Documents, embeddings, and chat history
          are stored on the self-hosted server. No data leaves the deployment unless
          the user explicitly connects an external AI provider
        </li>
        <li>
          <strong>Multi-tenancy</strong> &mdash; All resources are scoped by user_id.
          No cross-user data access exists in any endpoint
        </li>
        <li>
          <strong>Concurrency fairness</strong> &mdash; A priority-queue and priority-slot
          mechanism ensures paid plans are not starved by Community-plan load, without
          denying Community users service
        </li>
        <li>
          <strong>Extensibility</strong> &mdash; New AI providers can be added by
          extending PROVIDER_CONFIG in app/query.py and the PROVIDERS list in the
          frontend settings page
        </li>
      </DocsList>
    </DocsLayout>
  );
}