# Cognexa — Technical Documentation

**Version:** 1.0.0
**Audience:** Software Engineers

---

## 1. Repository Structure

```
Cognexa/
├── cognexa-api/                 FastAPI backend
│   ├── app/
│   │   ├── main.py              Route handlers, plan/credit/priority logic
│   │   ├── models.py            SQLAlchemy ORM models
│   │   ├── schemas.py           Pydantic request/response schemas
│   │   ├── auth.py              JWT + password hashing
│   │   ├── database.py          Engine/session setup
│   │   ├── rag.py               Chunking, embedding, ChromaDB indexing
│   │   ├── query.py             Retrieval + LLM generation (local & external)
│   │   ├── scheduler.py         Priority worker pool + priority slot gate
│   │   ├── uploads/             Uploaded original files (runtime-created)
│   │   └── vector_db/           ChromaDB persistent store (runtime-created)
│   ├── requirements.txt
│   └── migration_*.sql          Hand-authored schema migrations for existing tables
└── cognexa-web/                 Next.js frontend
    ├── app/                     App Router pages (/, /login, /dashboard, /chat, /upload,
    │                            /knowledge-base, /settings)
    ├── components/               Shared UI components (modals, filters, nav)
    ├── lib/                      api.ts (typed API client), AuthContext, DialogContext
    └── public/                   Static assets
```

---

## 2. Database Schema

### 2.1 `users`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) | UNIQUE, indexed |
| password | VARCHAR(255) | bcrypt hash |
| plan | VARCHAR(20) | `community` \| `pro` \| `team` (default `community`) |
| ai_credits_used | INTEGER | Community-plan OpenRouter usage counter |
| ai_credits_period_start | TIMESTAMP (nullable) | Start of the current 30-day credit period |
| created_at | TIMESTAMP | server default now() |

### 2.2 `documents`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| project_id | INTEGER (nullable) | Reserved/unused |
| user_id | INTEGER FK → users.id | |
| filename | VARCHAR(255) | |
| file_path | TEXT | Path on disk |
| file_type | VARCHAR(50) | `pdf` \| `docx` \| `image` |
| chunks | INTEGER | 0 while "Processing"; > 0 once indexed |
| preview | TEXT (nullable) | First ~1000 characters of extracted text |
| size_bytes | INTEGER (nullable) | |
| page_count | INTEGER (nullable) | PDF only |
| content_hash | VARCHAR(64), indexed (nullable) | SHA-256 of raw file bytes, for duplicate detection |
| created_at | TIMESTAMP | |

### 2.3 `settings` (one row per user)
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | UNIQUE |
| ollama_url | VARCHAR(255) | default `http://localhost:11434` |
| llm_model | VARCHAR(100) | default `llama3.2` |
| embedding_model | VARCHAR(100) | default `all-MiniLM-L6-v2` |
| chunk_size | INTEGER | default 500 |
| chunk_overlap | INTEGER | default 50 |
| theme | VARCHAR(20) | default `dark` |
| email_notifications | BOOLEAN | default true |
| auto_reindex_stuck | BOOLEAN | default false |
| duplicate_detection | BOOLEAN | default true |
| updated_at | TIMESTAMP | onupdate now() |

### 2.4 `integrations`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| provider_name | VARCHAR(100) | e.g. `OpenAI`, `OpenRouter`, `Cline` |
| api_key | VARCHAR(255) (nullable) | |
| base_url | VARCHAR(255) (nullable) | Used for local providers (e.g. Ollama) |
| model | VARCHAR(100) (nullable) | |
| created_at | TIMESTAMP | |

### 2.5 `chat_messages`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| user_id | INTEGER FK → users.id | |
| question | TEXT | |
| answer | TEXT | |
| sources | TEXT (nullable) | Comma-separated filenames |
| created_at | TIMESTAMP | |

---

## 3. API Reference

Base URL: configurable (default `http://127.0.0.1:8000`). All endpoints except `/auth/register`, `/auth/login`, `/health`, `/health/db` require an `Authorization: Bearer <JWT>` header.

