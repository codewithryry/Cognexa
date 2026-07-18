# Cognexa — Software Documentation

**Version:** 1.1.0
**Prepared for:** Microsoft Word (copy/paste ready)
**Date:** 2026

---

## 1. Introduction

### 1.1 Purpose
This document describes the Cognexa software system: its purpose, scope, architecture, features, and the plans/tiers under which it is offered. It is intended for project stakeholders, new engineering team members, and reviewers who need a single reference describing what the system is and does.

### 1.2 Scope
Cognexa is a self-hosted Retrieval-Augmented Generation (RAG) knowledge-base platform. Users upload documents (PDF, DOCX, images), Cognexa extracts and indexes their text into a local vector database, and users can then ask natural-language questions that are answered using context retrieved from their own documents — either by a local LLM (Ollama) or by an external AI provider the user connects (OpenAI, Anthropic, Cohere, Google Gemini, OpenRouter, Cline, or a local Ollama/LM Studio endpoint).

### 1.3 Intended Audience
- Product owners and stakeholders evaluating the platform
- Developers onboarding onto the codebase
- QA engineers writing and executing test plans
- System administrators deploying and operating the platform

---

## 2. Product Overview

### 2.1 Problem Statement
General-purpose AI chat tools answer from the model's training data, not from a user's own documents, and typically require sending private data to a third-party cloud service. Cognexa solves both problems: it indexes the user's own files locally and answers strictly from retrieved context, while optionally allowing the user to bring their own AI provider for generation.

### 2.2 Key Capabilities
| Capability | Description |
|---|---|
| Document ingestion | Upload PDF, DOCX, JPG, and PNG files; text is extracted (including OCR for images) automatically |
| Vector indexing | Uploaded text is chunked, embedded (`all-MiniLM-L6-v2`), and stored in a local ChromaDB instance |
| Retrieval-Augmented Chat | Questions are answered using only retrieved document context, streamed token-by-token |
| Local-first inference | A local Ollama model (default `llama3.2`) answers by default — no cloud call required |
| Bring-your-own AI provider | Users may connect OpenAI, Anthropic Claude, Cohere, Google Gemini, OpenRouter, Cline, or a local Ollama/LM Studio endpoint, and select which one answers a given question |
| Priority scheduling | Document indexing and chat generation are served in priority order by plan tier under concurrent load |
| Auto re-index | Documents stuck in "Processing" can be automatically retried |
| Duplicate detection | Byte-identical re-uploads are blocked |
| Document detail view | Each document has its own page showing type, status, size, page count, chunk count, upload date, and an extracted-content preview, with actions to re-index, ask AI about it, download, or delete |
| Chat sessions | Conversations are saved as named, resumable sessions with history, rename, and delete |
| Report generation | Turn a saved chat session or a free-form topic/dataset query into a structured written report, with copy, print, and `.txt`/`.md`/`.docx`/`.pdf` export; reports are cached in the database and locally for instant reload |
| Data source connections | Connect external sources (GitHub is available today; Google Drive is listed as coming soon) so their content can be indexed alongside uploaded documents |
| Chat channel connections | Connect external chat surfaces (Telegram is listed as coming soon) to reach the assistant outside the web app |
| Data management | Users can export their knowledge base, back up and restore their account configuration, and delete data on demand |
| Plan-based limits | Community, Pro, and Unlimited tiers gate document count, storage, AI-provider connections, chat-channel connections, data-source connections, and monthly AI credit usage |

### 2.3 Subscription Plans

