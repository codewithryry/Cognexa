"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList, REPO_URL } from "@/components/DocsLayout";

const TOC = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "start-the-server", label: "Start the server" },
  { id: "configure-llms", label: "Configure LLMs" },
  { id: "create-your-first-dataset", label: "Create your first dataset" },
  { id: "upload-and-index-files", label: "Upload and index files" },
  { id: "chat-with-your-data", label: "Chat with your data" },
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
        data — running entirely on your own machine.
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
        <li>Node.js and Python installed locally</li>
        <li>Ollama running for local model inference</li>
        <li>ChromaDB for local vector storage</li>
      </DocsList>

      <DocsHeading id="start-the-server">Start the server</DocsHeading>
      <DocsParagraph>
        Clone the repository, install dependencies, and start the Next.js
        frontend and FastAPI backend. See the README for exact commands for
        your platform.
      </DocsParagraph>

      <DocsHeading id="configure-llms">Configure LLMs</DocsHeading>
      <DocsParagraph>
        Stay on the free local Ollama model, or connect a hosted provider
        (OpenAI, Anthropic, Cohere, Gemini, Groq, OpenRouter, and more) from
        Settings → Model Provider.
      </DocsParagraph>

      <DocsHeading id="create-your-first-dataset">Create your first dataset</DocsHeading>
      <DocsParagraph>
        Create a dataset to group related documents together before
        uploading files.
      </DocsParagraph>

      <DocsHeading id="upload-and-index-files">Upload and index files</DocsHeading>
      <DocsParagraph>
        Drop in PDFs, DOCX files, or images. Cognexa extracts the text,
        chunks it, and indexes it automatically.
      </DocsParagraph>

      <DocsHeading id="chat-with-your-data">Chat with your data</DocsHeading>
      <DocsParagraph>
        Ask questions in plain language and get answers grounded in your
        uploaded documents, with citations back to the source.
      </DocsParagraph>
    </DocsLayout>
  );
}
