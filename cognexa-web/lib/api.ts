const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("cognexa_token");
}

export function setToken(token: string) {
  localStorage.setItem("cognexa_token", token);
}

export function clearToken() {
  localStorage.removeItem("cognexa_token");
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Fired whenever chat sessions are created/renamed/deleted, so the sidebar's
// session list can refresh immediately instead of waiting on a navigation.
export const SESSIONS_CHANGED_EVENT = "cognexa:chat-sessions-changed";

function notifySessionsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSIONS_CHANGED_EVENT));
  }
}

// Check backend status
export async function getHealth() {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error("Backend is unavailable.");
  }

  return response.json();
}

export interface DbStatus {
  connected: boolean;
  message: string;
}

// Check database status
export async function getDbHealth(): Promise<DbStatus> {
  const response = await fetch(`${API_URL}/health/db`);

  if (!response.ok) {
    throw new Error("Database status check failed.");
  }

  return response.json();
}

// Auth
export async function registerUser(name: string, email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed.");
  }

  return response.json();
}

export async function loginUser(email: string, password: string) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed.");
  }

  return response.json();
}

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Not authenticated.");
  }

  return response.json();
}

export async function updateProfile(name: string, password?: string) {
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ name, password: password || null }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update account.");
  }

  return response.json();
}

