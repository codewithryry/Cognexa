"""Background worker for async SDLC project generation.

Runs in a separate thread, updating the project's generation_stage and
generation_progress as each stage completes. The frontend polls the project
endpoint to get real-time progress.
"""

import json
import os
import re
import threading
from datetime import datetime, timezone

from app.database import SessionLocal
from app.models import Project, SDLCStage, ProjectArtifact, SDLCActivityLog
from app.sdlc_ai import generate_sdlc_plan, generate_artifact, generate_playwright_suite


GENERATION_STAGES = [
    ("analyzing", "Analyzing Requirements"),
    ("planning_stages", "Generating SDLC Stages"),
    ("creating_artifacts", "Creating Artifacts"),
    ("generating_docs", "Generating Documentation"),
    ("finalizing", "Finalizing Project"),
]


def _update_progress(db, project_id: int, stage_key: str, stage_label: str, progress: int, error: str | None = None):
    """Update a project's generation progress in the database."""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        return
    project.generation_stage = stage_key
    project.generation_progress = {
        "stage": stage_key,
        "label": stage_label,
        "progress": progress,
        "error": error,
    }
    if error:
        project.generation_error = error
    db.commit()


def _log_activity(db, user_id: int, project_id: int, action: str, description: str):
    log = SDLCActivityLog(
        user_id=user_id,
        project_id=project_id,
        action=action,
        entity_type="project",
        entity_id=project_id,
        description=description,
    )
    db.add(log)
    db.commit()