### 3.1 Auth
| Method & Path | Body | Response |
|---|---|---|
| `POST /auth/register` | `{name, email, password}` | `{access_token, token_type, user}` |
| `POST /auth/login` | `{email, password}` | `{access_token, token_type, user}` |
| `GET /auth/me` | — | `UserOut` |
| `PATCH /auth/me` | `{name, password?}` | `UserOut` |

### 3.2 Documents
| Method & Path | Body | Response |
|---|---|---|
| `POST /upload` | multipart file | `{id, filename, characters, chunks_saved: 0, processing: true, preview}` |
| `GET /documents` | — | `DocumentOut[]` |
| `GET /documents/{id}/download` | — | File stream |
| `POST /documents/{id}/reindex` | — | `{queued: true}` |
| `DELETE /documents/{id}` | — | `{deleted: id}` |
| `DELETE /documents` | — | `{deleted: count}` (bulk) |

### 3.3 Chat
| Method & Path | Query Params | Response |
|---|---|---|
| `POST /ask` | `question`, `document_ids[]?`, `source` (`auto`\|`local`\|`integration`), `integration_id?` | `text/event-stream` — SSE events: `{type:"sources", sources}`, `{type:"token", content}`, `{type:"done", sources}`, `{type:"error", message}` |
| `GET /chat/history` | — | `ChatMessageOut[]` |
| `DELETE /chat/history` | — | `{cleared: true}` |

### 3.4 Settings
| Method & Path | Body | Response |
|---|---|---|
| `GET /settings` | — | `SettingsOut` |
| `PUT /settings` | `SettingsIn` | `SettingsOut` |

### 3.5 Integrations
| Method & Path | Body | Response |
|---|---|---|
| `GET /integrations` | — | `IntegrationOut[]` |
| `POST /integrations` | `{provider_name, api_key?, base_url?, model?}` | `IntegrationOut` |
| `DELETE /integrations/{id}` | — | `{deleted: id}` |

### 3.6 Billing
| Method & Path | Body | Response |
|---|---|---|
| `GET /billing/plan` | — | `PlanOut` (plan, max_documents, max_storage_bytes, document_count, storage_bytes, max_ai_credits, ai_credits_remaining) |
| `POST /billing/subscribe` | `{plan, card_number?, card_expiry?, card_cvc?}` | `PlanOut` |

### 3.7 Data Management
| Method & Path | Body | Response |
|---|---|---|
| `GET /data/export` | — | `.zip` stream (documents + manifest.json) |
| `GET /data/backup` | — | `.json` (settings, chat_messages, integrations — no API keys) |
| `POST /data/restore` | multipart JSON file | `{restored_chat_messages, restored_integrations}` |
| `DELETE /account` | — | `{deleted: true}` |

### 3.8 Stats
| Method & Path | Response |
|---|---|
| `GET /stats` | `{total_documents, total_chunks, questions_today, storage_bytes}` |

---

## 4. Key Algorithms

### 4.1 Retrieval Fairness (`app/query.py: search_document`)
Naively taking Chroma's top-K similarity results across an entire knowledge base can let one large or highly-relevant document crowd out others. `search_document` instead:
1. Enumerates every document the user owns (or the explicitly-scoped subset).
2. Runs a **separate** similarity query per document, capped at a `per_doc_pool` size.
3. Merges results **round-robin** across documents (one chunk per document per round, up to `per_doc_cap`) rather than a flat similarity-ranked list — so truncation to the final `limit` cannot silently drop an entire document's representation.

### 4.2 Metadata Questions ("List my documents")
`is_document_listing_question` matches phrasings like "list/what/which/how many ... documents/files ...". These bypass vector search entirely and are answered directly from the `documents` table — because embedding similarity has no reliable way to guarantee every document surfaces for a purely enumerative question.

### 4.3 Priority Scheduling (`app/scheduler.py`)
- **`PriorityWorkerPool`**: a `queue.PriorityQueue` of `(priority, sequence, fn, args, kwargs)` tuples, drained by N background daemon threads. Lower `priority` value (team=0, pro=1, community=2) is dequeued first; `sequence` (a monotonic counter) preserves FIFO order within the same priority.
- **`PrioritySlotGate`**: a capacity-limited semaphore-like gate. When all slots are in use, a waiter is pushed onto a min-heap keyed by `(priority, sequence)`; on release, the highest-priority (lowest value) waiter is granted the freed slot — not simply the longest-waiting one.

