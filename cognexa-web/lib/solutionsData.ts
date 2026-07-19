export type Solution = {
  slug: string;
  title: string;
  tagline: string;
  comingSoon: boolean;
  overview: string;
  benefits: string[];
  useCases: { title: string; description: string }[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: "knowledge-intelligence",
    title: "Knowledge Intelligence",
    tagline: "Turn scattered documents into a single, searchable source of truth.",
    comingSoon: false,
    overview:
      "Cognexa indexes everything you upload — PDFs, DOCX files, and images — into a local vector store, so your team can ask questions in plain language and get answers grounded in your own content instead of general model knowledge.",
    benefits: [
      "Unified search across every document you've uploaded, regardless of file type",
      "Answers are grounded in your own content, with no external API keys required by default",
      "Runs entirely on a local Ollama LLM and ChromaDB vector store — nothing leaves your machine",
      "New documents are indexed automatically as soon as they're uploaded",
    ],
    useCases: [
      {
        title: "Internal wiki replacement",
        description:
          "Stop hunting through folders and chat threads — ask a question and get an answer sourced directly from your team's own documents.",
      },
      {
        title: "Faster onboarding",
        description:
          "Give new hires a single place to ask questions about processes, tools, and policies instead of pinging teammates.",
      },
      {
        title: "Policy & compliance lookup",
        description:
          "Quickly surface the exact clause or section from a policy document instead of skimming pages manually.",
      },
    ],
  },
  {
    slug: "document-analysis",
    title: "Document Analysis",
    tagline: "Extract structure and meaning from PDFs, DOCX files, and scanned images.",
    comingSoon: false,
    overview:
      "When you upload a document, Cognexa parses and chunks its text automatically — including image-based content — so it can be embedded, indexed, and retrieved precisely when it's relevant to a question.",
    benefits: [
      "Automatic text extraction and chunking for PDFs, DOCX files, and images",
      "Consistent handling across file types, without manual formatting or cleanup",
      "Chunk-level indexing means retrieval pulls the exact relevant passage, not the whole document",
      "Processed locally — no document ever needs to be sent to a third party to be analyzed",
    ],
    useCases: [
      {
        title: "Contract & report review",
        description:
          "Upload lengthy PDFs and ask targeted questions instead of reading the whole document end to end.",
      },
      {
        title: "Scanned document search",
        description:
          "Bring in scanned or image-based files and still be able to search their contents like any other document.",
      },
      {
        title: "Research digesting",
        description:
          "Feed in a batch of papers or reports and quickly pull out the sections relevant to your question.",
      },
    ],
  },
  {
    slug: "ai-research",
    title: "AI Research",
    tagline: "Ask questions across large document sets and get cited, grounded answers.",
    comingSoon: false,
    overview:
      "Cognexa's retrieval-augmented question answering lets you query across your entire dataset at once. Every answer is generated from retrieved passages, so you can trace a claim back to the document it came from.",
    benefits: [
      "Ask questions in plain language across your whole document set, not one file at a time",
      "Retrieval-augmented answers reduce hallucination compared to relying on a model's memory alone",
      "Works with the free local model, or an API-key-based provider connected in Settings",
      "Chat sessions and datasets can be turned into shareable reports",
    ],
    useCases: [
      {
        title: "Literature & document review",
        description:
          "Ask cross-cutting questions across a whole corpus of papers, reports, or filings instead of reading each one individually.",
      },
      {
        title: "Compliance & audit review",
        description:
          "Trace an answer back to the source document and passage it was grounded in.",
      },
      {
        title: "Research report generation",
        description:
          "Turn a chat session exploring a dataset into an exportable report in TXT, Markdown, DOCX, or PDF.",
      },
    ],
  },
  {
    slug: "ai-customer-support",
    title: "AI Customer Support",
    tagline: "A support assistant trained on your own docs, ready to answer customers directly.",
    comingSoon: false,
    overview:
      "We're extending Cognexa's retrieval-augmented core into a customer-facing assistant — one that answers directly from your product docs and support content, with the same grounding guarantees your internal team already relies on.",
    benefits: [
      "Answers grounded in your own product documentation and help content",
      "Consistent tone and accuracy across every customer conversation",
      "Designed to sit alongside your existing support tools rather than replace them",
      "Same self-hosted, private-by-default foundation as the rest of Cognexa",
    ],
    useCases: [
      {
        title: "Tier-1 support deflection",
        description:
          "Handle common, documented questions automatically so your team can focus on the harder ones.",
      },
      {
        title: "In-product help",
        description:
          "Let customers ask questions directly from within your product instead of searching a help center.",
      },
      {
        title: "Consistent answers at scale",
        description:
          "Every response traces back to the same source documentation, no matter who — or what — is answering.",
      },
    ],
  },
];

export function getSolution(slug: string) {
  return SOLUTIONS.find((s) => s.slug === slug);
}
