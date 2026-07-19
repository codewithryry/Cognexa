"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "uploading-documents", label: "Uploading documents" },
  { id: "managing-datasets", label: "Managing datasets" },
  { id: "chatting-with-your-data", label: "Chatting with your data" },
  { id: "generating-reports", label: "Generating reports" },
];

export default function UserGuides() {
  return (
    <DocsLayout activeHref="/docs/user-guides" toc={TOC}>
      <DocsCrumb label="User guides" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">User guides</h1>

      <DocsParagraph>
        Everyday walkthroughs for using Cognexa once it&apos;s up and
        running — uploading files, organizing datasets, and chatting with
        your knowledge base.
      </DocsParagraph>

      <DocsHeading id="uploading-documents">Uploading documents</DocsHeading>
      <DocsParagraph>
        Go to Upload, drag in PDFs, DOCX files, or images, and Cognexa will
        parse, chunk, and index the text automatically.
      </DocsParagraph>

      <DocsHeading id="managing-datasets">Managing datasets</DocsHeading>
      <DocsParagraph>
        Datasets group related documents together. Create a new dataset from
        the Dataset page, then upload files into it to keep separate
        projects or topics organized.
      </DocsParagraph>

      <DocsHeading id="chatting-with-your-data">Chatting with your data</DocsHeading>
      <DocsList>
        <li>Open Chat and start a new session</li>
        <li>Ask a question in plain language</li>
        <li>Answers are grounded in your uploaded documents, with sources cited</li>
      </DocsList>

      <DocsHeading id="generating-reports">Generating reports</DocsHeading>
      <DocsParagraph>
        Use the Report page to summarize findings or export insights drawn
        from your dataset for sharing with your team.
      </DocsParagraph>
    </DocsLayout>
  );
}
