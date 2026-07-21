"use client";

import DocsLayout, { DocsCrumb, DocsHeading, DocsParagraph, DocsList } from "@/components/DocsLayout";

const TOC = [
  { id: "model-providers", label: "Model providers" },
  { id: "data-sources", label: "Data sources" },
  { id: "data-management", label: "Data management" },
  { id: "billing-plans", label: "Billing & plans" },
  { id: "chat-channels", label: "Chat channels" },
  { id: "automation-settings", label: "Automation settings" },
  { id: "account-settings", label: "Account settings" },
];

export default function AdminGuides() {
  return (
    <DocsLayout activeHref="/docs/admin-guides" toc={TOC}>
      <DocsCrumb label="Administrator guides" />

      <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">
        Administrator guides
      </h1>

      <DocsParagraph>
        Configuration and account-level settings for whoever manages the
        Cognexa instance &mdash; model providers, connected data sources,
        billing, automation, and account management.
      </DocsParagraph>

      <DocsHeading id="model-providers">Model providers</DocsHeading>
      <DocsParagraph>
        Under Settings &rarr; Model Provider, stay on the free local Ollama model
        or connect a hosted provider with an API key.
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Local (default)</strong> &mdash; Ollama with <code>llama3.2</code>.
          No cloud call required; all data stays on your machine
        </li>
        <li>
          <strong>OpenAI</strong> &mdash; GPT-4, GPT-3.5, and other models
        </li>
        <li>
          <strong>Anthropic</strong> &mdash; Claude 3 Opus, Sonnet, Haiku
        </li>
        <li>
          <strong>Cohere</strong> &mdash; Command R / R+
        </li>
        <li>
          <strong>Google Gemini</strong> &mdash; Gemini 1.5 Pro / Flash
        </li>
        <li>
          <strong>OpenRouter</strong> &mdash; Unified API for dozens of models (includes free tier)
        </li>
        <li>
          <strong>Groq</strong> &mdash; Fast inference on open models
        </li>
        <li>
          <strong>Cline</strong> &mdash; Local-first agentic coding assistant
        </li>
        <li>
          <strong>LM Studio</strong> &mdash; Run local models via LM Studio endpoint
        </li>
        <li>
          <strong>Plan limits</strong> &mdash; Community plan allows local model + OpenRouter free models only;
          Pro allows up to 3 provider connections; Unlimited allows unlimited connections
        </li>
      </DocsList>

      <DocsHeading id="data-sources">Data sources</DocsHeading>
      <DocsParagraph>
        Manage connected apps and integrations from Settings &rarr; Data Sources.
        External sources can be indexed alongside your uploaded documents.
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>GitHub</strong> &mdash; Connect GitHub repositories to index
          code, issues, and documentation (available now)
        </li>
        <li>
          <strong>Google Drive</strong> &mdash; Connect Google Drive to index
          documents stored in the cloud (coming soon)
        </li>
        <li>
          <strong>Plan limits</strong> &mdash; Free plans support up to 2 connected
          apps; paid plans support more
        </li>
      </DocsList>

      <DocsHeading id="data-management">Data management</DocsHeading>
      <DocsParagraph>
        The Data Management page (Settings &rarr; Data Management) provides
        tools for maintaining your knowledge base:
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Export knowledge base</strong> &mdash; Download all your
          documents as a .zip archive
        </li>
        <li>
          <strong>Backup & restore</strong> &mdash; Export your account
          configuration as .json and restore it later
        </li>
        <li>
          <strong>Delete documents</strong> &mdash; Remove all documents from
          your knowledge base at once
        </li>
        <li>
          <strong>Delete account</strong> &mdash; Permanently delete your
          account and all associated data
        </li>
        <li>Review storage usage per dataset</li>
        <li>Remove individual documents that are no longer needed</li>
        <li>Re-index a dataset after bulk changes to refresh the vector store</li>
      </DocsList>

      <DocsHeading id="billing-plans">Billing & plans</DocsHeading>
      <DocsParagraph>
        Upgrade or downgrade between Community, Pro, and Unlimited from
        Settings &rarr; Billing.
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Community</strong> &mdash; Free (self-hosted). Up to 25 documents,
          15 MB storage, local model + OpenRouter free models only
        </li>
        <li>
          <strong>Pro</strong> &mdash; $19/month. Up to 100 documents, 10 GB storage,
          up to 3 AI provider connections
        </li>
        <li>
          <strong>Unlimited</strong> &mdash; $49/month. Unlimited documents and storage
          (fair use), unlimited provider connections
        </li>
        <li>
          <strong>Priority scheduling</strong> &mdash; Higher-tier plans receive
          priority for document indexing and chat generation under concurrent load
        </li>
        <li>
          <strong>Usage bars</strong> &mdash; The billing page shows real-time usage
          for documents, storage, and AI credits
        </li>
      </DocsList>

      <DocsHeading id="chat-channels">Chat channels</DocsHeading>
      <DocsParagraph>
        Connect external chat surfaces to reach the Cognexa assistant outside
        the web app. Configured from Settings &rarr; Chat Channels.
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Telegram</strong> &mdash; Connect a Telegram bot to ask
          questions via Telegram (coming soon)
        </li>
        <li>
          <strong>Plan limits</strong> &mdash; Number of chat channel connections
          is gated by your plan tier
        </li>
      </DocsList>

      <DocsHeading id="automation-settings">Automation settings</DocsHeading>
      <DocsParagraph>
        Fine-tune Cognexa's behavior from Settings &rarr; Automation:
      </DocsParagraph>
      <DocsList>
        <li>
          <strong>Chunking parameters</strong> &mdash; Configure how documents
          are split into chunks for embedding
        </li>
        <li>
          <strong>Auto re-index</strong> &mdash; Toggle automatic retry for
          documents stuck in &ldquo;Processing&rdquo; status
        </li>
        <li>
          <strong>Duplicate detection</strong> &mdash; Enable or disable
          SHA-256 duplicate blocking on upload
        </li>
        <li>
          <strong>Theme</strong> &mdash; Switch between light and dark mode
        </li>
        <li>
          <strong>Notifications</strong> &mdash; Configure notification preferences
        </li>
      </DocsList>

      <DocsHeading id="account-settings">Account settings</DocsHeading>
      <DocsParagraph>
        Manage your account from the main Settings page:
      </DocsParagraph>
      <DocsList>
        <li>Update your display name</li>
        <li>View your email address (read-only)</li>
        <li>Change your password</li>
        <li>Idle auto-logout after 1 hour of inactivity for security</li>
      </DocsList>
    </DocsLayout>
  );
}