| Plan | Price | Documents | Storage | AI Usage | Provider Connections |
|---|---|---|---|---|---|
| **Community** | Free (self-hosted) | Up to 25 | 15 MB | Unlimited via local model; 50 AI questions/month via OpenRouter free models | 1 (OpenRouter free models only) |
| **Pro** | $19/month | Up to 100 | 10 GB | Unlimited (uses the user's own provider API usage) | Up to 3 |
| **Unlimited** | $49/month | Unlimited (Fair Use) | Unlimited (Fair Use) | Unlimited (own API usage) | Unlimited |

All plans additionally receive priority scheduling benefits proportional to tier (Unlimited > Pro > Community) for both document indexing and chat generation.

---

## 3. System Architecture

### 3.1 High-Level Architecture
Cognexa is a two-tier web application:

- **Frontend** — a Next.js 16 (App Router) single-page application, written in TypeScript, styled with Tailwind CSS.
- **Backend** — a FastAPI (Python) REST/SSE API, backed by a MySQL relational database (via SQLAlchemy) and a local ChromaDB vector store.

```
┌─────────────────────┐        HTTPS/JSON + SSE        ┌──────────────────────────┐
│  Next.js Frontend    │  ─────────────────────────────▶│   FastAPI Backend        │
│  (cognexa-web)        │◀───────────────────────────── │   (cognexa-api)          │
└─────────────────────┘                                 └───────────┬──────────────┘
                                                                     │
                                     ┌───────────────────────────────┼───────────────────────────────┐
                                     │                               │                               │
                              ┌──────▼──────┐               ┌────────▼────────┐             ┌────────▼────────┐
                              │   MySQL     │               │    ChromaDB      │             │  Ollama /        │
                              │ (relational │               │ (vector store,   │             │  External AI      │
                              │  data)      │               │  local, on disk)  │             │  Providers        │
                              └─────────────┘               └──────────────────┘             └──────────────────┘
```

### 3.2 Technology Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16.2.10 (App Router), React 19.2.4 |
| Frontend styling | Tailwind CSS v4 |
| Frontend language | TypeScript 5 |
| Backend framework | FastAPI 0.139.2 (Python), Uvicorn ASGI server |
| ORM / Database driver | SQLAlchemy 2.0.51, PyMySQL |
| Relational database | MySQL |
| Vector database | ChromaDB 1.5.9 (local, persistent, on-disk) |
| Embedding model | `sentence-transformers` (`all-MiniLM-L6-v2`) |
| Local LLM runtime | Ollama (default model `llama3.2`) |
| Document parsing | `pypdf` (PDF), `python-docx` (DOCX), `pytesseract` + Pillow (image OCR) |
| Auth | JWT (`python-jose`), `bcrypt` password hashing |

### 3.3 Core Backend Modules

| Module | Responsibility |
|---|---|
| `app/main.py` | FastAPI application, all HTTP/SSE route handlers, plan/credit/priority enforcement |
| `app/models.py` | SQLAlchemy ORM models (users, documents, settings, integrations, chat_messages) |
| `app/schemas.py` | Pydantic request/response schemas |
| `app/auth.py` | Password hashing, JWT issuance/verification, current-user dependency |
| `app/database.py` | SQLAlchemy engine/session configuration |
| `app/rag.py` | Document chunking, embedding, and ChromaDB indexing/deletion |
| `app/query.py` | Retrieval (similarity search across chunks) and answer generation (local Ollama or external provider streaming), plus session-based and dataset/topic-based report generation |
| `app/scheduler.py` | Priority-based background worker pool (indexing) and priority slot gate (chat generation) |

### 3.3.1 Data Model (`app/models.py`)

| Model | Purpose |
|---|---|
| `User` | Account credentials and profile |
| `Document` | Uploaded file metadata, extracted preview, chunk count |
| `Settings` | Per-user Ollama/model/chunking/theme/automation preferences |
| `Integration` | Saved external AI-provider connections (OpenAI, Anthropic, Cohere, Gemini, OpenRouter, Cline, Ollama/LM Studio) |
| `DataSourceConnection` | Saved external data-source connections (e.g. GitHub) |
| `ChatChannel` | Saved external chat-channel connections (e.g. Telegram) |
| `ChatSession` | A named, saved chat conversation |
| `ChatMessage` | Individual question/answer turns, linked to a `ChatSession` |
| `GeneratedReport` | A cached report (from a chat session or a dataset/topic query), with its text and source list |

### 3.4 Data Flow — Document Upload
1. User uploads a file via the frontend Upload page.
2. Backend validates plan limits (document count, storage) and duplicate detection (SHA-256 content hash).
3. File is saved to disk; text is extracted synchronously (fast, needed for the preview/response).
4. A `Document` row is created with `chunks = 0` ("Processing").
5. The heavy chunk + embed + store step is submitted to the priority worker pool (`app/scheduler.py`), so the HTTP request returns immediately.
6. A background worker processes the job (higher-plan jobs are dequeued first under load), updating `chunks` when complete.
7. The frontend polls the document list until `chunks > 0` ("Indexed").

### 3.5 Data Flow — Chat / Ask
1. User submits a question, optionally scoped to specific documents and/or a specific AI provider integration.
2. Backend resolves the source: local Ollama, a specific saved integration, or "auto" (most recent integration if usable).
3. For "list my documents"-style questions, the backend answers directly from the documents table (bypassing vector search, since it is a metadata question, not a content question).
4. Otherwise, the backend performs similarity search against ChromaDB, retrieving a fair, round-robin distribution of chunks across every relevant document (not just the single most-similar document).
5. Generation (local or external) is streamed back to the client as Server-Sent Events, gated by a priority slot so paid plans are served first under concurrent load.
6. The full exchange is saved to `chat_messages`, linked to a `chat_sessions` row so the conversation can be resumed, renamed, or deleted later.

### 3.6 Data Flow — Report Generation
1. From the Report page, the user either picks a saved chat session ("Generate from a chat") or enters a free-form topic optionally scoped to specific documents ("Generate from your Dataset").
2. The backend (`POST /report/session` or `POST /report/dataset`) retrieves the relevant context — the session's Q&A history, or a fresh similarity search over the dataset/scoped documents — and asks the configured AI provider to synthesize a structured report.
3. The generated report and its source list are persisted (`generated_reports` table) and returned to the client, which also caches it in `localStorage` for instant reload across page visits.
4. The user can copy, print, or export the report as `.txt`, `.md`, `.docx`, or `.pdf` (`POST /report/export`).

---

## 4. Feature Summary by Module

- **Authentication** — email/password registration and login, JWT bearer tokens, idle auto-logout after 1 hour of inactivity.
- **Document Management** — upload, list, preview, download, delete, bulk-delete, and re-index; grid or list view; search, filter by type, and sort; a dedicated document detail page (`/knowledge-base/[id]`) shows type, status, size, page count, chunk count, upload date, and an extracted-content preview, with quick actions to re-index, jump into Chat scoped to that document, download, or delete.
- **Chat** — streaming Q&A, per-question document scoping, provider selection (Auto / Local / a specific saved integration), markdown-stripped plain-text answers, saved/named chat sessions with history, rename, and delete.
- **Reports** — generate a structured written report either from a saved chat session or from a free-form topic/dataset query (optionally scoped to specific documents); preview, regenerate, copy, print, and export as `.txt`, `.md`, `.docx`, or `.pdf`; reports are cached both server-side and in the browser for instant reload.
- **Settings (now split into sub-pages under one layout, `/settings/*`)**:
  - *Account* (`/settings`) — name, email (read-only), password change.
  - *Model Provider* (`/settings/model-provider`) — Ollama connection/model configuration and saved AI-provider integrations (OpenAI, Anthropic Claude, Cohere, Google Gemini, OpenRouter, Cline, or local Ollama/LM Studio), limited by plan.
  - *Chat Channels* (`/settings/chat-channels`) — connect external chat surfaces (Telegram, listed as coming soon), limited by plan.
  - *Billing* (`/settings/billing`) — the demo checkout flow to switch between Community, Pro, and Unlimited plans; usage bars for documents, storage, and AI credits.
  - *Automation* (`/settings/automation`) — chunking parameters, theme, notification preferences, automation toggles (auto re-index, duplicate detection).
  - *Data Sources* (`/settings/data-sources`) — connect external content sources (GitHub is available; Google Drive is listed as coming soon), limited by plan.
  - *Data Management* (`/settings/data-management`) — export knowledge base as a `.zip`, export/restore an account backup as `.json`, delete all documents, delete account.
- **Setup guidance** — a one-time warning banner nudges Community-plan users who have no AI provider connected yet toward Settings > Model Provider (or OpenRouter's free tier) before they try to use the assistant.
- **Dashboard** — usage statistics (documents, chunks, storage, questions asked today).

---

## 5. Non-Functional Characteristics

| Characteristic | Notes |
|---|---|
| Data residency | Documents, embeddings, and chat history are stored on the self-hosted server; no data leaves the deployment unless the user explicitly connects an external AI provider |
| Multi-tenancy | All resources are scoped by `user_id`; no cross-user data access exists in any endpoint |
| Concurrency fairness | A priority-queue and priority-slot mechanism ensures paid plans are not starved by Community-plan load, without denying Community users service |
| Extensibility | New AI providers can be added by extending `PROVIDER_CONFIG` in `app/query.py` and the `PROVIDERS` list in `app/settings/model-provider/page.tsx`; new data sources and chat channels follow the same connect/list/delete pattern as `DataSourceConnection` and `ChatChannel` |
