"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useDialog } from "@/lib/DialogContext";
import { getProjects, deleteProject, ProjectPayload, ProjectInput, IntegrationPayload, retryProjectGeneration } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  on_hold: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  completed: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  archived: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  generating: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  error: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
  generating: "Generating...",
  error: "Failed",
};

export default function SDLCDashboard() {
  const [projects, setProjects] = useState<ProjectPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState<Set<number>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState<ProjectInput>({
    name: "",
    description: "",
  });
  const [documents, setDocuments] = useState<File[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationPayload[]>([]);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<number | null>(null);
  const { user } = useAuth();
  const { confirm, notify } = useDialog();
  const router = useRouter();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadProjects();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (showCreateModal) {
      loadIntegrations();
    }
  }, [showCreateModal]);

  useEffect(() => {
    // Start or stop polling based on whether any project is generating
    if (polling.size > 0) {
      if (!pollRef.current) {
        pollRef.current = setInterval(pollGeneratingProjects, 3000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
  }, [polling]);

  async function loadProjects() {
    try {
      const data = await getProjects();
      setProjects(data);

      // Identify generating or error projects that need polling
      const needPolling = new Set<number>();
      for (const p of data) {
        if (p.status === "generating" || p.status === "error") {
          needPolling.add(p.id);
        }
      }
      setPolling(needPolling);

      // Show a notification for newly completed projects
      data.forEach((p) => {
        if (p.status === "completed" && p.generation_stage === "completed") {
          // We don't notify on every poll to avoid spam, handled by completion detection
        }
      });
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to load projects.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function pollGeneratingProjects() {
    try {
      const data = await getProjects();
      const needPolling = new Set<number>();
      let changed = false;

      for (const p of data) {
        const existing = projects.find((ep) => ep.id === p.id);
        if (existing && existing.status !== p.status) {
          changed = true;
          if (p.status === "completed" && existing.status === "generating") {
            notify(`"${p.name}" generation completed!`, "success");
          } else if (p.status === "error" && existing.status === "generating") {
            notify(`"${p.name}" generation failed.`, "error");
          }
        }
        if (p.status === "generating" || p.status === "error") {
          needPolling.add(p.id);
        }
      }

      setProjects(data);
      setPolling(needPolling);

      if (needPolling.size === 0 && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      if (!changed) {
        // Even if status didn't change, we may have updated generation_progress
        // so trigger a re-render. setProjects already handles this.
      }
    } catch {
      // Silent fail on poll
    }
  }

  async function loadIntegrations() {
    try {
      const data = await (await import("@/lib/api")).getIntegrations();
      setIntegrations(data);
      if (data.length > 0) {
        setSelectedIntegrationId(data[0].id);
      }
    } catch (err) {
      // Non-blocking
    }
  }

  function handleDocumentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const allowed = files.filter(
      (f) =>
        /\.(pdf|docx|md|txt)$/i.test(f.name)
    );
    setDocuments((prev) => [...prev, ...allowed]);
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleDelete(project: ProjectPayload) {
    const confirmed = await confirm({
      title: "Delete project?",
      message: `Are you sure you want to delete "${project.name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await deleteProject(project.id);
      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      notify("Project deleted successfully.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete project.", "error");
    }
  }

  async function handleRetry(project: ProjectPayload) {
    const confirmed = await confirm({
      title: "Retry generation?",
      message: `Retry AI generation for "${project.name}"?`,
      confirmLabel: "Retry",
    });
    if (!confirmed) return;
    try {
      const updated = await retryProjectGeneration(project.id);
      setProjects((prev) => prev.map((p) => (p.id === project.id ? updated : p)));
      setPolling((prev) => new Set(prev).add(project.id));
      notify("Generation retrying...", "info");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to retry generation.", "error");
    }
  }

  async function handleCreate() {
    if (!newProject.name.trim()) {
      notify("Project name is required.", "error");
      return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("name", newProject.name.trim());
      formData.append("description", (newProject.description || "").trim());
      if (selectedIntegrationId != null) {
        formData.append("integration_id", String(selectedIntegrationId));
      }
      documents.forEach((doc) => {
        formData.append("documents", doc, doc.name);
      });

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const token = typeof window !== "undefined" ? localStorage.getItem("cognexa_token") : null;

      const response = await fetch(`${baseUrl}/sdlc/projects/generate`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to generate project with AI.");
      }

      const project = await response.json();
      handleCloseModal();
      // Add the new project to the list and start polling
      setProjects((prev) => [project, ...prev]);
      setPolling((prev) => new Set(prev).add(project.id));
      notify(`"${project.name}" generation started! You can watch the progress here.`, "success");
      router.push(`/sdlc/${project.id}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to create project.", "error");
    } finally {
      setCreating(false);
    }
  }

  function handleCloseModal() {
    setShowCreateModal(false);
    setDocuments([]);
    setShowAdvanced(false);
    setSelectedIntegrationId(null);
    setNewProject({ name: "", description: "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">SDLC Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your software development lifecycle projects
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-bold text-white">
            SDLC
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No projects yet</h3>
          <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            Create your first SDLC project to start managing requirements, designs, code, tests, and documentation in one place.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isGenerating = project.status === "generating";
            const isError = project.status === "error";
            const progress = project.generation_progress;

            return (
              <div
                key={project.id}
                className={`group relative rounded-2xl border bg-white dark:bg-gray-900 p-5 shadow-sm transition hover:shadow-md ${
                  isGenerating
                    ? "border-indigo-300 dark:border-indigo-700 ring-1 ring-indigo-500/20"
                    : isError
                    ? "border-red-200 dark:border-red-800 ring-1 ring-red-500/20"
                    : "border-gray-100 dark:border-gray-800"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/sdlc/${project.id}`}
                      className="block truncate text-base font-semibold text-gray-900 dark:text-gray-100 transition hover:text-indigo-600 dark:hover:text-indigo-400"
                    >
                      {project.name}
                    </Link>
                    {project.description && !isGenerating && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap gap-1.5">
                  {isGenerating && progress ? (
                    <span className="rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-0.5 text-xs font-medium">
                      {progress.label}
                    </span>
                  ) : (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status] || STATUS_COLORS.planning}`}>
                      {STATUS_LABELS[project.status] || project.status}
                    </span>
                  )}
                  {isGenerating && progress && (
                    <span className="rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 px-2.5 py-0.5 text-xs font-medium">
                      {progress.progress}%
                    </span>
                  )}
                </div>

                {/* Generation progress bar */}
                {isGenerating && progress && (
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-indigo-600 dark:text-indigo-400 font-medium">{progress.label}</span>
                      <span className="text-gray-500">{progress.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000 ease-out"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    {/* Animated pulse dots */}
                    <div className="mt-1 flex items-center gap-1 text-xs text-indigo-400">
                      <span className="flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      <span className="ml-1">Generating...</span>
                    </div>
                  </div>
                )}

                {/* Error state with retry */}
                {isError && project.generation_error && (
                  <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-800 p-3">
                    <p className="text-xs text-red-700 dark:text-red-400 line-clamp-2">
                      {project.generation_error}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => router.push(`/sdlc/${project.id}`)}
                      className="rounded-lg p-1.5 text-xs text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                    >
                      {isGenerating ? "View" : "Open"}
                    </button>
                    {isError && (
                      <button
                        onClick={() => handleRetry(project)}
                        className="rounded-lg p-1.5 text-xs text-amber-600 transition hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-500/10"
                      >
                        Retry
                      </button>
                    )}
                    {!isGenerating && (
                      <button
                        onClick={() => handleDelete(project)}
                        className="rounded-lg p-1.5 text-xs text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6" onClick={handleCloseModal}>
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Project</h2>
              <button onClick={handleCloseModal} className="rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Project Name</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="My Awesome Project"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Project Idea or Description</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Describe what you want to build. The more detail you provide, the better Cognexa can plan the SDLC workflow."
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Example: "A customer support chatbot for a SaaS startup with Slack integration, knowledge base ingestion, and analytics dashboard."
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Requirement Documents <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.md,.txt"
                  onChange={handleDocumentChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-500/10 dark:file:text-indigo-300"
                />
                {documents.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {documents.map((doc, idx) => (
                      <li key={idx} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 px-3 py-2 text-xs text-gray-700 dark:text-gray-300">
                        <span className="truncate">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => removeDocument(idx)}
                          className="ml-3 text-red-600 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: PDF, DOCX, Markdown, TXT. Cognexa will analyze these files to infer requirements, architecture, and initial artifacts.
                </p>
              </div>

              <div className="rounded-xl border border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-gray-100"
                >
                  <span>Advanced Settings</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`h-5 w-5 transition ${showAdvanced ? "rotate-180" : ""}`}>
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>
                {showAdvanced && (
                  <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-4">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">AI Provider & Model</label>
                    <select
                      value={selectedIntegrationId ?? ""}
                      onChange={(e) => setSelectedIntegrationId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-indigo-500"
                    >
                      <option value="">Default (local Ollama)</option>
                      {integrations.map((integration) => (
                        <option key={integration.id} value={integration.id}>
                          {integration.provider_name} {integration.model ? `(${integration.model})` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Leave as Default to use your local Ollama instance, or pick a saved integration to override the provider/model.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newProject.name.trim()}
                className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? "Generating..." : "Generate with AI"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}