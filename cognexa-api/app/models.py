from sqlalchemy import BigInteger, Boolean, Column, Integer, String, Text, ForeignKey, TIMESTAMP, func, JSON
from sqlalchemy.dialects.mysql import LONGTEXT
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    password = Column(String(255))
    plan = Column(String(20), default="community")
    ai_credits_used = Column(Integer, default=0)
    ai_credits_period_start = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    first_login_at = Column(TIMESTAMP, nullable=True)

    documents = relationship("Document", back_populates="owner")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    filename = Column(String(255))
    file_path = Column(Text)
    file_type = Column(String(50))
    chunks = Column(Integer, default=0)
    preview = Column(Text, nullable=True)
    size_bytes = Column(Integer, nullable=True)
    page_count = Column(Integer, nullable=True)
    content_hash = Column(String(64), nullable=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    source_type = Column(String(30), nullable=True)
    data_source_id = Column(Integer, ForeignKey("data_source_connections.id"), nullable=True, index=True)
    external_id = Column(String(255), nullable=True, index=True)

    owner = relationship("User", back_populates="documents")


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    ollama_url = Column(String(255), default="http://localhost:11434")
    llm_model = Column(String(100), default="llama3.2")
    embedding_model = Column(String(100), default="all-MiniLM-L6-v2")
    chunk_size = Column(Integer, default=500)
    chunk_overlap = Column(Integer, default=50)
    theme = Column(String(20), default="dark")
    email_notifications = Column(Boolean, default=True)
    security_email_alerts = Column(Boolean, default=True)
    auto_reindex_stuck = Column(Boolean, default=False)
    duplicate_detection = Column(Boolean, default=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider_name = Column(String(100), nullable=False)
    api_key = Column(String(255), nullable=True)
    base_url = Column(String(255), nullable=True)
    model = Column(String(100), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class DataSourceConnection(Base):
    __tablename__ = "data_source_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_name = Column(String(100), nullable=False)
    credential = Column(Text, nullable=True)
    config = Column(Text, nullable=True)
    status = Column(String(20), nullable=True)
    status_message = Column(Text, nullable=True)
    last_synced_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    synced_size_bytes = Column(BigInteger, nullable=True, default=0)


class ChatChannel(Base):
    __tablename__ = "chat_channels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel_name = Column(String(100), nullable=False)
    bot_token = Column(Text, nullable=True)
    bot_username = Column(String(150), nullable=True)
    webhook_secret = Column(String(64), nullable=True, unique=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class TelegramChatLink(Base):
    __tablename__ = "telegram_chat_links"

    id = Column(Integer, primary_key=True, index=True)
    channel_id = Column(Integer, ForeignKey("chat_channels.id"), nullable=False, index=True)
    telegram_chat_id = Column(BigInteger, nullable=False, index=True)
    telegram_username = Column(String(150), nullable=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), default="New Chat")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True, index=True)
    question = Column(Text)
    answer = Column(Text)
    sources = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())


class GeneratedReport(Base):
    __tablename__ = "generated_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"), nullable=True, index=True)
    topic = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False, default="Report")
    report = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


# ============================================================
# SDLC Platform Models
# ============================================================


class Project(Base):
    """Top-level workspace for an SDLC project lifecycle."""
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(30), default="planning")
    sdlc_stage = Column(String(30), default="planning")
    repository_url = Column(String(500), nullable=True)
    start_date = Column(TIMESTAMP, nullable=True)
    target_date = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Async generation tracking
    generation_stage = Column(String(50), nullable=True)
    generation_progress = Column(JSON, nullable=True)
    generation_error = Column(Text, nullable=True)

    owner = relationship("User", backref="projects")
    stages = relationship("SDLCStage", back_populates="project", cascade="all, delete-orphan")
    artifacts = relationship("ProjectArtifact", back_populates="project", cascade="all, delete-orphan")