def run_generation(project_id: int, user_id: int, name: str, description: str,
                   document_texts: list[str], ext_provider: str | None,
                   ext_key: str | None, ext_url: str | None, ext_model: str | None,
                   ollama_url: str, llm_model: str):
    """Run the full SDLC generation in a background thread."""

    db = SessionLocal()
    try:
        # Stage 1: Analyzing
        _update_progress(db, project_id, "analyzing", "Analyzing Requirements", 10)
        db.refresh(db.query(Project).filter(Project.id == project_id).first())

        # Stage 2: Generate SDLC Plan
        _update_progress(db, project_id, "planning_stages", "Generating SDLC Stages", 25)

        plan_result = generate_sdlc_plan(
            description=description or name,
            document_texts=document_texts,
            external_provider=ext_provider,
            external_api_key=ext_key,
            external_base_url=ext_url,
            external_model=ext_model,
            ollama_url=ollama_url,
            llm_model=llm_model,
        )

        stages_data = []
        if plan_result.get("generated_by") != "error" and plan_result.get("raw"):
            try:
                raw_text = plan_result["raw"]
                match = re.search(r"\{.*\}", raw_text, re.DOTALL)
                if match:
                    stages_data = json.loads(match.group(0)).get("stages", [])
            except Exception:
                stages_data = []

        if not stages_data:
            stages_data = [
                {
                    "stage_type": "requirements",
                    "name": "Requirements",
                    "description": "Initial project planning phase",
                    "priority": 100,
                    "artifacts": [
                        {
                            "artifact_type": "requirement",
                            "name": "Requirements Document",
                            "description": "Project requirements and acceptance criteria",
                            "prompt": "Generate requirements for this project",
                        }
                    ],
                }
            ]

        total_artifacts = sum(len(s.get("artifacts", [])) for s in stages_data)
        artifacts_done = 0

        # Stage 3: Create stages + artifacts
        _update_progress(db, project_id, "creating_artifacts", "Creating Artifacts", 40)

        for stage_in in stages_data:
            stage = SDLCStage(
                project_id=project_id,
                stage_type=stage_in.get("stage_type", "planning"),
                name=stage_in.get("name", "Stage"),
                description=stage_in.get("description"),
                priority=int(stage_in.get("priority", 0) or 0),
            )
            db.add(stage)
            db.commit()
            db.refresh(stage)

            artifacts = stage_in.get("artifacts", [])
            for art in artifacts[:5]:
                artifact = ProjectArtifact(
                    project_id=project_id,
                    stage_id=stage.id,
                    artifact_type=art.get("artifact_type", "other"),
                    name=art.get("name", "Artifact"),
                    description=art.get("description"),
                    file_type="text",
                )
                db.add(artifact)
                db.commit()
                db.refresh(artifact)

                try:
                    result = generate_artifact(
                        artifact_type=artifact.artifact_type,
                        name=artifact.name,
                        description=artifact.description,
                        artifact_prompt=art.get("prompt"),
                        external_provider=ext_provider,
                        external_api_key=ext_key,
                        external_base_url=ext_url,
                        external_model=ext_model,
                        ollama_url=ollama_url,
                        llm_model=llm_model,
                    )
                    artifact.content = result.get("content") or ""
                    artifact.generated_by = result.get("generated_by")
                    artifact.size_bytes = len((artifact.content or "").encode("utf-8"))
                    db.commit()
                except Exception:
                    artifact.content = None
                    artifact.generated_by = "error"
                    db.commit()

                artifacts_done += 1
                if total_artifacts > 0:
                    pct = 40 + int((artifacts_done / total_artifacts) * 45)
                    _update_progress(db, project_id, "creating_artifacts", f"Creating Artifacts ({artifacts_done}/{total_artifacts})", min(pct, 85))

            if stage.stage_type == "testing":
                _update_progress(db, project_id, "creating_artifacts", "Generating Playwright Test Suite", min(88, 85))
                playwright_artifact = ProjectArtifact(
                    project_id=project_id,
                    stage_id=stage.id,
                    artifact_type="test_suite",
                    name="Playwright E2E Test Suite",
                    description="AI-generated Playwright end-to-end tests covering authentication, navigation, CRUD, forms, and critical user journeys.",
                    file_type="playwright_project",
                )
                db.add(playwright_artifact)
                db.commit()
                db.refresh(playwright_artifact)

                try:
                    pw_result = generate_playwright_suite(
                        project_name=name,
                        description=description,
                        external_provider=ext_provider,
                        external_api_key=ext_key,
                        external_base_url=ext_url,
                        external_model=ext_model,
                        ollama_url=ollama_url,
                        llm_model=llm_model,
                    )
                    files = pw_result.get("files") or {}
                    playwright_artifact.content = files.get("README.md", "")
                    playwright_artifact.generated_by = pw_result.get("generated_by")
                    playwright_artifact.artifact_metadata = {"kind": "playwright_project", "files": files}
                    playwright_artifact.size_bytes = sum(len(v.encode("utf-8")) for v in files.values())
                    db.commit()
                except Exception:
                    playwright_artifact.content = None
                    playwright_artifact.generated_by = "error"
                    db.commit()

        # Stage 4: Generating Documentation phase
        _update_progress(db, project_id, "generating_docs", "Generating Documentation", 90)

        # Stage 5: Finalize
        project = db.query(Project).filter(Project.id == project_id).first()
        project.status = "completed"
        project.generation_stage = "completed"
        project.generation_progress = {
            "stage": "completed",
            "label": "Generation Complete",
            "progress": 100,
        }
        db.commit()

        _log_activity(
            db, user_id, project_id,
            "project_generated",
            f"Project '{project.name or name}' fully generated with AI",
        )

    except Exception as e:
        error_msg = str(e)
        _update_progress(db, project_id, "error", "Generation Failed", 0, error_msg)
        project = db.query(Project).filter(Project.id == project_id).first()
        if project:
            project.status = "error"
            project.generation_stage = "error"
            project.generation_error = error_msg
            db.commit()

        _log_activity(
            db, user_id, project_id,
            "project_generation_failed",
            f"Project generation failed: {error_msg[:200]}",
        )
    finally:
        db.close()


def start_async_generation(project_id: int, user_id: int, name: str, description: str,
                            document_texts: list[str], ext_provider: str | None,
                            ext_key: str | None, ext_url: str | None, ext_model: str | None,
                            ollama_url: str, llm_model: str):
    """Kick off the generation in a background daemon thread."""
    thread = threading.Thread(
        target=run_generation,
        args=(project_id, user_id, name, description, document_texts,
              ext_provider, ext_key, ext_url, ext_model, ollama_url, llm_model),
        daemon=True,
    )
    thread.start()
    return thread