"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "uploading-documents", label: "Uploading documents" },
  { id: "managing-datasets", label: "Managing datasets" },
  { id: "chatting-with-your-data", label: "Chatting with your data" },
  { id: "generating-reports", label: "Generating reports" },
  { id: "managing-chat-sessions", label: "Managing chat sessions" },
  { id: "document-detail-view", label: "Document detail view" },
  { id: "dashboard-overview", label: "Dashboard overview" },
];

export default function UserGuides() {
  return (
    <DocsLayout activeHref="/docs/user-guides" toc={TOC}>
      <DocsCrumb label="User guides" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">User guides</h1>

      <DocsParagraph>
        Everyday walkthroughs for using Cognexa once it's up and
        running &mdash; uploading files, organizing datasets, chatting with
        your knowledge base, and generating reports.
      </DocsParagraph>

      <DocsHeading id="uploading-documents">Uploading documents</DocsHeading>
      <DocsParagraph>
        Go to the Upload page, drag in PDFs, DOCX files, or images, and
        Cognexa will parse, chunk, and index the text automatically.
      </DocsParagraph>

      <DocsList>
        <li>
          <strong>Supported formats</strong> &mdash; PDF (.pdf), Word documents (.docx),
          and images (.jpg, .png) with OCR via Tesseract
        </li>
        <li>
          <strong>Background processing</strong> &mdash; After upload, files are
          chunked, embedded using <code>all-MiniLM-L6-v2</code>, and stored in
          ChromaDB by a background worker pool
        </li>
        <li>
          <strong>Duplicate detection</strong> &mdash; Byte-identical re-uploads
          are automatically blocked via SHA-256 content hash
        </li>
        <li>
          <strong>Auto re-index</strong> &mdash; Documents stuck in &ldquo;Processing&rdquo;
          status can be automatically retried from the document list
        </li>
        <li>
          <strong>Plan limits</strong> &mdash; Your plan determines maximum
          document count (25 Free, 100 Pro, Unlimited) and storage capacity
        </li>
      </DocsList>

      <DocsHeading id="managing-datasets">Managing datasets</DocsHeading>
      <DocsParagraph>
        Datasets group related documents together. Create a new dataset from
        the Dataset page, then upload files into it to keep separate
        projects or topics organized.
      </DocsParagraph>
      <DocsList>
        <li>Create and name datasets to organize documents by project, topic, or department</li>
        <li>Scope chat queries to one or more datasets so answers draw only from relevant documents</li>
        <li>View storage usage per dataset and remove documents no longer needed</li>
        <li>Re-index a dataset after bulk changes to refresh the vector store</li>
      </DocsList>

      <DocsHeading id="chatting-with-your-data">Chatting with your data</DocsHeading>
      <DocsParagraph>
        The Chat page lets you ask questions in plain language and get answers
        grounded in your uploaded documents, with citations back to the source.
      </DocsParagraph>
      <DocsList>
        <li>Open Chat and start a new session</li>
        <li>Ask a question in plain language</li>
        <li>
          <strong>Scope your questions</strong> &mdash; Optionally restrict answers
          to specific documents or datasets for more targeted responses
        </li>
        <li>
          <strong>Choose a provider</strong> &mdash; Select between local Ollama
          or any connected cloud provider (OpenAI, Anthropic, etc.) for each question
        </li>
        <li>
          <strong>Streaming answers</strong> &mdash; Responses are streamed
          token-by-token via Server-Sent Events (SSE) for real-time display
        </li>
        <li>Answers are grounded in your uploaded documents, with sources cited</li>
      </DocsList>

      <DocsHeading id="generating-reports">Generating reports</DocsHeading>
      <DocsParagraph>
        Use the Report page to synthesize structured written reports from either
        a saved chat session or a custom topic query against your dataset.
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>From a chat session</strong> &mdash; Pick a saved conversation
          and generate a report summarizing the Q&A history
        </li>
        <li>
          <strong>From your dataset</strong> &mdash; Enter a free-form topic,
          optionally scoped to specific documents, and generate a fresh report
          based on similarity search results
        </li>
        <li>
          <strong>Export options</strong> &mdash; Copy, print, or export as
          .txt, .md, .docx, or .pdf
        </li>
        <li>
          <strong>Caching</strong> &mdash; Reports are cached both server-side
          and in the browser for instant reload across visits
        </li>
      </DocsList>

      <DocsHeading id="managing-chat-sessions">Managing chat sessions</DocsHeading>
      <DocsParagraph>
        All conversations are saved automatically and can be managed from the
        Chat page:
      </DocsParagraph>
      <DocsList>
        <li>View your full conversation history across all sessions</li>
        <li>Resume a previous session to pick up where you left off</li>
        <li>Rename sessions for easy identification</li>
        <li>Delete sessions you no longer need</li>
      </DocsList>

      <DocsHeading id="document-detail-view">Document detail view</DocsHeading>
      <DocsParagraph>
        Each uploaded document has its own detail page accessible from the
        knowledge base or document list:
      </DocsParagraph>
      <DocsList>
        <li>Document type, status (Processing / Indexed), and file size</li>
        <li>Page count (for PDFs) and chunk count in the vector store</li>
        <li>Upload date and extracted content preview</li>
        <li>Quick actions: re-index, chat scoped to this document, download, or delete</li>
      </DocsList>

      <DocsHeading id="dashboard-overview">Dashboard overview</DocsHeading>
      <DocsParagraph>
        The Dashboard provides a snapshot of your Cognexa usage at a glance:
      </DocsParagraph>
      <DocsList>
        <li>Total documents uploaded and chunks indexed</li>
        <li>Storage consumption against your plan limit</li>
        <li>Questions asked today and total</li>
      </DocsList>
    </DocsLayout>
  );
}