class SDLCStage(Base):
    """Individual lifecycle stage within a project."""
    __tablename__ = "sdlc_stages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    stage_type = Column(String(30), nullable=False)
    status = Column(String(30), default="pending")
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    priority = Column(Integer, default=0)
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="stages")
    artifacts = relationship("ProjectArtifact", back_populates="stage", cascade="all, delete-orphan")


class ProjectArtifact(Base):
    """Typed files associated with SDLC stages."""
    __tablename__ = "project_artifacts"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    stage_id = Column(Integer, ForeignKey("sdlc_stages.id"), nullable=True, index=True)
    artifact_type = Column(String(30), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(Text, nullable=True)
    file_type = Column(String(50), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    content_hash = Column(String(64), nullable=True)
    content = Column(LONGTEXT, nullable=True)
    generated_by = Column(String(20), nullable=True)
    artifact_metadata = Column("metadata", JSON, nullable=True)
    version = Column(Integer, default=1)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    project = relationship("Project", back_populates="artifacts")
    stage = relationship("SDLCStage", back_populates="artifacts")


class Pipeline(Base):
    """Workflow orchestration definition."""
    __tablename__ = "pipelines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    pipeline_type = Column(String(50), default="sdlc")
    config = Column(JSON, nullable=True)
    is_template = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    steps = relationship("PipelineStep", back_populates="pipeline", cascade="all, delete-orphan",
                          order_by="PipelineStep.step_order")
    executions = relationship("PipelineExecution", back_populates="pipeline", cascade="all, delete-orphan")


class PipelineStep(Base):
    """Individual step in a pipeline workflow."""
    __tablename__ = "pipeline_steps"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)
    step_type = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    config = Column(JSON, nullable=True)
    input_mapping = Column(JSON, nullable=True)
    output_mapping = Column(JSON, nullable=True)
    timeout_seconds = Column(Integer, default=300)
    retry_count = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())

    pipeline = relationship("Pipeline", back_populates="steps")


class PipelineExecution(Base):
    """Runtime tracking of pipeline runs."""
    __tablename__ = "pipeline_executions"

    id = Column(Integer, primary_key=True, index=True)
    pipeline_id = Column(Integer, ForeignKey("pipelines.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    status = Column(String(30), default="pending")
    triggered_by = Column(String(50), default="manual")
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    result = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    pipeline = relationship("Pipeline", back_populates="executions")
    execution_steps = relationship("PipelineExecutionStep", back_populates="execution",
                                    cascade="all, delete-orphan")


class PipelineExecutionStep(Base):
    """Individual step result during pipeline execution."""
    __tablename__ = "pipeline_execution_steps"

    id = Column(Integer, primary_key=True, index=True)
    execution_id = Column(Integer, ForeignKey("pipeline_executions.id"), nullable=False, index=True)
    step_id = Column(Integer, ForeignKey("pipeline_steps.id"), nullable=True)
    step_order = Column(Integer, nullable=False)
    step_type = Column(String(50), nullable=False)
    status = Column(String(30), default="pending")
    started_at = Column(TIMESTAMP, nullable=True)
    completed_at = Column(TIMESTAMP, nullable=True)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    execution = relationship("PipelineExecution", back_populates="execution_steps")


class ToolIntegration(Base):
    """External tool configurations (Cline, Playwright, SigNoz, etc.)."""
    __tablename__ = "tool_integrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    tool_name = Column(String(100), nullable=False)
    display_name = Column(String(255), nullable=True)
    config = Column(JSON, nullable=True)
    credentials_encrypted = Column(Text, nullable=True)
    status = Column(String(30), default="disconnected")
    status_message = Column(Text, nullable=True)
    version = Column(String(50), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class SDLCActivityLog(Base):
    """Audit trail for all SDLC actions."""
    __tablename__ = "sdlc_activity_log"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    stage_id = Column(Integer, ForeignKey("sdlc_stages.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    log_metadata = Column("metadata", JSON, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    project = relationship("Project")
    stage = relationship("SDLCStage")
