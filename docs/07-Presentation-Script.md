# Cognexa — Presentation Script

**Suggested duration:** 10–12 minutes
**Audience:** Stakeholders / evaluators / class or client presentation

---

## Slide 1 — Title
**[On screen: "Cognexa — Your Documents. Your AI. Your Data."]**

> "Good [morning/afternoon], everyone. My name is [Presenter Name], and today I'm presenting **Cognexa** — a self-hosted, retrieval-augmented AI knowledge base that lets you ask questions about your own documents, without your data ever having to leave your control."

---

## Slide 2 — The Problem
**[On screen: bullet points — "Cloud AI tools don't know your documents", "Sending private files to a third party is risky", "Existing RAG tools are complex to self-host"]**

> "Today, if you want an AI to answer questions about your own files — contracts, research papers, internal docs — you generally have two bad options: paste content manually into a chatbot every time, or upload your private documents to a cloud service you don't fully control.
>
> Cognexa was built to solve this: a knowledge base that runs on your own infrastructure, indexes your documents locally, and only sends data externally if — and only if — you explicitly choose to connect an outside AI provider."

---

## Slide 3 — What Cognexa Does
**[On screen: 3-step diagram — Upload → Index → Ask]**

> "The workflow is simple. First, you upload a document — PDF, Word, or even a scanned image. Second, Cognexa automatically extracts the text and builds a searchable vector index in the background. Third, you ask a question in plain English, and Cognexa answers using only the content of your own documents — with the sources cited."

*(Optional: play the `/public/Product walkthrough.mp4` demo video here, ~60–90 seconds.)*

---

## Slide 4 — Live Demo
**[Switch to live application]**

> "Let me show you this live. I'll upload a document... you can see it immediately shows as 'Processing' — that's happening in the background, so I'm not stuck waiting. A few seconds later, it flips to 'Indexed'.
>
> Now I'll go to Chat and ask a question about this document... and there's the answer, streamed in real time, with the source document listed underneath.
>
> I can also scope a question to one specific document, switch between grid and list view in my knowledge base, and if I ever upload the exact same file twice by mistake, Cognexa catches it and blocks the duplicate automatically."

---

## Slide 5 — Bring Your Own AI
**[On screen: provider logos — OpenAI, Anthropic, Cohere, Gemini, OpenRouter]**

> "By default, Cognexa answers using a local model through Ollama — completely private, zero cloud calls. But if you want more power, you can connect your own API key for OpenAI, Anthropic, Cohere, Google Gemini, OpenRouter, or Cline, and choose per-question which provider answers you."

---

## Slide 6 — Plans & Business Model
**[On screen: pricing table — Community / Pro / Unlimited]**

> "Cognexa ships with three tiers. **Community** is free and self-hosted, with generous limits and 50 free AI questions a month through OpenRouter's free models. **Pro**, at $19 a month, unlocks more documents, more storage, and up to three connected AI providers with unlimited usage on your own key. **Unlimited**, at $49 a month, removes the caps entirely under a fair-use policy.
>
> And this isn't just a pricing page — paid plans genuinely get priority. Under load, a Pro or Unlimited user's document indexing and chat requests are served ahead of Community's, through a real priority-queue scheduler in the backend."

---

## Slide 7 — Under the Hood
**[On screen: architecture diagram — Next.js ↔ FastAPI ↔ MySQL / ChromaDB / Ollama]**

> "Architecturally, Cognexa is a Next.js frontend talking to a FastAPI backend. Documents are chunked and embedded using a local sentence-transformer model, stored in ChromaDB — a local vector database — and relational data like users, chat history, and settings live in MySQL.
>
> One detail I'm particularly proud of: when you ask something like 'list my documents,' Cognexa doesn't rely on fuzzy vector search for that — it answers directly from the database, because that's a factual question, not a similarity question. It's a small thing, but it's the difference between a demo that mostly works and a product that's actually reliable."

---

## Slide 8 — Data Ownership & Trust
**[On screen: bullets — "Export anytime", "Backup & restore", "Delete anytime"]**

> "We also take data ownership seriously. You can export your entire knowledge base as a zip file at any time, back up your account configuration, restore it later, or permanently delete everything — your documents, your chat history, your account — with no vendor lock-in."

---

## Slide 9 — Roadmap
**[On screen: "Coming soon" — Google Drive, GitHub, Notion sync]**

> "Looking ahead, we're planning direct integrations with Google Drive, GitHub, and Notion, so your knowledge base can sync automatically from the tools you already use — those are visible today in Settings as 'coming soon,' and are our next major milestone."

---

## Slide 10 — Closing
**[On screen: "Cognexa — Your Documents. Your AI. Your Data." + team credits]**

> "To summarize: Cognexa gives you a private, self-hosted AI knowledge base that respects your data, scales fairly across plans, and stays reliable even in the edge cases that usually trip up RAG demos.
>
> This project was built by our team — [introduce team members and roles briefly, e.g. Harlyn on planning, Jenilyn on architecture and design, Daryll on development, Reymel on RAG and the knowledge base, and Vincent on testing and QA] — under EACOMN.
>
> Thank you — I'm happy to take any questions."

---

## Appendix — Anticipated Q&A

| Likely Question | Suggested Answer |
|---|---|
| "How is this different from ChatGPT with file upload?" | ChatGPT's file upload is per-conversation and cloud-only. Cognexa maintains a persistent, searchable knowledge base across all your documents, runs locally by default, and lets you swap AI providers per question. |
| "What happens to my data if I connect OpenAI?" | Only the question and the retrieved document context for that specific question are sent to the provider — your files and vector index remain on your own server. |
| "Is billing real?" | Not yet — the current checkout flow is a demo/simulation; integrating a real payment processor is a planned next step. |
| "What if a document gets stuck processing?" | Cognexa can automatically retry it (Auto Re-index), or you can manually trigger a re-index with one click. |
| "Can I self-host this on my own server?" | Yes — that's the core design goal. It requires Python, Node.js, MySQL, and Ollama. |
