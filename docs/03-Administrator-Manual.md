# Cognexa — Administrator Manual

**Version:** 1.0.0
**Audience:** System administrators / DevOps

---

## 1. Deployment Overview

Cognexa consists of two independently deployable services plus supporting infrastructure:

| Component | Technology | Notes |
|---|---|---|
| `cognexa-api` | FastAPI (Python), served via Uvicorn | Requires a MySQL database and local disk for uploads + ChromaDB |
| `cognexa-web` | Next.js 16 | Statically hosts the UI, calls `cognexa-api` over HTTP |
| MySQL | Relational database | Stores users, documents, settings, integrations, chat history |
| ChromaDB | Embedded vector database | Persisted to local disk (`app/vector_db`) — no separate service to run |
| Ollama | Local LLM runtime | Must be installed and running for local-model chat/generation |

---

## 2. Prerequisites

- Python 3.11+ (backend)
- Node.js 20+ (frontend, per `@types/node` ^20)
- A running MySQL server
- Ollama installed locally, with at least one model pulled (default: `llama3.2`)
- (Optional) Tesseract OCR installed on the host, for image-based document text extraction

---

## 3. Backend Setup

### 3.1 Environment Configuration
The backend reads its database connection string from the `DATABASE_URL` environment variable (via a `.env` file, loaded with `python-dotenv`):

```
DATABASE_URL=mysql+pymysql://<user>:<password>@<host>:3306/<database>
```

If unset, it defaults to `mysql+pymysql://root:@127.0.0.1:3306/cognexa`.

### 3.2 Installing Dependencies
```
cd cognexa-api
python -m venv .venv
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
```

### 3.3 Database Initialization
On startup, `Base.metadata.create_all(bind=engine)` automatically creates any tables that do not yet exist. **This does not alter existing tables.** Schema changes to existing tables are shipped as standalone SQL migration files in the repository root and must be applied manually against the live database before starting the updated application. Apply them in order:

| # | File | Purpose |
|---|---|---|
| 1 | `migration_002_cline_integration.sql` | Adds the initial chatbot integration fields |
| 2 | `migration_003_integration_fields.sql` | Extends integration fields |
| 3 | `migration_004_document_metadata.sql` | Adds document metadata columns |
| 4 | `migration_005_user_plan.sql` | Adds the `plan` column to `users` |
| 5 | `migration_007_ai_credits.sql` | Adds AI credit tracking to `users` |
| 6 | `migration_008_notifications.sql` | Adds notification preference column(s) to `settings` |
| 7 | `migration_009_auto_reindex.sql` | Adds the auto re-index setting |
| 8 | `migration_010_duplicate_detection.sql` | Adds `content_hash` to `documents` and the duplicate-detection setting |

> Apply migrations with your MySQL client of choice, e.g.: `mysql -u root -p cognexa < migration_010_duplicate_detection.sql`

### 3.4 Running the API
```
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
The application also creates its upload directory (`app/uploads`) automatically on startup.

---

## 4. Frontend Setup

```
cd cognexa-web
npm install
npm run dev      # development
npm run build && npm start   # production
```

The frontend's API base URL is currently configured as a constant (`API_URL`) in `lib/api.ts` and points to `http://127.0.0.1:8000` by default — update this for non-local deployments.

---

## 5. Core Administrative Concepts

### 5.1 Plans and Limits
Plan enforcement is centralized in `app/main.py`:

```python
PLAN_LIMITS = {
    "community": {"max_documents": 25, "max_storage_bytes": 15 * 1024 * 1024},
    "pro":       {"max_documents": 100, "max_storage_bytes": 10 * 1024 * 1024 * 1024},
    "team":      {"max_documents": None, "max_storage_bytes": None},
}
INTEGRATION_LIMITS = {"community": 1, "pro": 3, "team": None}
COMMUNITY_MONTHLY_AI_CREDITS = 50
```

Note: the "Unlimited" plan is stored internally as `"team"`. Adjusting these constants and redeploying the API is sufficient to change plan limits platform-wide — no database migration is required.

### 5.2 Billing
Billing is currently a **demo/simulated checkout** (`POST /billing/subscribe`) — no real payment processor is integrated. Any submitted card details are accepted and discarded; the plan change is applied immediately. Integrating a real payment provider (e.g. Stripe) is a prerequisite before production monetization.

