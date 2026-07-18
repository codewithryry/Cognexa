# Cognexa

Cognexa is a self-hosted AI knowledge base. Users upload documents (PDF, DOCX,
images), the system indexes them for semantic search, and a chat interface
lets users ask questions answered by a local LLM (via Ollama) using
Retrieval-Augmented Generation (RAG) over their own uploaded documents.

This document covers what the app does, how it's built, how to run it, and
where to make changes.

---

## 1. What it does

- **Accounts** — each user registers/logs in and only sees their own documents,
  chat history, and settings.
- **Upload** — PDF, DOCX, JPG, and PNG files are uploaded, text is extracted,
  split into chunks, embedded, and stored in a vector database.
- **Knowledge Base** — lists every uploaded document with a text preview,
  chunk count, and upload date. Documents can be deleted (removes both the
  database record and its indexed chunks).
- **AI Chat** — ask a question and it is answered using Retrieval-Augmented
  Generation: the system searches across **all** of the user's indexed
  documents, pulls the most relevant passages (from multiple documents if
  relevant), sends them to the LLM as context, and streams the answer back
  token-by-token. Every answer lists which document(s) it drew from. Users can
  optionally narrow the search to specific documents via the "Search scope"
  filter (all documents are included by default; unchecking one excludes it).
- **Dashboard** — live stats (documents, indexed chunks, questions asked
  today, storage used) plus recent uploads/conversations and quick actions.
- **Settings** — per-user AI configuration (Ollama URL, LLM model, embedding
  model, chunk size/overlap) and account details (name, password). Appearance
  (light/dark) is toggled from the navbar and persists per device.
- **Security** — passwords are hashed (bcrypt), auth uses JWT bearer tokens,
  and the session auto-logs-out after 1 hour of inactivity.

---

## 2. Project layout

```
Cognexa/
├── cognexa-api/          FastAPI backend
│   ├── app/
│   │   ├── main.py       All API routes
│   │   ├── models.py     SQLAlchemy models (MySQL)
│   │   ├── schemas.py    Pydantic request/response schemas
│   │   ├── auth.py       Password hashing + JWT
│   │   ├── database.py   SQLAlchemy engine/session
│   │   ├── rag.py        Chunking + ChromaDB embedding storage
│   │   ├── query.py      RAG retrieval + Ollama chat (streaming)
│   │   ├── uploads/      Uploaded files are saved here
│   │   └── vector_db/    ChromaDB persistent storage
│   ├── migration.sql     Schema migration reference (see §5)
│   └── requirements.txt  Python dependencies
│
├── cognexa-web/          Next.js frontend
│   ├── app/
│   │   ├── login/        Login & register
│   │   ├── dashboard/    Stats overview
│   │   ├── upload/       Drag-and-drop upload
│   │   ├── knowledge-base/  Document list + delete
│   │   ├── chat/         AI chat (streaming, source citations)
│   │   └── settings/     Account + AI config
│   ├── components/       Navbar, Sidebar, dialogs, menus, filters
│   └── lib/               api.ts (all backend calls), Auth/Theme/Dialog contexts
│
└── DOCUMENTATION.md      This file
```

---

## 3. How it works (architecture)

**Stack**: Next.js (React, TypeScript, Tailwind) frontend → FastAPI (Python)
backend → MySQL (structured data) + ChromaDB (vector search) + Ollama (local
LLM inference).

### Upload flow
1. User uploads a file in the browser (`app/upload/page.tsx`).
2. `POST /upload` saves the file to `cognexa-api/app/uploads/`, extracts text
   (`pypdf` for PDF, `python-docx` for DOCX, `pytesseract`+Pillow OCR for
   images — OCR requires the Tesseract binary installed separately; without
   it, images are stored but no text is extracted).
3. A `documents` row is created in MySQL (filename, path, type, preview,
   owner).
4. The extracted text is chunked (`rag.py`) using the user's configured chunk
   size/overlap, embedded with `sentence-transformers` (`all-MiniLM-L6-v2`),
   and stored in ChromaDB tagged with `user_id` and `document_id`.

### Chat / RAG flow
1. User asks a question (`app/chat/page.tsx`).
2. `POST /ask` embeds the question and queries ChromaDB, scoped to that
   user's documents (and optionally a chosen subset).
3. Retrieval pulls a wider candidate pool and caps how many chunks any single
   document can contribute, so a question that touches multiple documents
   gets context from all of them instead of just the single closest match.
4. The retrieved passages (labeled by source filename) are sent to Ollama as
   context; the answer streams back to the browser as Server-Sent Events
   (sources first, then answer tokens, then a "done" event).