### 4.4 Provider Error Normalization (`app/query.py: extract_provider_error_message`)
External providers (notably OpenRouter) sometimes nest the true upstream error as a JSON-encoded string inside `error.metadata.raw`. This function parses that nested payload and surfaces the most specific human-readable message (e.g., "your balance is too low...") instead of the generic wrapper message or a raw dict dump. HTTP 402 responses are special-cased with the prefix "This AI provider is out of credits: ...".

### 4.5 Duplicate Detection
On upload, `hashlib.sha256(contents).hexdigest()` is computed before the file is written to disk. If `settings.duplicate_detection` is enabled, this hash is checked against `documents.content_hash` for the same `user_id`; a match raises `409 Conflict` before any file I/O or indexing occurs.

### 4.6 Background Indexing
`POST /upload` performs synchronous, fast text extraction (needed to build the immediate response), creates the `Document` row with `chunks = 0`, then calls `INDEX_POOL.submit(plan_priority(plan), index_document_job, ...)` and returns immediately. `index_document_job` runs on a worker thread with its **own** SQLAlchemy session (`SessionLocal()`), since the request-scoped session is closed by the time the job executes.

---

## 5. Frontend Architecture Notes

- **State management**: local component state + React hooks; no global store. Cross-cutting concerns (`AuthContext`, `DialogContext`) are provided via React Context.
- **API client** (`lib/api.ts`): a typed `fetch`-wrapper per endpoint; errors are thrown as `Error` objects, with a `.status` property attached (from the HTTP response) so calling code can distinguish expected 4xx outcomes (shown as toasts) from genuine 5xx/network failures (also logged to the console).
- **Streaming chat**: `askAIStream` manually parses an SSE response body (`ReadableStream` + `TextDecoder`), splitting on `\n\n` and dispatching `onSources` / `onToken` / `onDone` callbacks.
- **Polling**: the Knowledge Base page polls `GET /documents` every 3 seconds while any document has `chunks === 0`, and separately tracks per-document "stuck since" timestamps (via `useRef`) to drive the auto re-index feature without re-triggering it repeatedly for the same document.

---

## 6. Extensibility Guides

### 6.1 Adding a New AI Provider
1. Backend: add an entry to `PROVIDER_CONFIG` in `app/query.py` (`base_url`, `style` — one of `openai`, `anthropic`, `cohere`, `gemini` request/response shapes — and any `extra_headers`).
2. Frontend: add an entry to the `PROVIDERS` array in `app/settings/page.tsx` (`value`, `local`, `modelPlaceholder`, `models`, optional `apiKeyUrl`).
3. No database migration is required — `integrations.provider_name` is a free-text column.

### 6.2 Changing Plan Limits
Edit `PLAN_LIMITS`, `INTEGRATION_LIMITS`, and/or `COMMUNITY_MONTHLY_AI_CREDITS` in `app/main.py` and redeploy. No migration required.

### 6.3 Adding a Settings Field
1. Add the column to the relevant model in `models.py`.
2. Write a new `migration_0NN_description.sql` and apply it to the live database (existing tables are never auto-altered).
3. Add the field to `SettingsIn`/`SettingsOut` in `schemas.py`.
4. Add the field to `SettingsPayload` in `lib/api.ts` and the relevant frontend form.

---

## 7. Coding Conventions
- Backend: FastAPI dependency injection for `current_user` and `db` session on every authenticated route; all queries filter explicitly by `user_id` — never rely on implicit scoping.
- Frontend: Tailwind utility classes throughout; dark-mode variants (`dark:`) applied alongside every light-mode class; icons are inline SVGs (Heroicons-style paths) rather than an icon library dependency.
- Error handling: destructive actions (delete account, delete all documents, restore backup, clear chat history) are always gated behind the shared `useDialog().confirm()` modal, with `danger: true` styling.
