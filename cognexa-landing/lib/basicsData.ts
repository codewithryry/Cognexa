export type BasicsArticle = {
  slug: string;
  title: string;
  summary: string;
  body: string;
};

export const BASICS_ARTICLES: BasicsArticle[] = [
  {
    slug: "what-is-cognexa",
    title: "What is Cognexa?",
    summary: "A quick introduction to what Cognexa does and who it's for.",
    body: `Cognexa is a self-hosted platform that turns your own documents into a searchable, question-answerable dataset.

You upload PDFs, DOCX files, or images, and Cognexa extracts and indexes their text. From there, you can ask questions in plain language and get answers grounded in your own content — not just whatever a general-purpose model happens to know.

## Why self-hosted matters

On the free plan, everything runs locally through **Ollama** and **ChromaDB** — your documents never have to leave your machine. If you want to connect a hosted model provider instead, you can do that too, from Settings.

## Who it's for

Cognexa fits teams and individuals who want an internal knowledge base, a research assistant over their own documents, or a foundation for a support assistant — without handing their data to a third party by default.`,
  },
  {
    slug: "what-is-rag",
    title: "What is Retrieval-Augmented Generation (RAG)?",
    summary: "The core technique behind how Cognexa answers questions.",
    body: `Large language models are good at general knowledge, but they can't see your private documents — they only know what they were trained on.

**Retrieval-Augmented Generation (RAG)** solves this by retrieving the most relevant pieces of your own content *before* asking the model to answer. Instead of relying purely on memory, the model is given real evidence to work from.

## How it works, roughly

1. Your documents are split into smaller chunks and embedded into a vector store.
2. When you ask a question, Cognexa finds the chunks most relevant to it.
3. Those chunks are passed to the model as context, along with your question.
4. The model answers using that context — so the answer is grounded in your own data.

## Why it matters

RAG means answers can be traced back to a real source in your dataset, instead of being an ungrounded guess. It's also what makes it possible to ask questions over documents a model was never trained on.`,
  },
  {
    slug: "what-is-an-ai-agent",
    title: "What is an AI Agent?",
    summary: "How \"agent\" style assistants differ from a single chat reply.",
    body: `An AI agent is a system that can use tools, take multiple steps, and pull in outside context to complete a task — rather than just generating a single reply from a prompt.

## Agents vs. a single chat message

A plain chat request answers from what the model already knows (plus whatever you typed). An agent, by contrast, might retrieve documents, call another tool, or take several steps before producing a final answer.

## Where this shows up in Cognexa

Cognexa's chat is retrieval-augmented: before answering, it looks up relevant chunks from your dataset, which is one of the core building blocks agent-style systems rely on. You can also connect Cognexa to external AI assistants like Cline from Settings, so they can pull project context before prompting — letting an external agent use Cognexa as a knowledge source.`,
  },
  {
    slug: "how-cognexa-works",
    title: "How Cognexa Works",
    summary: "A walkthrough of the upload-to-answer pipeline.",
    body: `Cognexa's core loop has three steps: upload, index, and ask.

## 1. Upload your documents

PDFs, Word files, and images are parsed and chunked automatically the moment you upload them.

## 2. Cognexa builds the index

Each chunk of text is embedded and stored in a local vector database (ChromaDB), so it can be retrieved quickly based on meaning, not just keyword matching.

## 3. Ask, and get grounded answers

When you ask a question, Cognexa retrieves the most relevant chunks and passes them to the model — local via Ollama, or a connected provider — to generate an answer sourced from your own files.

## Beyond a single answer

From a chat session or dataset, you can also generate a report and export it as TXT, Markdown, DOCX, or PDF — turning a conversation into something shareable.`,
  },
  {
    slug: "understanding-knowledge-bases",
    title: "Understanding Knowledge Bases",
    summary: "What a \"knowledge base\" means in the context of Cognexa.",
    body: `In Cognexa, a knowledge base is the set of documents you've uploaded and indexed — the dataset your questions get answered against.

## What goes into it

Any PDF, DOCX file, or image you upload becomes part of your searchable dataset once it's indexed. There's no separate step to "publish" it — indexing happens automatically on upload.

## Why it's different from a folder of files

A folder of files is only searchable by filename or manual browsing. A Cognexa knowledge base is searchable by *meaning* — you can ask a question in plain language and get back the passage that actually answers it, even if it doesn't share any exact keywords with your question.

## Keeping it useful

A knowledge base is only as good as what's in it. Removing outdated documents and uploading current ones keeps the answers you get accurate and relevant.`,
  },
  {
    slug: "documents-and-data-sources",
    title: "Documents & Data Sources",
    summary: "What file types Cognexa supports and how they're handled.",
    body: `Cognexa currently accepts three kinds of input: **PDFs**, **DOCX** files, and **images**.

## PDFs and DOCX

Text is extracted directly from the document structure, then split into chunks sized for accurate retrieval.

## Images

Image-based documents — like scanned pages — are processed so their text content becomes searchable the same way a native PDF or DOCX would be.

## Managing your sources

You can browse and manage everything you've uploaded from the Dataset section, and remove documents that are no longer relevant. Free plans have a document and storage cap; paid plans raise or remove that ceiling depending on the tier.`,
  },
  {
    slug: "prompt-engineering-basics",
    title: "Prompt Engineering Basics",
    summary: "How to ask better questions and get better answers.",
    body: `Retrieval-augmented answers are only as good as the question you ask. A few habits go a long way.

## Be specific

"What does the contract say about termination notice periods?" retrieves more precisely than "Tell me about the contract."

## Ask one thing at a time

Splitting a multi-part question into separate questions usually retrieves more relevant chunks for each part than one broad question trying to cover everything at once.

## Reference the document if you know it

If you know which document should contain the answer, mentioning it in your question helps retrieval find the right chunk faster, especially in a large dataset.

## Iterate

If an answer feels incomplete, rephrasing or narrowing the question is usually faster than assuming the information isn't in your dataset at all.`,
  },
  {
    slug: "faqs",
    title: "Frequently Asked Questions",
    summary: "Quick answers to the questions new users ask most.",
    body: `## Do I need to know anything technical to use Cognexa?

No. Uploading documents and asking questions works the same as using any chat interface — no setup beyond signing in and adding files.

## Is my data private?

On the Free plan, everything runs locally through Ollama and ChromaDB, so your documents never leave your machine. Paid plans that connect a hosted provider send prompts to that provider per its own terms.

## What file types can I upload?

PDFs, DOCX files, and images are supported today.

## Do I need a GPU?

No, but a GPU speeds up local inference through Ollama. CPU-only setups work fine for smaller models and datasets.

## Where do I go for deeper technical detail?

The [Documentation](/docs) covers setup, administration, and developer-facing details in more depth than this page.`,
  },
];

export function getBasicsArticle(slug: string) {
  return BASICS_ARTICLES.find((a) => a.slug === slug);
}
