"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList, REPO_URL } from "@/components/DocsLayout";

const TOC = [
  { id: "project-structure", label: "Project structure" },
  { id: "running-locally", label: "Running locally" },
  { id: "backend-api", label: "Backend API" },
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
        Cognexa&apos;s frontend is Next.js, backed by a FastAPI service that
        handles document parsing, ChromaDB indexing, and LLM calls (local
        Ollama or hosted providers).
      </DocsParagraph>

      <DocsHeading id="project-structure">Project structure</DocsHeading>
      <DocsList>
        <li><code>cognexa-web/</code> — Next.js frontend (App Router)</li>
        <li><code>components/</code> — shared UI components</li>
        <li><code>lib/</code> — API client, auth, theme, and dialog contexts</li>
      </DocsList>

      <DocsHeading id="running-locally">Running locally</DocsHeading>
      <DocsParagraph>
        Install dependencies and run the dev server with your usual Node
        package manager, then point the frontend at your local FastAPI
        backend.
      </DocsParagraph>

      <DocsHeading id="backend-api">Backend API</DocsHeading>
      <DocsParagraph>
        The backend exposes REST endpoints for uploads, datasets, chat
        sessions, and settings that the frontend calls through the shared API
        client in <code>lib/api.ts</code>.
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
        .
      </DocsParagraph>
    </DocsLayout>
  );
}
