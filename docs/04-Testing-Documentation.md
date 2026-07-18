# Cognexa — Testing Documentation

**Version:** 1.0.0
**Audience:** QA Engineers / Developers

---

## 1. Testing Strategy

### 1.1 Scope
This document covers functional test cases for the Cognexa platform: authentication, document management, chat/retrieval, chatbot integrations, plan enforcement, AI credits, priority scheduling, and data management.

### 1.2 Test Levels
| Level | Approach |
|---|---|
| Unit | Backend business logic (e.g. `is_allowed_community_integration`, `extract_provider_error_message`, `PriorityWorkerPool` ordering) tested in isolation |
| Integration | API endpoints tested against a real MySQL + ChromaDB instance |
| End-to-End (E2E) | Full user flows driven through the browser UI against a running backend |
| Manual/Exploratory | UI polish, responsive layout, dark/light theme, toast/dialog behavior |

### 1.3 Environments
| Environment | Purpose |
|---|---|
| Local dev | Developer machine, `npm run dev` + `uvicorn --reload` |
| Staging | Pre-production, mirrors production configuration |
| Production | Live environment |

### 1.4 Entry / Exit Criteria
- **Entry:** Feature branch merged to a test branch; migrations applied; environment seeded with a test user.
- **Exit:** All P1 test cases pass; no open Sev-1/Sev-2 defects; regression suite green.

---

## 2. Test Case Catalogue

Legend — **Priority**: P1 (critical), P2 (major), P3 (minor).

### 2.1 Authentication

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| AUTH-01 | Register new account | P1 | Email not already registered | 1. Go to /login → register form. 2. Enter name, unique email, password. 3. Submit. | Account created; JWT issued; redirected to Dashboard. |
| AUTH-02 | Register with duplicate email | P2 | An account with the email already exists | 1. Attempt registration with an existing email. | Request rejected with "Email already registered." |
| AUTH-03 | Login with valid credentials | P1 | Registered account exists | 1. Enter correct email/password. 2. Submit. | Logged in; redirected to Dashboard. |
| AUTH-04 | Login with invalid password | P1 | Registered account exists | 1. Enter correct email, wrong password. 2. Submit. | 401 "Invalid email or password"; not logged in. |
| AUTH-05 | Auto-logout on idle | P2 | Logged-in session | 1. Leave the app idle (no mouse/keyboard/touch) for 1 hour. | User is automatically logged out and redirected to /login. |
| AUTH-06 | Update profile name/password | P2 | Logged in | 1. Go to Settings → Account. 2. Change name and/or password. 3. Save. | Profile updated; new password works on next login. |

### 2.2 Document Upload & Limits

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| DOC-01 | Upload a valid PDF | P1 | Logged in, under plan limits | 1. Go to Upload. 2. Select a PDF. 3. Click Upload. | Document saved with status "Processing", then transitions to "Indexed" once background indexing completes. |
| DOC-02 | Upload a valid DOCX | P1 | Same as above | 1. Upload a .docx file. | Same as DOC-01. |
| DOC-03 | Upload an image (JPG/PNG) | P1 | Same as above | 1. Upload a .jpg/.png file. | Text extracted via OCR (if available); document indexed. |
| DOC-04 | Upload unsupported file type | P2 | Logged in | 1. Attempt to upload a .txt or .exe file. | Rejected: "Only PDF, DOCX, JPG and PNG files are supported." |
| DOC-05 | Upload beyond document count limit | P1 | Community plan, 25 documents already uploaded | 1. Attempt a 26th upload. | 402 error naming the plan's document limit; upgrade prompt/modal shown in UI. |
| DOC-06 | Upload beyond storage limit | P1 | Community plan, near 15 MB used | 1. Upload a file that would exceed 15 MB total. | 402 "storage limit reached" error; upgrade modal shown; error not logged as a console error (expected/handled). |
| DOC-07 | Duplicate upload blocked | P1 | Duplicate Detection enabled; file X already uploaded | 1. Upload the exact same file X again. | 409 rejected: "This file is identical to the already-uploaded '<filename>'." |
| DOC-08 | Duplicate upload allowed when detection disabled | P2 | Duplicate Detection disabled in Settings | 1. Upload the exact same file twice. | Both uploads succeed. |
| DOC-09 | Re-index a stuck document (manual) | P2 | A document is stuck at "Processing" | 1. Click the Re-index button on the document card. | Text re-extracted from the original file; chunks reset and reprocessed; status eventually becomes "Indexed". |
| DOC-10 | Auto re-index stuck document | P2 | Auto Re-index enabled; a document stuck > 8 seconds | 1. Wait while the Knowledge Base page polls. | Document is automatically re-indexed exactly once; a notification is shown. |
| DOC-11 | Delete a single document | P1 | At least one document exists | 1. Click Delete on a document, confirm. | Document, its file, and its vector chunks are removed; it disappears from the list. |
| DOC-12 | Delete all documents | P2 | Multiple documents exist | 1. Settings → Data Management → Delete All Documents, confirm. | All documents, files, and vector chunks removed. |
| DOC-13 | Download a document | P2 | A document exists | 1. Click Download. | Original file downloads with its original filename. |

