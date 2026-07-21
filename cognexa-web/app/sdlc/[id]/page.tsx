"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useDialog } from "@/lib/DialogContext";
import {
  getProject,
  getProjectStages,
  createProjectStage,
  updateStageStatus,
  deleteStage,
  getProjectArtifacts,
  createProjectArtifact,
  deleteArtifact,
  updateArtifact,
  getArtifactContent,
  generateProjectArtifact,
  getIntegrations,
  downloadArtifactFile,
  downloadAllArtifacts,
  retryProjectGeneration,
  ProjectPayload,
  SDLCStagePayload,
  ProjectArtifactPayload,
  ArtifactGenerateInput,
  IntegrationPayload,
} from "@/lib/api";

const STAGE_COLORS: Record<string, string> = {
  requirements: "border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-500/5",
  design: "border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-500/5",
  development: "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-500/5",
  testing: "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-500/5",
  documentation: "border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-500/5",
  deployment: "border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-500/5",
  maintenance: "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50",
};

const STAGE_LABELS: Record<string, string> = {
  requirements: "Plan",
  design: "Design",
  development: "Build",
  testing: "Test",
  documentation: "Document",
  deployment: "Deploy",
  maintenance: "Maintain",
};

const STAGE_ICONS: Record<string, string> = {
  requirements: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  design: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  development: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  testing: "M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z",
  documentation: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  deployment: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
  maintenance: "M11.42 15.17l-5.1 5.1a2 2 0 01-2.83 0l-1.41-1.41a2 2 0 010-2.83l5.1-5.1m5.66-5.66l1.41-1.41a2 2 0 012.83 0l1.41 1.41a2 2 0 010 2.83l-5.1 5.1m-5.66 5.66l9.19-9.19",
};

const STAGE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  review: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400",
  blocked: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
};

const ARTIFACT_TYPE_LABELS: Record<string, string> = {
  requirement: "Requirements Doc",
  design_doc: "Design Document",
  wireframe: "Wireframe",
  source_code: "Source Code",
  test_suite: "Test Suite",
  test_report: "Test Report",
  deployment_script: "Deployment Script",
  documentation: "Documentation",
  diagram: "Diagram",
  other: "Other",
};

const ARTIFACT_TYPE_ICONS: Record<string, string> = {
  requirement: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  design_doc: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  source_code: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  test_suite: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  documentation: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  diagram: "M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
  deployment_script: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
  test_report: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
  wireframe: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z",
  other: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z",
};

const WORKFLOW_STAGES = ["requirements", "design", "development", "testing", "documentation", "deployment"];