### 5.3 Priority Scheduling
`app/scheduler.py` implements two primitives used to make the plan tiers' "priority indexing" and "faster retrieval" claims real:
- **`PriorityWorkerPool`** — background threads that process document-indexing jobs in priority order (Unlimited → Pro → Community) whenever multiple jobs are queued.
- **`PrioritySlotGate`** — a capacity-limited gate (default 2 concurrent slots) that grants chat-generation requests to higher-priority plans first when more requests are in flight than available slots.

These require no configuration but can be tuned via the `num_workers` (indexing) and `capacity` (chat gate) constructor arguments in `app/main.py`.

### 5.4 AI Credits (Community Plan)
Community accounts are metered at `COMMUNITY_MONTHLY_AI_CREDITS` (default 50) OpenRouter-model questions per rolling 30-day period, tracked via `users.ai_credits_used` / `ai_credits_period_start`. When exhausted, the backend automatically and silently falls back to the local model — it does not block the user's question. Pro and Unlimited plans are never metered (they use their own connected provider's API usage/billing).

### 5.5 Chatbot Integrations
API keys for connected AI providers are stored in the `integrations` table, scoped per user. Community-plan integrations are restricted server-side to a fixed allowlist of OpenRouter free models (`is_allowed_community_integration` in `app/main.py`) — this is enforced on save, on read, and at generation time, so a plan downgrade cannot leave a disallowed integration active.

### 5.6 Document Indexing Pipeline
Uploaded file text is extracted synchronously (fast) but chunking + embedding + vector storage is offloaded to the background `PriorityWorkerPool`. Administrators should ensure the host has sufficient CPU headroom for the embedding model (`sentence-transformers`, CPU-bound) under concurrent upload load.

---

## 6. Data Management & Operations

### 6.1 File Storage Locations
| Data | Location |
|---|---|
| Uploaded original files | `cognexa-api/app/uploads/` |
| Vector database | `cognexa-api/app/vector_db/` |
| Relational data | MySQL database configured via `DATABASE_URL` |

Back up all three locations together for a complete restore point — the relational database alone is not sufficient to restore uploaded files or their vector embeddings.

### 6.2 Deleting a Document
`DELETE /documents/{id}` removes the file from disk, deletes its vector chunks from ChromaDB, and removes its database row — always performed in that order to avoid orphaned data.

### 6.3 Account Deletion
`DELETE /account` cascades through a user's chat messages, integrations, documents (including files on disk and vector chunks), and settings, before deleting the user row itself. There is no soft-delete; this operation is irreversible.

### 6.4 Backup / Restore (End-User Feature)
`GET /data/backup` and `POST /data/restore` provide a **per-account** JSON backup/restore of settings, chat history, and integration metadata (never API keys). This is not a substitute for database-level backups and does not cover document files or vector data.

---

## 7. Monitoring & Troubleshooting

| Symptom | Likely Cause | Resolution |
|---|---|---|
| Documents stuck in "Processing" indefinitely | Background worker pool overloaded, or embedding model failed silently | Check API logs; ask the user to use "Re-index"; consider increasing `PriorityWorkerPool` worker count |
| Chat answers via an external provider return HTTP 402 | The connected provider account is out of credits/quota | Surfaced to the user as "This AI provider is out of credits: ..." — no admin action required, but confirm the message renders correctly |
| Upload rejected as duplicate unexpectedly | Duplicate Detection setting is enabled and the file content is genuinely identical to an existing upload | Expected behavior; the user can disable Duplicate Detection in Settings → Automation if undesired |
| A user cannot connect more than N integrations | Plan's `INTEGRATION_LIMITS` reached | Expected; user must remove an existing integration or upgrade plan |

### 7.1 Health Checks
- `GET /health` — basic API liveness check.
- `GET /health/db` — verifies database connectivity.

---

## 8. Security Notes

- Passwords are hashed with `bcrypt` before storage; plaintext passwords are never persisted.
- Authentication uses JWT bearer tokens (`python-jose`); tokens are stored client-side in `localStorage`.
- Backup exports (`GET /data/backup`) deliberately exclude integration API keys.
- All document, chat, integration, and settings endpoints filter by the authenticated user's ID — verify this invariant is preserved in any future endpoint additions.
- CORS is currently restricted to `http://localhost:3000` in `app/main.py` — update this allow-list before deploying to a non-local frontend origin.
