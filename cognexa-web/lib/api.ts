const API_URL = "http://127.0.0.1:8000";

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
    throw new Error(err.detail || "Upload failed.");
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
  source: "auto" | "local" | "integration" = "auto"
) {
  const params = new URLSearchParams({ question, source });
  documentIds?.forEach((id) => params.append("document_ids", String(id)));

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

// Chatbot integration (Cline or any other API-key/local based assistant)
export interface ClinePayload {
  connected: boolean;
  cline_api_key: string | null;
  provider_name: string;
  base_url: string | null;
  model: string | null;
}

export interface ClineIntegrationInput {
  apiKey: string | null;
  providerName: string;
  baseUrl: string | null;
  model: string | null;
}

export async function getClineIntegration(): Promise<ClinePayload> {
  const response = await fetch(`${API_URL}/integrations/cline`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to load chatbot integration.");
  }

  return response.json();
}

export async function updateClineIntegration(
  input: ClineIntegrationInput
): Promise<ClinePayload> {
  const response = await fetch(`${API_URL}/integrations/cline`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      cline_api_key: input.apiKey,
      provider_name: input.providerName || "Cline",
      base_url: input.baseUrl,
      model: input.model,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to save chatbot integration.");
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