### 2.3 Knowledge Base UI

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| KB-01 | Search documents by filename | P2 | Multiple documents exist | 1. Type a partial filename into Search. | Only matching documents shown. |
| KB-02 | Filter by file type | P3 | Documents of multiple types exist | 1. Select a file type from the filter dropdown. | Only documents of that type shown. |
| KB-03 | Sort documents | P3 | Multiple documents exist | 1. Change the sort dropdown (Newest/Oldest/Name/Chunks). | List re-orders accordingly. |
| KB-04 | Toggle grid/list view | P3 | Documents exist | 1. Click the grid/list toggle button. | Layout switches between card grid and compact list; icon reflects current mode. |
| KB-05 | Preview a document | P2 | A document exists | 1. Click a document's title. | Preview panel opens showing type, status, size, pages, chunks, upload date, and text preview. |
| KB-06 | Pagination | P3 | More than 6 documents (after filtering) | 1. Navigate using Previous/Next. | Correct page of results shown; buttons disabled at boundaries. |

### 2.4 Chat / Retrieval

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| CHAT-01 | Ask a question, unscoped | P1 | At least one indexed document | 1. Go to Chat. 2. Ask a question relevant to an uploaded document. | Streamed answer appears; source document(s) listed. |
| CHAT-02 | Ask a question scoped to one document | P1 | Multiple indexed documents | 1. Set the document filter to one document. 2. Ask a question. | Answer is generated using only that document's context. |
| CHAT-03 | "List my documents" question | P1 | Multiple documents of mixed types (PDF + DOCX) | 1. Ask "List the documents I've uploaded so far." | Every uploaded document is listed by filename, regardless of file type — answered from the database, not vector search. |
| CHAT-04 | No relevant documents | P2 | No documents uploaded, or none relevant | 1. Ask an unrelated question. | "I couldn't find anything relevant in your knowledge base. Try uploading a document first." |
| CHAT-05 | Provider selection — Local | P2 | An integration is saved | 1. Select "Local" in the provider menu. 2. Ask a question. | Answer generated by the local Ollama model even though an integration exists. |
| CHAT-06 | Provider selection — specific integration | P1 | At least one integration saved | 1. Select that integration by name. 2. Ask a question. | Answer generated using that provider/model. |
| CHAT-07 | Provider selection — Auto | P2 | One or more integrations saved | 1. Select "Auto". 2. Ask a question. | Most recently saved usable integration is used; falls back to local if none usable. |
| CHAT-08 | Clear chat history | P2 | Chat history exists | 1. Click the clear-history icon, confirm. | All prior messages removed; history empty on reload. |
| CHAT-09 | External provider returns 402 (out of credits) | P2 | An integration connected to a provider with insufficient balance | 1. Ask a question using that provider. | User sees a clean message: "This AI provider is out of credits: <reason>" — not a raw JSON dump. |
| CHAT-10 | Retrieval fairness across many documents | P2 | 5+ documents uploaded, one much larger/more relevant than others | 1. Ask a broad question spanning all documents. | Answer context includes chunks from multiple documents (round-robin), not only the single most-similar document. |

### 2.5 Chatbot Integrations & Plan Restrictions

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| INT-01 | Save an integration (Pro plan) | P1 | Pro plan active | 1. Settings → Chatbot Integration. 2. Choose a provider, enter key/model. 3. Save. | Integration saved and listed; usable in Chat. |
| INT-02 | Community plan restricted to OpenRouter free models | P1 | Community plan | 1. Open Chatbot Integration. | Only "OpenRouter" is selectable as a provider; only free-tagged models selectable; no "Custom..." model option. |
| INT-03 | Community plan integration limit | P1 | Community plan, 1 integration already saved | 1. Attempt to save a second integration. | 402 rejected: allowance of 1 integration reached. |
| INT-04 | Pro plan integration limit (3) | P2 | Pro plan, 3 integrations saved | 1. Attempt to save a 4th. | 402 rejected: allowance of 3 reached; upgrade prompt shown. |
| INT-05 | Unlimited plan has no integration limit | P2 | Unlimited plan | 1. Save 4+ integrations. | All succeed. |
| INT-06 | Delete an integration | P2 | At least one integration saved | 1. Click delete, confirm. | Integration removed from the list and from the Chat provider menu. |
| INT-07 | Downgrade leaves a disallowed integration unusable | P2 | Pro plan with a non-OpenRouter integration, then downgrade to Community | 1. Downgrade to Community. 2. View integrations / attempt to chat with the old integration. | Integration shows as not connected; chat silently falls back to local rather than using the disallowed provider. |
| INT-08 | API key link opens correct provider page | P3 | Any provider selected | 1. Click "Get one from <Provider>". | Opens that provider's actual API-key page in a new tab. |