const GENERATION_STAGES = [
  { key: "analyzing", label: "Analyzing Requirements", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
  { key: "planning_stages", label: "Generating SDLC Stages", icon: "M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5" },
  { key: "creating_artifacts", label: "Creating Artifacts", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { key: "generating_docs", label: "Generating Documentation", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { key: "finalizing", label: "Finalizing Project", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

interface ArtifactViewerState {
  artifact: ProjectArtifactPayload;
  content: string;
  generatedBy: string | null;
  files: Record<string, string> | null;
}

const CODE_ARTIFACT_TYPES = new Set(["source_code", "deployment_script", "test_suite"]);
const CODE_EXTENSIONS = /\.(ts|tsx|js|jsx|py|json|yaml|yml|sql|sh|css|html)$/i;

function isCodeArtifact(artifact: ProjectArtifactPayload): boolean {
  return CODE_ARTIFACT_TYPES.has(artifact.artifact_type) || CODE_EXTENSIONS.test(artifact.name);
}

function isPlaywrightArtifact(artifact: ProjectArtifactPayload): boolean {
  return artifact.file_type === "playwright_project";
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { notify, confirm } = useDialog();

  const projectId = Number(params.id);
  const [project, setProject] = useState<ProjectPayload | null>(null);
  const [stages, setStages] = useState<SDLCStagePayload[]>([]);
  const [artifacts, setArtifacts] = useState<ProjectArtifactPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string>("requirements");
  const [artifactViewer, setArtifactViewer] = useState<ArtifactViewerState | null>(null);
  const [isEditingArtifact, setIsEditingArtifact] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [savingArtifact, setSavingArtifact] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const pollProjectRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isGenerating = project?.status === "generating";
  const isError = project?.status === "error";

  useEffect(() => {
    if (!Number.isNaN(projectId)) loadProject();
    return () => {
      if (pollProjectRef.current) clearInterval(pollProjectRef.current);
    };
  }, [projectId]);

  async function loadProject() {
    try {
      const [projectData, stagesData, artifactsData] = await Promise.all([
        getProject(projectId),
        getProjectStages(projectId),
        getProjectArtifacts(projectId),
      ]);
      setProject(projectData);
      setStages(stagesData);
      setArtifacts(artifactsData);
      if (stagesData.length > 0) {
        setSelectedStage(stagesData[0].stage_type);
      }

      // Start polling if project is still generating
      if (projectData.status === "generating") {
        if (!pollProjectRef.current) {
          pollProjectRef.current = setInterval(pollProjectStatus, 3000);
        }
      } else {
        if (pollProjectRef.current) {
          clearInterval(pollProjectRef.current);
          pollProjectRef.current = null;
        }
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to load project.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function pollProjectStatus() {
    try {
      const projectData = await getProject(projectId);
      const prevStatus = project?.status;
      setProject(projectData);

      if (projectData.status === "completed" && prevStatus === "generating") {
        notify("Project generation completed! Loading stages and artifacts...", "success");
        const [stagesData, artifactsData] = await Promise.all([
          getProjectStages(projectId),
          getProjectArtifacts(projectId),
        ]);
        setStages(stagesData);
        setArtifacts(artifactsData);
        if (stagesData.length > 0) {
          setSelectedStage(stagesData[0].stage_type);
        }
        if (pollProjectRef.current) {
          clearInterval(pollProjectRef.current);
          pollProjectRef.current = null;
        }
      } else if (projectData.status === "error" && prevStatus === "generating") {
        notify("Project generation failed.", "error");
        if (pollProjectRef.current) {
          clearInterval(pollProjectRef.current);
          pollProjectRef.current = null;
        }
      } else if (projectData.status !== "generating" && projectData.status !== "error") {
        if (pollProjectRef.current) {
          clearInterval(pollProjectRef.current);
          pollProjectRef.current = null;
        }
      }
    } catch {
      // Silent fail on poll
    }
  }

  async function handleRetryGeneration() {
    if (!project) return;
    const confirmed = await confirm({
      title: "Retry generation?",
      message: `Retry AI generation for "${project.name}"?`,
      confirmLabel: "Retry",
    });
    if (!confirmed) return;
    try {
      const updated = await retryProjectGeneration(project.id);
      setProject(updated);
      if (!pollProjectRef.current) {
        pollProjectRef.current = setInterval(pollProjectStatus, 3000);
      }
      notify("Generation retrying...", "info");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to retry generation.", "error");
    }
  }

  async function handleViewArtifact(artifact: ProjectArtifactPayload) {
    try {
      const { content, generated_by } = await getArtifactContent(artifact.id);
      setIsEditingArtifact(false);
      if (isPlaywrightArtifact(artifact)) {
        const files = (artifact.metadata?.files as Record<string, string> | undefined) || null;
        const firstFile = files ? Object.keys(files).find((f) => f.startsWith("tests/")) || Object.keys(files)[0] : null;
        setSelectedFile(firstFile || null);
        setArtifactViewer({ artifact, content: content || "", generatedBy: generated_by, files });
      } else {
        setSelectedFile(null);
        setArtifactViewer({ artifact, content: content || "No content available.", generatedBy: generated_by, files: null });
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to load content.", "error");
    }
  }

  function handleEditArtifact(artifact: ProjectArtifactPayload) {
    if (artifactViewer?.artifact.id === artifact.id) {
      setEditedContent(artifactViewer.content);
      setIsEditingArtifact(true);
      return;
    }
    handleViewArtifact(artifact).then(() => {
      setIsEditingArtifact(true);
    });
  }

  async function handleSaveArtifact() {
    if (!artifactViewer) return;
    setSavingArtifact(true);
    try {
      const updated = await updateArtifact(artifactViewer.artifact.id, { content: editedContent });
      setArtifacts((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setArtifactViewer({ artifact: updated, content: editedContent, generatedBy: artifactViewer.generatedBy, files: artifactViewer.files });
      setIsEditingArtifact(false);
      notify("Artifact updated.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to update artifact.", "error");
    } finally {
      setSavingArtifact(false);
    }
  }

  async function handleDeleteArtifact(artifact: ProjectArtifactPayload) {
    const confirmed = await confirm({ title: "Delete artifact", message: `Delete "${artifact.name}"?`, confirmLabel: "Delete", danger: true });
    if (!confirmed) return;
    try {
      await deleteArtifact(artifact.id);
      setArtifacts((prev) => prev.filter((a) => a.id !== artifact.id));
      if (artifactViewer?.artifact.id === artifact.id) setArtifactViewer(null);
      notify("Artifact deleted.", "success");
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to delete.", "error");
    }
  }

  const stagesMap = new Map(stages.map((s) => [s.stage_type, s]));
  const artifactsByStage = new Map<string, ProjectArtifactPayload[]>();
  for (const a of artifacts) {
    const stage = stages.find((s) => s.id === a.stage_id);
    const key = stage?.stage_type || "other";
    if (!artifactsByStage.has(key)) artifactsByStage.set(key, []);
    artifactsByStage.get(key)!.push(a);
  }

  const completedStages = stages.filter((s) => s.status === "completed").length;
  const progressPercent = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

  const generationProgress = project?.generation_progress;
  const currentGenStage = generationProgress?.stage;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Project not found</h3>
        <button onClick={() => router.push("/sdlc")} className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg">Back to Projects</button>
      </div>
    );
  }

  // ============ GENERATING STATE: Live progress view ============
  if (stages.length === 0 && (isGenerating || isError)) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/sdlc" className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400">SDLC Projects</Link>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-300 dark:text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="max-w-[16rem] truncate text-gray-700 dark:text-gray-300">{project.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          {project.description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>}
        </div>

        <div className="rounded-2xl border border-indigo-200 dark:border-indigo-700 bg-gradient-to-br from-indigo-50 via-white to-fuchsia-50 dark:from-indigo-500/10 dark:via-gray-900 dark:to-fuchsia-500/5 p-10 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-indigo-500/20">
            {isError ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-12 w-12">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="h-12 w-12 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
          </div>

          <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isError ? "Generation Failed" : "Building Your Project"}
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-sm text-gray-600 dark:text-gray-400">
            {isError
              ? "The AI generation encountered an error. You can retry or delete the project."
              : "Cognexa AI is analyzing your project description and generating the complete SDLC workflow in the background. This page updates automatically."}
          </p>

          {/* Generation progress */}
          {!isError && (
            <div className="mx-auto max-w-md space-y-6">
              {/* Overall progress bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">
                    {generationProgress?.label || "Starting..."}
                  </span>
                  <span className="text-gray-500">{generationProgress?.progress || 0}%</span>
                </div>
                <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-1000 ease-out"
                    style={{ width: `${generationProgress?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Stage list */}
              <div className="space-y-3 text-left">
                {GENERATION_STAGES.map((stage) => {
                  const isActive = currentGenStage === stage.key;
                  const isPast = GENERATION_STAGES.findIndex(s => s.key === currentGenStage) > GENERATION_STAGES.findIndex(s => s.key === stage.key);
                  const isDone = currentGenStage === "completed" || (currentGenStage && GENERATION_STAGES.findIndex(s => s.key === currentGenStage) > GENERATION_STAGES.findIndex(s => s.key === stage.key));

                  return (
                    <div
                      key={stage.key}
                      className={`flex items-center gap-3 rounded-xl border p-4 transition-all ${
                        isActive
                          ? "border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-500/5"
                          : isPast || isDone
                          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-500/5"
                          : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 opacity-50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : isPast || isDone
                          ? "bg-emerald-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                      }`}>
                        {isPast || isDone ? (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d={stage.icon} />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span className={`text-sm font-medium ${
                          isActive
                            ? "text-indigo-700 dark:text-indigo-300"
                            : isPast || isDone
                            ? "text-emerald-700 dark:text-emerald-300"
                            : "text-gray-500 dark:text-gray-400"
                        }`}>
                          {stage.label}
                        </span>
                      </div>
                      {isActive && (
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="mx-auto max-w-md">
              <div className="mb-4 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-800 p-4 text-left">
                <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">Error details:</p>
                <p className="text-xs text-red-600 dark:text-red-400">{project.generation_error || "Unknown error occurred during generation."}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleRetryGeneration}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Retry Generation
                </button>
                <button
                  onClick={() => router.push("/sdlc")}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Back to Projects
                </button>
              </div>
            </div>
          )}

          {/* Generating message */}
          {!isError && (
            <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
              This page refreshes automatically. You can safely navigate away and come back later.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============ EMPTY STATE: No stages, not generating ============
  if (stages.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Link href="/sdlc" className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400">SDLC Projects</Link>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-300 dark:text-gray-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="max-w-[16rem] truncate text-gray-700 dark:text-gray-300">{project.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
          {project.description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>}
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-bold text-white">
            SDLC
          </div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">No SDLC workflow yet</h3>
          <p className="mb-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            This project has been created but no SDLC workflow has been generated yet.
          </p>
          <button
            onClick={() => router.push("/sdlc")}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-medium text-white shadow-md transition hover:shadow-lg"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // ============ WORKFLOW VIEW: Stages + Artifacts ============
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <Link href="/sdlc" className="font-medium transition hover:text-indigo-600 dark:hover:text-indigo-400">SDLC Projects</Link>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3 w-3 text-gray-300 dark:text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="max-w-[16rem] truncate text-gray-700 dark:text-gray-300">{project.name}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h1>
        {project.description && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{project.description}</p>}
      </div>

      {/* Pipeline Navigator */}
      <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold text-gray-900 dark:text-gray-100">SDLC Pipeline</h2>
        <div className="flex items-center overflow-x-auto pb-1">
          {WORKFLOW_STAGES.map((stageType, idx) => {
            const stage = stagesMap.get(stageType);
            const stageArtifacts = artifactsByStage.get(stageType) || [];
            const isActive = selectedStage === stageType;
            const isCompleted = stage?.status === "completed";
            const isInProgress = stage?.status === "in_progress";

            const nodeColor = isActive
              ? "border-transparent bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.03]"
              : isCompleted
              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
              : isInProgress
              ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400";

            return (
              <div key={stageType} className="flex flex-1 items-center last:flex-none">
                <button
                  onClick={() => stage && setSelectedStage(stageType)}
                  className={`flex shrink-0 items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 min-w-[150px] ${nodeColor} ${!stage ? "opacity-40 cursor-default" : "hover:-translate-y-0.5 hover:shadow-md cursor-pointer"}`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-white/20" : "bg-white dark:bg-gray-900"}`}>
                    {isCompleted && !isActive ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4 text-green-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d={STAGE_ICONS[stageType] || STAGE_ICONS.requirements} />
                      </svg>
                    )}
                  </div>
                  <div className="text-left">
                    <div className={`text-[11px] ${isActive ? "text-white/70" : "text-gray-400 dark:text-gray-500"}`}>{idx === 0 ? "Start" : `Step ${idx + 1}`}</div>
                    <div className="font-semibold leading-tight">{STAGE_LABELS[stageType]}</div>
                  </div>
                  {stageArtifacts.length > 0 && (
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${isActive ? "bg-white/20 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>
                      {stageArtifacts.length}
                    </span>
                  )}
                </button>
                {idx < WORKFLOW_STAGES.length - 1 && (
                  <div className={`mx-1.5 h-1 min-w-[24px] flex-1 rounded-full transition-colors duration-300 ${isCompleted ? "bg-gradient-to-r from-green-400 to-indigo-300 dark:from-green-500 dark:to-indigo-500" : "bg-gray-100 dark:bg-gray-800"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Detail + Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Stage Detail */}
        <div className="lg:col-span-2 space-y-4">
          {WORKFLOW_STAGES.filter((st) => st === selectedStage).map((stageType) => {
            const stage = stagesMap.get(stageType);
            const stageArtifacts = artifactsByStage.get(stageType) || [];
            if (!stage) return null;

            return (
              <div key={stage.id} className={`rounded-2xl border-2 ${STAGE_COLORS[stageType] || ""} bg-white dark:bg-gray-900 p-6 shadow-sm`}>
                {/* Stage header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d={STAGE_ICONS[stageType]} />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stage.description?.slice(0, 120)}{(stage.description?.length || 0) > 120 ? "..." : ""}</p>
                    </div>
                  </div>
                  <select value={stage.status} onChange={(e) => { updateStageStatus(stage.id, e.target.value); setStages((prev) => prev.map((s) => s.id === stage.id ? { ...s, status: e.target.value } : s)); }}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 outline-none">
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* Artifacts list */}
                <div className="space-y-3">
                  {stageArtifacts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-6 text-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500">No artifacts for this stage.</p>
                    </div>
                  ) : (
                    stageArtifacts.map((artifact) => (
                      <div key={artifact.id} className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 p-4 transition hover:shadow-md">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d={ARTIFACT_TYPE_ICONS[artifact.artifact_type] || ARTIFACT_TYPE_ICONS.other} />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                                  {isPlaywrightArtifact(artifact) ? "Playwright E2E Tests" : (ARTIFACT_TYPE_LABELS[artifact.artifact_type] || artifact.artifact_type)}
                                </span>
                                <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{artifact.name}</span>
                              </div>
                              {artifact.description && <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{artifact.description}</p>}
                              {artifact.generated_by && <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">by {artifact.generated_by} · v{artifact.version}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => handleViewArtifact(artifact)} className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-200 dark:hover:bg-gray-700" title="View">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.923 7.508 7.235 5 12 5c4.765 0 8.076 2.508 9.964 6.322.098.262.098.555 0 .817C20.076 16.508 16.765 19 12 19c-4.765 0-8.076-2.508-9.964-6.322z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            </button>
                            {artifact.content && (
                              <button
                                onClick={() => downloadArtifactFile(artifact.id, artifact.name, isPlaywrightArtifact(artifact) ? "zip" : "docx")}
                                className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-200 dark:hover:bg-gray-700"
                                title={isPlaywrightArtifact(artifact) ? "Download Playwright Project (.zip)" : "Download"}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                              </button>
                            )}
                            <button onClick={() => handleEditArtifact(artifact)} className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-200 dark:hover:bg-gray-700" title="Edit">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                            </button>
                            <button onClick={() => handleDeleteArtifact(artifact)} className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4">
          {/* Project Information */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Project Information</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Status</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{project.status}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Stages</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{stages.length}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Artifacts</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{artifacts.length}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500 dark:text-gray-400">Created</dt><dd className="font-medium text-gray-900 dark:text-gray-100">{project.created_at ? new Date(project.created_at).toLocaleDateString() : "—"}</dd></div>
            </dl>
          </div>

          {/* Progress Overview */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">Progress Overview</h3>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Overall completion</span>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mb-4">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="space-y-2">
              {WORKFLOW_STAGES.map((stageType) => {
                const stage = stagesMap.get(stageType);
                const stageArtifacts = artifactsByStage.get(stageType) || [];
                const status = stage?.status || "pending";
                const statusColor = STAGE_STATUS_COLORS[status] || STAGE_STATUS_COLORS.pending;
                return (
                  <div key={stageType} className="flex items-center justify-between rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-6 w-6 items-center justify-center rounded bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-3.5 w-3.5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d={STAGE_ICONS[stageType] || STAGE_ICONS.requirements} />
                        </svg>
                      </div>
                      <span className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{STAGE_LABELS[stageType]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{stageArtifacts.length} artifacts</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColor}`}>{status.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Downloads */}
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Downloads</h3>
              {artifacts.length > 0 && (
                <button
                  onClick={() => downloadAllArtifacts(projectId)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 dark:hover:bg-gray-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download All (.zip)
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {artifacts.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No generated documents available yet.
                </p>
              ) : (
                artifacts
                  .filter((a) => a.content)
                  .map((artifact) => (
                    <div key={artifact.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-3 py-2 transition hover:bg-gray-100 dark:hover:bg-gray-700/50">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">{artifact.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {(ARTIFACT_TYPE_LABELS[artifact.artifact_type] || artifact.artifact_type)} · {artifact.created_at ? new Date(artifact.created_at).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <div className="ml-2 flex items-center gap-1 shrink-0">
                        <span className="rounded bg-white dark:bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-500 dark:text-gray-400">.md</span>
                        <button
                          onClick={() => downloadArtifactFile(artifact.id, artifact.name, "docx")}
                          className="rounded p-1 text-gray-500 transition hover:bg-gray-200 dark:hover:bg-gray-600"
                          title="Download Markdown"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-3.5 w-3.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>

      {artifactViewer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => { setArtifactViewer(null); setIsEditingArtifact(false); }}>
          <div
            className="flex h-full w-full max-w-xl animate-slide-in-right flex-col bg-white dark:bg-gray-900 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-gray-800 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                    {ARTIFACT_TYPE_LABELS[artifactViewer.artifact.artifact_type] || artifactViewer.artifact.artifact_type}
                  </span>
                </div>
                <h2 className="mt-1.5 truncate text-lg font-semibold text-gray-900 dark:text-gray-100">{artifactViewer.artifact.name}</h2>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {artifactViewer.generatedBy ? `Generated by ${artifactViewer.generatedBy}` : "Manual entry"}
                  {artifactViewer.files ? ` · ${Object.keys(artifactViewer.files).length} files` : ` · ${artifactViewer.content.length.toLocaleString()} characters`}
                </p>
              </div>
              <button
                onClick={() => { setArtifactViewer(null); setIsEditingArtifact(false); }}
                className="shrink-0 rounded-full p-1.5 text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {artifactViewer.files && !isEditingArtifact && (
              <div className="flex flex-wrap gap-1.5 border-b border-gray-100 dark:border-gray-800 p-3">
                {Object.keys(artifactViewer.files).map((path) => (
                  <button
                    key={path}
                    onClick={() => setSelectedFile(path)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition ${
                      selectedFile === path
                        ? "bg-gradient-to-r from-indigo-600 to-fuchsia-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {path}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5">
              {isEditingArtifact ? (
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="h-full min-h-[24rem] w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 font-mono text-xs text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-indigo-500/40"
                  spellCheck={false}
                />
              ) : artifactViewer.files ? (
                <pre className="overflow-auto rounded-xl bg-gray-50 dark:bg-gray-950 p-4 text-xs leading-relaxed text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                  {(selectedFile && artifactViewer.files[selectedFile]) || "Select a file above to preview it."}
                </pre>
              ) : isCodeArtifact(artifactViewer.artifact) ? (
                <pre className="overflow-auto rounded-xl bg-gray-50 dark:bg-gray-950 p-4 text-xs leading-relaxed text-gray-800 dark:text-gray-200 font-mono whitespace-pre-wrap">
                  {artifactViewer.content}
                </pre>
              ) : (
                <div className="whitespace-pre-wrap rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {artifactViewer.content}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 p-4">
              {isEditingArtifact ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsEditingArtifact(false)}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveArtifact}
                    disabled={savingArtifact}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-fuchsia-600 py-2 text-xs font-medium text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
                  >
                    {savingArtifact ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <div className={`grid gap-2 ${artifactViewer.files ? "grid-cols-2" : "grid-cols-3"}`}>
                  <button
                    onClick={() => navigator.clipboard.writeText((selectedFile && artifactViewer.files?.[selectedFile]) || artifactViewer.content)}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Copy
                  </button>
                  {!artifactViewer.files && (
                    <button
                      onClick={() => { setEditedContent(artifactViewer.content); setIsEditingArtifact(true); }}
                      className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => downloadArtifactFile(artifactViewer.artifact.id, artifactViewer.artifact.name, artifactViewer.files ? "zip" : "docx")}
                    className="rounded-xl border border-gray-200 dark:border-gray-700 py-2 text-xs font-medium text-gray-700 dark:text-gray-200 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {artifactViewer.files ? ".zip" : ".docx"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}