5. The question, final answer, and source list are saved to the
   `chat_messages` table.

### Auth
- JWT bearer tokens (`app/auth.py`), stored in the browser's `localStorage`.
- Every API route (except `/health`, `/auth/register`, `/auth/login`)
  requires a valid token and only operates on that user's own data.
- The frontend auto-logs-out after 60 minutes of no mouse/keyboard/scroll
  activity (`lib/AuthContext.tsx`).

---

## 4. Running it locally

### Prerequisites
- Python 3.11+ with the virtualenv in `cognexa-api/.venv`
- Node.js (for `cognexa-web`)
- MySQL running locally with a `cognexa` database (see `cognexa.sql` for the
  base schema, then `cognexa-api/migration.sql` for the additions this app
  needs)
- [Ollama](https://ollama.com) running locally with a model pulled, e.g.:
  ```
  ollama pull llama3.2
  ```
- (Optional, for OCR on image uploads) [Tesseract-OCR](https://github.com/tesseract-ocr/tesseract)
  installed and on PATH.

### Backend
```
cd cognexa-api
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```
Runs at `http://127.0.0.1:8000`. Interactive API docs at `/docs`.

### Frontend
```
cd cognexa-web
npm install
npm run dev
```
Runs at `http://localhost:3000`.

The frontend's API base URL is read from `NEXT_PUBLIC_API_URL` (see
`cognexa-web/.env.example`; defaults to `http://127.0.0.1:8000` if unset) —
set this if the backend runs somewhere else.

---

## 5. Database

The base schema lives in `cognexa.sql` (documents, projects, tasks, users —
some tables like `projects`/`tasks` are legacy/unused by the current app).
`cognexa-api/migration.sql` adds what Cognexa actually uses:

- `documents.user_id`, `documents.chunks`, `documents.preview` — ownership,
  indexed chunk count, and a text preview for the Knowledge Base page.
- `settings` — one row per user (Ollama URL, models, chunk size/overlap,
  theme).
- `chat_messages` — one row per question asked (question, answer, sources,
  timestamp).

If you set up a fresh database, run `cognexa.sql` then `migration.sql`, in
that order.

The SQLAlchemy models in `cognexa-api/app/models.py` are the source of truth
for the schema going forward — if you add a column there, add the matching
`ALTER TABLE`/`CREATE TABLE` to a new migration file (MySQL does not support
`ADD COLUMN IF NOT EXISTS`, so re-running an old migration on an already
up-to-date database will error on the duplicate column — that's expected).

---

## 6. Where to make common changes

| Want to change...                          | Look in...                                              |
|---------------------------------------------|----------------------------------------------------------|
| API routes / endpoints                       | `cognexa-api/app/main.py`                                |
| Database tables                              | `cognexa-api/app/models.py` (+ a migration SQL file)      |
| Request/response shapes                      | `cognexa-api/app/schemas.py`                              |
| How documents are chunked/embedded           | `cognexa-api/app/rag.py`                                  |
| How answers are retrieved/generated          | `cognexa-api/app/query.py`                                |
| Login/JWT behavior                           | `cognexa-api/app/auth.py`                                 |
| Any page's UI                                | `cognexa-web/app/<page>/page.tsx`                         |
| Shared frontend API calls                    | `cognexa-web/lib/api.ts`                                  |
| Theme / dark-light mode                      | `cognexa-web/lib/ThemeContext.tsx`                        |
| Login/session/idle-logout behavior           | `cognexa-web/lib/AuthContext.tsx`                         |
| Confirm dialogs / toast notifications        | `cognexa-web/lib/DialogContext.tsx`                       |
| Sidebar/Navbar                               | `cognexa-web/components/Sidebar.tsx`, `Navbar.tsx`        |

### Adding a new AI model or embedding model
Change the defaults in `cognexa-api/app/models.py` (`Settings` class) and/or
have the user update it from the Settings page — both `llm_model` and
`embedding_model` are per-user and read at request time, no code change
needed to switch models (as long as the model is pulled in Ollama /
compatible with `sentence-transformers`).

### Supporting a new upload file type
Add the extension check and text-extraction branch in the `/upload` route in
`cognexa-api/app/main.py`.

---

## 7. Known limitations / things to revisit

- Image OCR requires installing the Tesseract binary separately; without it,
  images upload fine but contribute no searchable text (the upload itself
  degrades gracefully — it just skips OCR rather than failing).
- No password-reset flow yet (only sign up / log in / change password while
  logged in).