### 2.6 AI Credits (Community Plan)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| CRED-01 | Consume a credit on OpenRouter use | P1 | Community plan, OpenRouter integration saved, credits remaining | 1. Ask a question routed to the integration. | `ai_credits_used` increments by 1; usage bar in Settings reflects the change. |
| CRED-02 | Credits exhausted → automatic local fallback | P1 | Community plan, 0 credits remaining | 1. Ask a question with source = Auto or the integration. | Answer is generated by the local model; no error shown; credit count unchanged. |
| CRED-03 | Monthly credit reset | P2 | Period start > 30 days ago | 1. Request `/billing/plan` or ask a question after the period elapses. | `ai_credits_used` resets to 0 and a new period starts. |
| CRED-04 | Pro/Unlimited plans never metered | P2 | Pro or Unlimited plan | 1. Ask many questions via a connected integration. | No credit tracking/limiting applied at any point. |

### 2.7 Billing (Demo Checkout)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| BILL-01 | Upgrade Community → Pro | P1 | Community plan | 1. Click "Upgrade to Pro". 2. Complete the demo checkout form. | Plan changes to Pro immediately; limits update accordingly. |
| BILL-02 | Upgrade to Unlimited | P2 | Any plan | 1. Complete checkout for Unlimited. | Plan changes to "team" (displayed as "Unlimited"). |
| BILL-03 | Downgrade to Community | P2 | Pro or Unlimited plan | 1. Click "Downgrade to Community". | Plan reverts; usage bars reflect Community limits; any now-disallowed integrations become unusable (see INT-07). |

### 2.8 Data Management

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| DATA-01 | Export knowledge base | P2 | At least one document | 1. Settings → Data Management → Export Knowledge Base. | A `.zip` downloads containing original files plus a `manifest.json`. |
| DATA-02 | Backup account | P2 | Settings/chat/integrations configured | 1. Click Backup. | A `.json` downloads containing settings, chat history, and integration metadata (no API keys). |
| DATA-03 | Restore from backup | P2 | A valid backup file from DATA-02 | 1. Click Restore, select the file, confirm. | Current settings/chat/integrations replaced with the backup's; user is warned documents are not restored and API keys must be re-entered. |
| DATA-04 | Restore rejects invalid file | P3 | Any non-backup JSON/file | 1. Attempt to restore it. | 400 error: "That file isn't a valid Cognexa backup." |
| DATA-05 | Delete account | P1 | Logged in | 1. Settings → Delete Account. 2. Confirm twice. | Account, documents, chat history, integrations, and settings permanently deleted; user is logged out. |

### 2.9 Priority Scheduling (Backend/Integration Tests)

| ID | Title | Priority | Preconditions | Steps | Expected Result |
|---|---|---|---|---|---|
| SCHED-01 | Indexing priority order | P2 | Multiple uploads queued simultaneously across plans | 1. Submit a Community upload, then a Pro upload, then an Unlimited upload while the queue is backed up. | Unlimited's job is processed before Pro's, which is processed before Community's, regardless of submission order. |
| SCHED-02 | Chat generation priority under load | P2 | More concurrent chat requests than available slots (default 2) | 1. Submit concurrent requests from Community and Pro users exceeding capacity. | Pro's request is granted a slot before a longer-waiting Community request. |

---

## 3. Regression Suite
The following test IDs form the minimum regression suite to run before every release: `AUTH-01, AUTH-03, DOC-01, DOC-05, DOC-06, DOC-07, CHAT-01, CHAT-03, INT-02, INT-03, CRED-01, CRED-02, BILL-01, DATA-05`.

## 4. Defect Reporting Template
| Field | Description |
|---|---|
| ID | Unique defect identifier |
| Title | One-line summary |
| Severity | Sev-1 (blocker) – Sev-4 (cosmetic) |
| Test Case ID | Related test case from Section 2 |
| Steps to Reproduce | Numbered steps |
| Expected vs Actual | What should happen vs what happened |
| Environment | Local / Staging / Production, browser, plan tier |
| Attachments | Screenshots, console errors, network logs |
