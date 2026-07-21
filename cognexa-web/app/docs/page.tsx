"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList, REPO_URL } from "@/components/DocsLayout";

const TOC = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "start-the-server", label: "Start the server" },
  { id: "configure-llms", label: "Configure LLMs" },
  { id: "create-your-first-dataset", label: "Create your first dataset" },
  { id: "upload-and-index-files", label: "Upload and index files" },
  { id: "chat-with-your-data", label: "Chat with your data" },
  { id: "architecture-overview", label: "Architecture overview" },
  { id: "key-features", label: "Key features" },
  { id: "subscription-plans", label: "Subscription plans" },
  { id: "data-flows", label: "Data flows" },
  { id: "supported-providers", label: "Supported providers" },
  { id: "next-steps", label: "Next steps" },
];

export default function Docs() {
  return (
    <DocsLayout activeHref="/docs" toc={TOC}>
      <DocsCrumb label="Quickstart" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Quickstart</h1>

      <DocsParagraph>
        Cognexa is a self-hosted RAG (Retrieval-Augmented Generation)
        platform. It parses your documents, indexes them in a local vector
        store, and lets you ask questions that are answered from your own
        data &mdash; running entirely on your own machine.
      </DocsParagraph>

      <DocsParagraph>This guide walks through:</DocsParagraph>

      <DocsList>
        <li>Starting up a local Cognexa server</li>
        <li>Configuring a model provider (local Ollama or a cloud LLM)</li>
        <li>Creating your first dataset</li>
        <li>Uploading and indexing files</li>
        <li>Chatting with your data</li>
      </DocsList>

      <div className="mt-6 rounded-xl border-l-4 border-indigo-500 bg-indigo-50 p-4 text-sm text-gray-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-slate-300">
        <p className="font-semibold text-indigo-700 dark:text-indigo-300">Note</p>
        <p className="mt-1">
          The full, up-to-date docs live in the{" "}
          <a
            href={`${REPO_URL}/tree/main/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline dark:text-indigo-300"
          >
            /docs folder on GitHub
          </a>
          . This page is a quick overview to get you oriented.
        </p>
      </div>

      <DocsHeading id="prerequisites">Prerequisites</DocsHeading>
      <DocsList>
        <li><strong>Node.js</strong> &mdash; v18 or later (for the Next.js frontend)</li>
        <li><strong>Python</strong> &mdash; v3.10 or later (for the FastAPI backend)</li>
        <li><strong>MySQL</strong> &mdash; a running MySQL instance for relational data (users, documents, settings, sessions)</li>
        <li><strong>Ollama</strong> &mdash; running locally for default model inference (<code>llama3.2</code> recommended)</li>
        <li><strong>ChromaDB</strong> &mdash; installed as a Python dependency; runs locally, on-disk, no separate server needed</li>
        <li><strong>Git</strong> &mdash; to clone the repository</li>
      </DocsList>

      <DocsHeading id="start-the-server">Start the server</DocsHeading>
      <DocsParagraph>
        Clone the repository, install dependencies for both the frontend and
        backend, then start the Next.js dev server and the FastAPI backend
        (via Uvicorn). See the README for exact commands for your platform.
      </DocsParagraph>

      <DocsParagraph>
        The backend runs on port 8000 by default and the frontend on port
        3000. Make sure both are running before you proceed.
      </DocsParagraph>

      <DocsHeading id="configure-llms">Configure LLMs</DocsHeading>
      <DocsParagraph>
        Stay on the free local Ollama model, or connect a hosted provider
        (OpenAI, Anthropic, Cohere, Gemini, Groq, OpenRouter, and more) from
        Settings &rarr; Model Provider.
      </DocsParagraph>

      <DocsParagraph>
        By default, Cognexa uses your local Ollama instance with
        <code> llama3.2</code>. No cloud call is required, and all your data
        stays on your machine. If you prefer to use a cloud provider, enter your
        API key in Settings and select it when chatting.
      </DocsParagraph>

      <DocsHeading id="create-your-first-dataset">Create your first dataset</DocsHeading>
      <DocsParagraph>
        Create a dataset to group related documents together before
        uploading files. Datasets act as logical buckets &mdash; you can scope
        your chat queries to one or more datasets, so answers are drawn
        only from the documents within them.
      </DocsParagraph>

      <DocsHeading id="upload-and-index-files">Upload and index files</DocsHeading>
      <DocsParagraph>
        Drop in PDFs, DOCX files, or images (JPG, PNG). Cognexa extracts the
        text, chunks it, embeds it using <code>all-MiniLM-L6-v2</code>, and
        stores the vectors in ChromaDB &mdash; all automatically.
      </DocsParagraph>

      <DocsList>
        <li>Supported formats: <strong>PDF</strong>, <strong>DOCX</strong>, <strong>JPG</strong>, <strong>PNG</strong> (with OCR via Tesseract)</li>
        <li>Files are chunked, embedded, and indexed in a background worker pool</li>
        <li>Duplicate detection blocks byte-identical re-uploads via SHA-256 content hash</li>
        <li>Each document gets a detail page with type, status, size, page count, chunk count, and content preview</li>
      </DocsList>

      <DocsHeading id="chat-with-your-data">Chat with your data</DocsHeading>
      <DocsParagraph>
        Ask questions in plain language and get answers grounded in your
        uploaded documents, with citations back to the source.
      </DocsParagraph>

      <DocsList>
        <li>Scope questions to specific documents or datasets</li>
        <li>Choose between local Ollama or a connected cloud provider for each question</li>
        <li>Answers are streamed token-by-token (SSE) for real-time display</li>
        <li>Conversations are saved as named, resumable sessions with full history</li>
      </DocsList>

      <DocsHeading id="architecture-overview">Architecture overview</DocsHeading>
      <DocsParagraph>
        Cognexa is a two-tier web application with a decoupled frontend and
        backend:
      </DocsParagraph>

      <DocsList>
        <li>
          <strong>Frontend</strong> &mdash; Next.js 16 (App Router) SPA written in
          TypeScript, styled with Tailwind CSS. Communicates with the backend
          via REST and Server-Sent Events (SSE) for streaming.
        </li>
        <li>
          <strong>Backend</strong> &mdash; FastAPI (Python) REST/SSE API backed by
          a MySQL relational database (via SQLAlchemy) and a local ChromaDB
          vector store. Runs on Uvicorn.
        </li>
        <li>
          <strong>Vector store</strong> &mdash; ChromaDB runs locally, on-disk. No
          separate server process required. Embeddings are generated with
          <code> sentence-transformers/all-MiniLM-L6-v2</code>.
        </li>
        <li>
          <strong>LLM runtime</strong> &mdash; Local inference via Ollama (default
          <code> llama3.2</code>) or external AI providers connected through
          the Settings page.
        </li>
      </DocsList>

      <DocsHeading id="key-features">Key features</DocsHeading>
      <DocsParagraph>
        Cognexa provides a comprehensive set of capabilities for managing
        and querying your knowledge base:
      </DocsParagraph>

      <DocsList>
        <li>
          <strong>Document ingestion</strong> &mdash; Upload PDF, DOCX, JPG, and
          PNG files; text is extracted (including OCR for images) automatically
        </li>
        <li>
          <strong>Vector indexing</strong> &mdash; Uploaded text is chunked,
          embedded, and stored in a local ChromaDB instance
        </li>
        <li>
          <strong>Retrieval-Augmented Chat</strong> &mdash; Questions are answered
          using only retrieved document context, streamed token-by-token
        </li>
        <li>
          <strong>Local-first inference</strong> &mdash; A local Ollama model
          answers by default &mdash; no cloud call required
        </li>
        <li>
          <strong>Bring-your-own AI provider</strong> &mdash; Connect OpenAI,
          Anthropic Claude, Cohere, Google Gemini, OpenRouter, Cline, or a
          local Ollama/LM Studio endpoint
        </li>
        <li>
          <strong>Priority scheduling</strong> &mdash; Document indexing and chat
          generation are served in priority order by plan tier under load
        </li>
        <li>
          <strong>Auto re-index</strong> &mdash; Documents stuck in &ldquo;Processing&rdquo;
          can be automatically retried
        </li>
        <li>
          <strong>Duplicate detection</strong> &mdash; Byte-identical re-uploads
          are blocked via SHA-256 content hash
        </li>
        <li>
          <strong>Chat sessions</strong> &mdash; Conversations are saved as named,
          resumable sessions with history, rename, and delete
        </li>
        <li>
          <strong>Report generation</strong> &mdash; Turn a saved chat session or a
          free-form topic/dataset query into a structured written report with
          export to .txt, .md, .docx, or .pdf
        </li>
        <li>
          <strong>Data source connections</strong> &mdash; Connect external sources
          (GitHub available; Google Drive coming soon) for indexing
        </li>
        <li>
          <strong>Data management</strong> &mdash; Export knowledge base as .zip,
          back up/restore account configuration as .json, delete data on demand
        </li>
        <li>
          <strong>Document detail view</strong> &mdash; Each document has its own
          page showing type, status, size, page count, chunk count, upload
          date, and an extracted-content preview
        </li>
      </DocsList>

      <DocsHeading id="subscription-plans">Subscription plans</DocsHeading>
      <DocsParagraph>
        Cognexa offers three self-hosted plans that gate document count,
        storage, AI-provider connections, and other resource limits:
      </DocsParagraph>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Plan</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Price</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Documents</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">Storage</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">AI Providers</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Community</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Free (self-hosted)</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Up to 25</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">15 MB</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Local model + OpenRouter free models</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Pro</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">$19/month</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Up to 100</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">10 GB</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Up to 3 connections</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Unlimited</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">$49/month</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Unlimited (Fair Use)</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Unlimited (Fair Use)</td>
              <td className="px-4 py-3 text-gray-600 dark:text-slate-400">Unlimited connections</td>
            </tr>
          </tbody>
        </table>
      </div>

      <DocsParagraph>
        All plans receive priority scheduling benefits proportional to tier
        (Unlimited, Pro, Community - highest to lowest) for both document indexing and chat
        generation under concurrent load.
      </DocsParagraph>

      <DocsHeading id="data-flows">Data flows</DocsHeading>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-white">Document upload flow</h3>
      <DocsList>
        <li>User uploads a file via the frontend Upload page</li>
        <li>Backend validates plan limits (document count, storage) and checks for duplicates (SHA-256)</li>
        <li>File is saved to disk; text is extracted synchronously (fast, needed for preview)</li>
        <li>A <code>Document</code> row is created with <code>chunks = 0</code> (&ldquo;Processing&rdquo;)</li>
        <li>The heavy chunk + embed + store step is submitted to a priority worker pool</li>
        <li>A background worker processes the job (higher-plan jobs are dequeued first under load)</li>
        <li>The frontend polls the document list until the chunk count is greater than zero (&ldquo;Indexed&rdquo;)</li>
      </DocsList>

      <h3 className="mt-6 text-base font-semibold text-gray-900 dark:text-white">Chat / Ask flow</h3>
      <DocsList>
        <li>User submits a question, optionally scoped to specific documents and/or a provider</li>
        <li>Backend resolves the source: local Ollama, a specific saved integration, or &ldquo;auto&rdquo;</li>
        <li>For metadata questions (&ldquo;list my documents&rdquo;), the backend answers from the documents table directly</li>
        <li>Otherwise, backend performs similarity search against ChromaDB, retrieving chunks across relevant documents</li>
        <li>Generation is streamed back via SSE, gated by a priority slot</li>
        <li>The exchange is saved to a chat session for history, resumption, rename, or deletion</li>
      </DocsList>

      <DocsHeading id="supported-providers">Supported AI providers</DocsHeading>
      <DocsParagraph>
        You can connect one or more of the following AI providers from
        Settings &rarr; Model Provider:
      </DocsParagraph>

      <DocsList>
        <li><strong>Local</strong> &mdash; Ollama (default <code>llama3.2</code>) or LM Studio endpoint</li>
        <li><strong>OpenAI</strong> &mdash; GPT-4, GPT-3.5, and other models</li>
        <li><strong>Anthropic</strong> &mdash; Claude 3 Opus, Sonnet, Haiku</li>
        <li><strong>Cohere</strong> &mdash; Command R / R+</li>
        <li><strong>Google Gemini</strong> &mdash; Gemini 1.5 Pro / Flash</li>
        <li><strong>OpenRouter</strong> &mdash; Unified API for dozens of models (includes free tier)</li>
        <li><strong>Groq</strong> &mdash; Fast inference on open models</li>
        <li><strong>Cline</strong> &mdash; Local-first agentic coding assistant</li>
      </DocsList>

      <DocsHeading id="next-steps">Next steps</DocsHeading>
      <DocsParagraph>
        Now that you are up and running, here are some suggestions for
        exploring Cognexa further:
      </DocsParagraph>

      <DocsList>
        <li>
          Visit the <a href="/docs/user-guides" className="font-medium text-indigo-600 underline dark:text-indigo-300">User guides</a> for
          detailed walkthroughs of every feature
        </li>
        <li>
          Check the <a href="/docs/admin-guides" className="font-medium text-indigo-600 underline dark:text-indigo-300">Administrator guides</a> for
          deployment, configuration, and maintenance
        </li>
        <li>
          Browse the <a href="/docs/developer-guides" className="font-medium text-indigo-600 underline dark:text-indigo-300">Developer guides</a> for
          API references and contribution instructions
        </li>
        <li>
          See the <a href="/docs/releases" className="font-medium text-indigo-600 underline dark:text-indigo-300">Releases</a> page
          for changelogs and version history
        </li>
        <li>
          Explore the <a href="/docs/faqs" className="font-medium text-indigo-600 underline dark:text-indigo-300">FAQs</a> for
          common questions and troubleshooting tips
        </li>
        <li>
          Read the full documentation in the{" "}
          <a
            href={`${REPO_URL}/tree/main/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline dark:text-indigo-300"
          >
            /docs folder on GitHub
          </a>
        </li>
      </DocsList>
    </DocsLayout>
  );
}