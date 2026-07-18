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
  documentIds: number[] | undefined,
  handlers: AskStreamHandlers,
  source: "auto" | "local" | "integration" = "auto",
  integrationId?: number
) {
  const params = new URLSearchParams({ question, source });
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
}

export async function getChatHistory() {
  const response = await fetch(`${API_URL}/chat/history`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load chat history.");
  }

  return response.json();
}

export async function clearChatHistory() {
  const response = await fetch(`${API_URL}/chat/history`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to clear chat history.");
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

// Billing / subscription plan (demo checkout, no real payment processor)
export interface PlanPayload {
  plan: "community" | "pro" | "team";
  max_documents: number | null;
  max_storage_bytes: number | null;
  document_count: number;
  storage_bytes: number;
  max_ai_credits: number | null;
  ai_credits_remaining: number | null;
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
