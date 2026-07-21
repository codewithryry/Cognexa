"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList, REPO_URL } from "@/components/DocsLayout";

const TOC = [
  { id: "project-structure", label: "Project structure" },
  { id: "technology-stack", label: "Technology stack" },
  { id: "running-locally", label: "Running locally" },
  { id: "backend-api", label: "Backend API" },
  { id: "core-backend-modules", label: "Core backend modules" },
  { id: "data-model", label: "Data model" },
  { id: "extending-providers", label: "Extending providers" },
  { id: "contributing", label: "Contributing" },
];

export default function DeveloperGuides() {
  return (
    <DocsLayout activeHref="/docs/developer-guides" toc={TOC}>
      <DocsCrumb label="Developer guides" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
        Developer guides
      </h1>

      <DocsParagraph>
        Cognexa's frontend is Next.js, backed by a FastAPI service that
        handles document parsing, ChromaDB indexing, and LLM calls (local
        Ollama or hosted providers).
      </DocsParagraph>

      <DocsHeading id="project-structure">Project structure</DocsHeading>
      <DocsParagraph>
        The repository is organized into two main directories:
      </DocsParagraph>
      <DocsList>
        <li>
          <code>cognexa-web/</code> &mdash; Next.js frontend (App Router) with
          components, pages, and API client
        </li>
        <li><code>components/</code> &mdash; shared UI components (Sidebar, Navbar, DocsLayout, etc.)</li>
        <li><code>lib/</code> &mdash; API client, auth, theme, dialog contexts, constants, and solutions data</li>
        <li><code>app/</code> &mdash; Next.js App Router pages for docs, settings, chat, upload, dashboard, etc.</li>
        <li>
          <code>cognexa-api/</code> &mdash; FastAPI Python backend with SQLAlchemy
          ORM models, routes, and business logic
        </li>
        <li><code>app/</code> &mdash; FastAPI route handlers, database config, auth, RAG indexing, query, and scheduler</li>
        <li><code>app/templates/</code> &mdash; Email templates (welcome, security notifications)</li>
        <li>
          <code>docs/</code> &mdash; Full markdown documentation with software docs,
          user manual, administrator manual, testing docs, and technical docs
        </li>
      </DocsList>

      <DocsHeading id="technology-stack">Technology stack</DocsHeading>
      <DocsList>
        <li>
          <strong>Frontend</strong> &mdash; Next.js 16.2.10 (App Router),
          React 19.2.4, TypeScript 5, Tailwind CSS v4
        </li>
        <li>
          <strong>Backend</strong> &mdash; FastAPI 0.139.2 (Python), Uvicorn ASGI server
        </li>
        <li>
          <strong>ORM / Database</strong> &mdash; SQLAlchemy 2.0.51, PyMySQL, MySQL
        </li>
        <li>
          <strong>Vector database</strong> &mdash; ChromaDB 1.5.9 (local, persistent, on-disk)
        </li>
        <li>
          <strong>Embedding model</strong> &mdash; <code>sentence-transformers/all-MiniLM-L6-v2</code>
        </li>
        <li>
          <strong>Local LLM runtime</strong> &mdash; Ollama (default model <code>llama3.2</code>)
        </li>
        <li>
          <strong>Document parsing</strong> &mdash; <code>pypdf</code> (PDF),
          <code> python-docx</code> (DOCX), <code>pytesseract</code> + Pillow (image OCR)
        </li>
        <li>
          <strong>Auth</strong> &mdash; JWT (<code>python-jose</code>), <code>bcrypt</code> password hashing
        </li>
      </DocsList>

      <DocsHeading id="running-locally">Running locally</DocsHeading>
      <DocsParagraph>
        Install dependencies for both the frontend and backend, then run the
        dev servers:
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Frontend</strong> &mdash; <code>cd cognexa-web && npm install && npm run dev</code>
          (runs on port 3000)
        </li>
        <li>
          <strong>Backend</strong> &mdash; <code>cd cognexa-api && pip install -r requirements.txt && uvicorn app.main:app --reload</code>
          (runs on port 8000)
        </li>
        <li>
          <strong>Database</strong> &mdash; Ensure MySQL is running and configured
          in <code>.env</code>
        </li>
        <li>
          <strong>Ollama</strong> &mdash; Ensure Ollama is running locally with
          <code> llama3.2</code> pulled
        </li>
        <li>
          Point the frontend at your local FastAPI backend via the environment
          configuration in <code>.env.local</code>
        </li>
      </DocsList>

      <DocsHeading id="backend-api">Backend API</DocsHeading>
      <DocsParagraph>
        The backend exposes REST endpoints for uploads, datasets, chat
        sessions, reports, settings, and more that the frontend calls through
        the shared API client in <code>lib/api.ts</code>.
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Document endpoints</strong> &mdash; Upload, list, detail, download,
          delete, bulk-delete, and re-index documents
        </li>
        <li>
          <strong>Chat endpoints</strong> &mdash; Streaming chat (SSE), session
          management (create, list, get, rename, delete)
        </li>
        <li>
          <strong>Report endpoints</strong> &mdash; Generate from session or dataset,
          export as .txt/.md/.docx/.pdf
        </li>
        <li>
          <strong>Settings endpoints</strong> &mdash; Account, model provider,
          data sources, chat channels, billing, automation, data management
        </li>
        <li>
          <strong>Auth endpoints</strong> &mdash; Register, login, token refresh,
          password change
        </li>
        <li>
          <strong>Dashboard endpoints</strong> &mdash; Usage statistics and plan info
        </li>
        <li>
          All endpoints require JWT bearer authentication except registration and login
        </li>
      </DocsList>

      <DocsHeading id="core-backend-modules">Core backend modules</DocsHeading>
      <DocsParagraph>
        The FastAPI backend is organized into focused modules:
      </DocsParagraph>
      <DocsList>
        <li>
          <code>app/main.py</code> &mdash; FastAPI application, all HTTP/SSE route
          handlers, plan/credit/priority enforcement
        </li>
        <li>
          <code>app/models.py</code> &mdash; SQLAlchemy ORM models (users, documents,
          settings, integrations, chat_messages)
        </li>
        <li>
          <code>app/schemas.py</code> &mdash; Pydantic request/response schemas
        </li>
        <li>
          <code>app/auth.py</code> &mdash; Password hashing, JWT issuance/verification,
          current-user dependency
        </li>
        <li>
          <code>app/database.py</code> &mdash; SQLAlchemy engine/session configuration
        </li>
        <li>
          <code>app/rag.py</code> &mdash; Document chunking, embedding, and ChromaDB
          indexing/deletion
        </li>
        <li>
          <code>app/query.py</code> &mdash; Retrieval (similarity search) and answer
          generation (local Ollama or external provider streaming), plus report generation
        </li>
        <li>
          <code>app/scheduler.py</code> &mdash; Priority-based background worker pool
          (indexing) and priority slot gate (chat generation)
        </li>
      </DocsList>

      <DocsHeading id="data-model">Data model</DocsHeading>
      <DocsParagraph>
        Key SQLAlchemy models and their purposes:
      </DocsParagraph>
      <DocsList>
        <li><code>User</code> &mdash; Account credentials and profile</li>
        <li><code>Document</code> &mdash; Uploaded file metadata, extracted preview, chunk count</li>
        <li><code>Settings</code> &mdash; Per-user Ollama/model/chunking/theme/automation preferences</li>
        <li><code>Integration</code> &mdash; Saved external AI-provider connections</li>
        <li><code>DataSourceConnection</code> &mdash; Saved external data-source connections (e.g. GitHub)</li>
        <li><code>ChatChannel</code> &mdash; Saved external chat-channel connections</li>
        <li><code>ChatSession</code> &mdash; A named, saved chat conversation</li>
        <li><code>ChatMessage</code> &mdash; Individual question/answer turns</li>
        <li><code>GeneratedReport</code> &mdash; A cached report with its text and source list</li>
      </DocsList>

      <DocsHeading id="extending-providers">Extending providers</DocsHeading>
      <DocsParagraph>
        New AI providers can be added by extending <code>PROVIDER_CONFIG</code>
        in <code>app/query.py</code> and the <code>PROVIDERS</code> list in
        <code> app/settings/model-provider/page.tsx</code>. New data sources
        and chat channels follow the same connect/list/delete pattern as
        <code> DataSourceConnection</code> and <code>ChatChannel</code>.
      </DocsParagraph>

      <DocsHeading id="contributing">Contributing</DocsHeading>
      <DocsParagraph>
        Open an issue or pull request on{" "}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 underline dark:text-indigo-300"
        >
          GitHub
        </a>
        . The full documentation is also available in the{" "}
        <a
          href={`${REPO_URL}/tree/main/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-indigo-600 underline dark:text-indigo-300"
        >
          /docs folder
        </a>
        .
      </DocsParagraph>
    </DocsLayout>
  );
}