// Upload PDF/DOCX
export async function uploadDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error = new Error(err.detail || "Upload failed.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

// Knowledge base documents
export async function getDocuments() {
  const response = await fetch(`${API_URL}/documents`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load documents.");
  }

  return response.json();
}

export async function getDocument(id: number) {
  const response = await fetch(`${API_URL}/documents/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error = new Error(err.detail || "Failed to load document.") as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function deleteDocument(id: number) {
  const response = await fetch(`${API_URL}/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete document.");
  }

  return response.json();
}

export async function reindexDocument(id: number) {
  const response = await fetch(`${API_URL}/documents/${id}/reindex`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to re-index document.");
  }

  return response.json();
}

export async function downloadDocument(id: number, filename: string) {
  const response = await fetch(`${API_URL}/documents/${id}/download`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to download document.");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// Ask AI (streamed)
export interface AskStreamHandlers {
  onSources?: (sources: string[]) => void;
  onToken?: (content: string) => void;
  onDone?: (sources: string[]) => void;
}

export async function askAIStream(
  question: string,
  sessionId: number,
  documentIds: number[] | undefined,
  handlers: AskStreamHandlers,
  source: "auto" | "local" | "integration" = "auto",
  integrationId?: number
) {
  const params = new URLSearchParams({ question, session_id: String(sessionId), source });
  documentIds?.forEach((id) => params.append("document_ids", String(id)));
  if (source === "integration" && integrationId != null) {
    params.append("integration_id", String(integrationId));
  }

  const response = await fetch(`${API_URL}/ask?${params.toString()}`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!response.ok || !response.body) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get AI response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;

      const payload = JSON.parse(line.slice(5).trim());

      if (payload.type === "sources") {
        handlers.onSources?.(payload.sources);
      } else if (payload.type === "token") {
        handlers.onToken?.(payload.content);
      } else if (payload.type === "done") {
        handlers.onDone?.(payload.sources);
      } else if (payload.type === "error") {
        throw new Error(payload.message);
      }
    }
  }

  // A first message on a session renames it server-side ("New Chat" -> a real
  // title) — let the sidebar know so it doesn't need a navigation to catch up.
  notifySessionsChanged();
}

export interface ChatSessionPayload {
  id: number;
  title: string;
  created_at: string | null;
  updated_at: string | null;
}

export async function getChatSessions(): Promise<ChatSessionPayload[]> {
  const response = await fetch(`${API_URL}/chat/sessions`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load chat sessions.");
  }

  return response.json();
}

export async function createChatSession(): Promise<ChatSessionPayload> {
  const response = await fetch(`${API_URL}/chat/sessions`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to create chat session.");
  }

  const session = await response.json();
  notifySessionsChanged();
  return session;
}

export async function renameChatSession(id: number, title: string): Promise<ChatSessionPayload> {
  const response = await fetch(`${API_URL}/chat/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error("Failed to rename chat session.");
  }

  return response.json();
}

export async function deleteChatSession(id: number) {
  const response = await fetch(`${API_URL}/chat/sessions/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete chat session.");
  }

  const result = await response.json();
  notifySessionsChanged();
  return result;
}

export async function getChatSessionMessages(sessionId: number) {
  const response = await fetch(`${API_URL}/chat/sessions/${sessionId}/messages`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load chat history.");
  }

  return response.json();
}

export interface ReportPayload {
  report: string;
  sources: string[];
}

export async function generateSessionReport(
  sessionId: number,
  source: "auto" | "local" | "integration" = "auto",
  integrationId?: number
): Promise<ReportPayload> {
  const params = new URLSearchParams({ session_id: String(sessionId), source });
  if (source === "integration" && integrationId != null) {
    params.append("integration_id", String(integrationId));
  }

  const response = await fetch(`${API_URL}/report/session?${params.toString()}`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate report.");
  }

  return response.json();
}

export async function generateDatasetReport(
  topic: string,
  documentIds: number[] | undefined,
  source: "auto" | "local" | "integration" = "auto",
  integrationId?: number
): Promise<ReportPayload> {
  const params = new URLSearchParams({ topic, source });
  documentIds?.forEach((id) => params.append("document_ids", String(id)));
  if (source === "integration" && integrationId != null) {
    params.append("integration_id", String(integrationId));
  }

  const response = await fetch(`${API_URL}/report/dataset?${params.toString()}`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate report.");
  }

  return response.json();
}

export async function exportReportFile(
  report: ReportPayload,
  format: "docx" | "pdf",
  title: string
) {
  const response = await fetch(`${API_URL}/report/export?format=${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ ...report, title }),
  });

  if (!response.ok) {
    throw new Error(`Failed to export report as ${format}.`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cognexa_report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export interface GeneratedReportPayload {
  id: number;
  session_id: number | null;
  topic: string | null;
  title: string;
  report: string;
  sources: string[];
  created_at: string | null;
  updated_at: string | null;
}

export async function getGeneratedReports(): Promise<GeneratedReportPayload[]> {
  const response = await fetch(`${API_URL}/reports`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load saved reports.");
  }

  return response.json();
}

// Settings
export async function getSettings() {
  const response = await fetch(`${API_URL}/settings`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load settings.");
  }

  return response.json();
}

export interface SettingsPayload {
  ollama_url: string;
  llm_model: string;
  embedding_model: string;
  chunk_size: number;
  chunk_overlap: number;
  theme: string;
  email_notifications: boolean;
  auto_reindex_stuck: boolean;
  duplicate_detection: boolean;
}

export async function updateSettings(settings: SettingsPayload) {
  const response = await fetch(`${API_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    throw new Error("Failed to save settings.");
  }

  return response.json();
}

// Chatbot integrations (Cline, or any other API-key/local based assistant).
// A user can save multiple, and pick which one to use per-question in chat.
export interface IntegrationPayload {
  id: number;
  provider_name: string;
  base_url: string | null;
  model: string | null;
  connected: boolean;
  created_at: string | null;
}

export interface IntegrationInput {
  providerName: string;
  apiKey: string | null;
  baseUrl: string | null;
  model: string | null;
}

export async function getIntegrations(): Promise<IntegrationPayload[]> {
  const response = await fetch(`${API_URL}/integrations`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load chatbot integrations.");
  }

  return response.json();
}

export async function createIntegration(
  input: IntegrationInput
): Promise<IntegrationPayload> {
  const response = await fetch(`${API_URL}/integrations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      provider_name: input.providerName,
      api_key: input.apiKey,
      base_url: input.baseUrl,
      model: input.model,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save chatbot integration.");
  }

  return response.json();
}

export async function deleteIntegration(id: number) {
  const response = await fetch(`${API_URL}/integrations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to remove chatbot integration.");
  }

  return response.json();
}

// Data source connections (Google Drive, GitHub, MkDocs, etc.)
export interface GoogleDriveFolder {
  id: string;
  name: string;
}

export interface GoogleDriveConfig {
  sync_deleted: boolean;
  account_email: string | null;
  folders: GoogleDriveFolder[];
}

export interface DataSourcePayload {
  id: number;
  source_name: string;
  connected: boolean;
  status: string | null;
  status_message: string | null;
  last_synced_at: string | null;
  synced_size_bytes: number;
  config: GoogleDriveConfig | null;
  created_at: string | null;
}

export interface DataSourceSyncStarted {
  started: boolean;
  status: string;
}

export async function getDataSources(): Promise<DataSourcePayload[]> {
  const response = await fetch(`${API_URL}/data-sources`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load data sources.");
  }

  return response.json();
}

export async function createDataSource(
  sourceName: string,
  credential: string | null,
  config?: GoogleDriveConfig
): Promise<DataSourcePayload> {
  const response = await fetch(`${API_URL}/data-sources`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ source_name: sourceName, credential, config: config ?? null }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to connect data source.");
  }

  return response.json();
}

// Redirects the browser through Google's consent screen; on success Google
// redirects back to /settings/data-sources?connected=1 with the new
// connection already created server-side.
export async function getGoogleDriveAuthorizeUrl(): Promise<{ url: string }> {
  const response = await fetch(`${API_URL}/data-sources/google-drive/authorize`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to start Google Drive connection.");
  }

  return response.json();
}

// A short-lived access token to feed into the Google Picker widget so it can
// browse the connection's own Drive account.
export async function getGoogleDrivePickerToken(
  connectionId: number
): Promise<{ access_token: string; expires_in: number }> {
  const response = await fetch(`${API_URL}/data-sources/${connectionId}/google-drive/picker-token`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to get a Google Drive access token.");
  }

  return response.json();
}

export async function updateGoogleDriveFolders(
  connectionId: number,
  folders: GoogleDriveFolder[]
): Promise<DataSourcePayload> {
  const response = await fetch(`${API_URL}/data-sources/${connectionId}/google-drive/folders`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ folders }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update synced folders.");
  }

  return response.json();
}

