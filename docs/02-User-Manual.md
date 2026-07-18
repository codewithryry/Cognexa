# Cognexa — User Manual

**Version:** 1.0.0
**Audience:** End users

---

## 1. Getting Started

### 1.1 Creating an Account
1. Navigate to the Cognexa homepage and click **Get Started** (or **Sign In** if you already have an account).
2. On the login page, switch to the registration form and enter your name, email address, and password.
3. Submit the form. You will be signed in automatically and redirected to your Dashboard.

### 1.2 Signing In
1. Go to the login page.
2. Enter your registered email and password.
3. Click **Sign In**.

> You will be automatically signed out after **1 hour of inactivity** (no mouse, keyboard, or touch input).

### 1.3 The Dashboard
The Dashboard shows a summary of your account:
- Total documents uploaded
- Total indexed chunks
- Questions asked today
- Storage used

---

## 2. Uploading Documents

1. Go to the **Upload** page.
2. Drag and drop a file into the upload area, or click it to browse your files.
3. Supported file types: **PDF**, **DOCX**, **JPG**, **PNG**.
4. Click **Upload**.
5. The document is saved immediately and shows a **Processing** status while it is indexed in the background. Once indexing finishes, its status changes to **Indexed**.

### 2.1 Upload Limits
Your plan determines how many documents you can store and how much storage you can use:

| Plan | Max Documents | Max Storage |
|---|---|---|
| Community | 25 | 15 MB |
| Pro | 100 | 10 GB |
| Unlimited | No limit (Fair Use) | No limit (Fair Use) |

If you reach your plan's limit, an upgrade prompt will appear instead of a generic error.

### 2.2 Duplicate Detection
If **Duplicate Detection** is enabled (Settings → Automation), uploading a file that is byte-for-byte identical to one you already have will be blocked, with a message naming the existing file.

### 2.3 Auto Re-index
If a document becomes stuck in **Processing**, and **Auto Re-index** is enabled (Settings → Automation), Cognexa will automatically retry indexing it after a short delay. You can also manually click the **Re-index** button on a stuck document at any time.

---

## 3. Managing Your Knowledge Base

The **Knowledge Base** page lists every document you've uploaded.

- **Search** by filename.
- **Filter** by file type.
- **Sort** by newest, oldest, name, or chunk count.
- **Switch view**: click the grid/list icon (top right of the toolbar) to toggle between a card grid and a compact list.
- **Actions** per document: View (preview), Ask AI (jump to chat scoped to this document), Download, Delete, and (if stuck) Re-index.

Click a document's title (or the "View" action) to open a preview panel showing its extracted text preview, file type, size, page count, chunk count, and upload date.

---

## 4. Asking Questions (Chat)

1. Go to the **Chat** page.
2. Type your question and press Enter, or click a suggested question.
3. The answer streams in token-by-token, followed by the list of source documents it was generated from.

### 4.1 Scoping a Question to Specific Documents
Use the document filter control in the chat input bar to restrict a question to one or more specific documents (or leave it unscoped to search your entire knowledge base). You can also jump directly into a scoped chat from a document's "Ask AI" button on the Knowledge Base page.

### 4.2 Choosing an AI Provider
Click the provider selector (next to the document filter) to choose:
- **Auto** — uses your most recently saved integration if you have one, otherwise the local model.
- **Local** — always answers using the local Ollama model, regardless of any saved integrations.
- **A specific saved integration** — answers using exactly that provider/model.

### 4.3 Clearing Chat History
Click the trash icon in the chat input bar, and confirm, to permanently delete your entire conversation history.

### 4.4 A Note on "List My Documents" Questions
Questions like "List the documents I've uploaded" are answered directly from your account's document records, not by searching document content — so the answer is always complete and accurate, regardless of file type or size.

---

## 5. Connecting an AI Provider (Chatbot Integration)

By default, Cognexa answers using a local model — no external AI provider is required. If you want to use a hosted AI model instead:

1. Go to **Settings → Chatbot Integration**.
2. Choose a **Provider** (OpenAI, Anthropic Claude, Cohere, Google Gemini, OpenRouter, Cline, or a local Ollama/LM Studio endpoint).
3. Enter your **API Key** (not required for local providers). If you don't have one, click the "Get one from *Provider*" link next to the field.
4. Choose a **Model** from the dropdown, or enter a custom model ID.
5. Click **Save Integration**.

Your saved integration then appears as a selectable option in the Chat page's provider menu.

### 5.1 How Many Providers Can I Connect?

| Plan | Saved Integrations |
|---|---|
| Community | 1 (OpenRouter free models only) |
| Pro | Up to 3 |
| Unlimited | Unlimited |

### 5.2 Removing an Integration
In Settings, click the trash icon next to a saved integration and confirm removal.

### 5.3 Community Plan AI Usage
Community accounts get **50 free AI questions per month** using OpenRouter's free models. Once used up, chat automatically falls back to the local model until your monthly allowance resets — you are never blocked from asking questions.

---

## 6. Settings

### 6.1 Account
Update your display name and password.

### 6.2 General
Configure the local Ollama URL/model, embedding model, chunk size/overlap, and light/dark theme.

### 6.3 Billing & Subscription
View your current plan and usage (documents, storage, AI credits), and upgrade/downgrade between Community, Pro, and Unlimited. *(This is a demo checkout — no real payment is processed.)*

### 6.4 Chatbot Integration
See Section 5.

### 6.5 Notifications
Toggle email notifications on/off. *(Note: no mail provider is connected yet — these preferences are saved but no emails are currently sent.)*

### 6.6 Automation
Toggle **Auto Re-index** and **Duplicate Detection** (see Sections 2.2–2.3).

### 6.7 Integrations (External Sources)
Google Drive, GitHub, and Notion sync are shown as **"Coming soon"** — not yet available.

### 6.8 Data Management
- **Export Knowledge Base** — downloads a `.zip` of your uploaded document files plus a manifest.
- **Backup** — downloads a `.json` snapshot of your settings, chat history, and saved integrations (API keys are excluded for security).
- **Restore** — uploads a previously downloaded backup file, replacing your current settings, chat history, and integrations. *(You must re-enter API keys after restoring. Documents themselves are not restored — only their metadata is backed up, so re-upload the original files if needed.)*
- **Delete All Documents** — permanently removes every document and its indexed data.
- **Delete Account** — permanently deletes your account and all associated data. This requires double confirmation and cannot be undone.

---

## 7. Frequently Asked Questions

**Q: Does my data leave my computer/server?**
A: No, unless you explicitly connect an external AI provider (e.g. OpenAI) — in that case, only the question and retrieved document context are sent to that provider for generating an answer.

**Q: Why did my upload get rejected with a "storage limit reached" message?**
A: Your plan's storage allowance is full. Upgrade your plan, or delete unused documents, and try again.

**Q: My document has been "Processing" for a long time. What do I do?**
A: Enable Auto Re-index in Settings, or manually click the Re-index button on the document card.

**Q: Can I use more than one AI provider?**
A: Yes, subject to your plan's connection limit (see Section 5.1). Choose which one to use per question in the Chat page's provider menu.
