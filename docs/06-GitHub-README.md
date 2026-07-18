# Cognexa

**Self-hosted Retrieval-Augmented Generation (RAG) knowledge base.**
Upload your documents, ask questions in plain English, and get answers grounded in your own files — powered by a local LLM by default, with optional support for OpenAI, Anthropic, Cohere, Google Gemini, OpenRouter, and Cline.

---

## ✨ Features

- 📤 **Upload anything** — PDF, DOCX, JPG, and PNG, parsed and OCR'd automatically
- 🔍 **Retrieval-Augmented Chat** — answers are grounded in your own documents, streamed in real time
- 🔒 **Runs locally by default** — powered by Ollama + ChromaDB; your data never has to leave your machine
- 🔌 **Bring your own AI provider** — connect OpenAI, Anthropic, Cohere, Gemini, OpenRouter, or Cline, and pick which one answers each question
- ⚡ **Priority scheduling** — paid plans get faster indexing and retrieval under load, for real (not just marketing copy)
- ♻️ **Auto re-index** — automatically recovers documents stuck mid-processing
- 🧬 **Duplicate detection** — blocks re-uploading a file you already have
- 📦 **Data portability** — export your knowledge base, back up and restore your account, or delete everything on demand

## 🏗️ Tech Stack

| | |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, SQLAlchemy, MySQL |
| Vector store | ChromaDB (local, persistent) |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) |
| LLM (local) | Ollama |
| Document parsing | `pypdf`, `python-docx`, `pytesseract` |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- MySQL running locally (or accessible via `DATABASE_URL`)
- [Ollama](https://ollama.com) installed, with a model pulled (default `llama3.2`)

### Backend
```bash
cd cognexa-api
python -m venv .venv && .venv\Scripts\activate     # Windows
pip install -r requirements.txt

# Apply schema migrations against your database, in order:
mysql -u root -p cognexa < migration_002_cline_integration.sql
mysql -u root -p cognexa < migration_003_integration_fields.sql
mysql -u root -p cognexa < migration_004_document_metadata.sql
mysql -u root -p cognexa < migration_005_user_plan.sql
mysql -u root -p cognexa < migration_007_ai_credits.sql
mysql -u root -p cognexa < migration_008_notifications.sql
mysql -u root -p cognexa < migration_009_auto_reindex.sql
mysql -u root -p cognexa < migration_010_duplicate_detection.sql

uvicorn app.main:app --reload
```

### Frontend
```bash
cd cognexa-web
npm install
npm run dev
```

Visit `http://localhost:3000`.

## 📋 Plans

| | Community | Pro | Unlimited |
|---|---|---|---|
| Price | Free | $19/mo | $49/mo |
| Documents | 25 | 100 | Unlimited (Fair Use) |
| Storage | 15 MB | 10 GB | Unlimited (Fair Use) |
| AI usage | 50 questions/mo (OpenRouter free models) + unlimited local | Unlimited (own API usage) | Unlimited (own API usage) |
| AI provider connections | 1 (OpenRouter free models) | 3 | Unlimited |
| Indexing/retrieval | Standard | Priority | Priority |

## 📁 Project Structure

```
cognexa-api/     FastAPI backend (REST + SSE API, RAG pipeline, priority scheduler)
cognexa-web/     Next.js frontend
docs/            Full documentation package (this repo)
```

## 📚 Documentation
See the [`docs/`](./docs) folder for the full documentation package:
- Software Documentation
- User Manual
- Administrator Manual
- Testing Documentation
- Technical Documentation
- Presentation Script

## 🔒 Security
- Passwords hashed with bcrypt; JWT-based authentication.
- All data is scoped per-user; no cross-tenant access.
- Backups never include connected provider API keys.
- Nothing leaves your deployment unless you explicitly connect an external AI provider.

## 📄 License
Proprietary — © 2026 Cognexa. A project for EACOMN.