export async function deleteDataSource(id: number) {
  const response = await fetch(`${API_URL}/data-sources/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to disconnect data source.");
  }

  return response.json();
}

export async function syncDataSource(id: number): Promise<DataSourceSyncStarted> {
  const response = await fetch(`${API_URL}/data-sources/${id}/sync`, {
    method: "POST",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to sync data source.");
  }

  return response.json();
}

// Chat channels (Discord, Telegram, etc. bots that expose the same RAG chat)
export interface ChatChannelPayload {
  id: number;
  channel_name: string;
  connected: boolean;
  bot_username: string | null;
  created_at: string | null;
}

export async function getChatChannels(): Promise<ChatChannelPayload[]> {
  const response = await fetch(`${API_URL}/chat-channels`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load chat channels.");
  }

  return response.json();
}

export async function createChatChannel(
  channelName: string,
  botToken: string | null
): Promise<ChatChannelPayload> {
  const response = await fetch(`${API_URL}/chat-channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ channel_name: channelName, bot_token: botToken }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to connect chat channel.");
  }

  return response.json();
}

export async function deleteChatChannel(id: number) {
  const response = await fetch(`${API_URL}/chat-channels/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to disconnect chat channel.");
  }

  return response.json();
}

export interface TelegramTestResult {
  ok: boolean;
  status_message: string;
  webhook_url: string | null;
  pending_update_count: number;
  last_error_message: string | null;
  last_error_date: number | null;
}

export async function testTelegramChannel(id: number): Promise<TelegramTestResult> {
  const response = await fetch(`${API_URL}/chat-channels/${id}/telegram/test`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to test the Telegram connection.");
  }

  return response.json();
}

// Billing / subscription plan (demo checkout, no real payment processor)
export interface PlanPayload {
  plan: "community" | "pro" | "team";
  max_documents: number | null;
  max_storage_bytes: number | null;
  document_count: number;
  storage_bytes: number;
  max_ai_credits: number | null;
  ai_credits_remaining: number | null;
  max_apps: number | null;
  apps_connected: number;
  max_chat_channels: number | null;
  chat_channels_connected: number;
  billing_cycle_start: string | null;
  billing_cycle_end: string | null;
}

export async function getBillingPlan(): Promise<PlanPayload> {
  const response = await fetch(`${API_URL}/billing/plan`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load plan.");
  }

  return response.json();
}

export interface SubscribeInput {
  plan: "community" | "pro" | "team";
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
}

export async function subscribePlan(input: SubscribeInput): Promise<PlanPayload> {
  const response = await fetch(`${API_URL}/billing/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      plan: input.plan,
      card_number: input.cardNumber || null,
      card_expiry: input.cardExpiry || null,
      card_cvc: input.cardCvc || null,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to subscribe.");
  }

  return response.json();
}

// Dashboard stats
export async function getStats() {
  const response = await fetch(`${API_URL}/stats`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load stats.");
  }

  return response.json();
}

// Data management
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportKnowledgeBase() {
  const response = await fetch(`${API_URL}/data/export`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to export knowledge base.");
  }

  downloadBlob(await response.blob(), "cognexa_knowledge_base.zip");
}

export async function backupAccount() {
  const response = await fetch(`${API_URL}/data/backup`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to create backup.");
  }

  downloadBlob(await response.blob(), "cognexa_backup.json");
}

export interface RestoreResult {
  restored_chat_messages: number;
  restored_integrations: number;
}

export async function restoreAccount(file: File): Promise<RestoreResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/data/restore`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to restore backup.");
  }

  return response.json();
}

export async function deleteAllDocuments() {
  const response = await fetch(`${API_URL}/documents`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete all documents.");
  }

  return response.json();
}

export async function deleteAccount() {
  const response = await fetch(`${API_URL}/account`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete account.");
  }

  return response.json();
}
