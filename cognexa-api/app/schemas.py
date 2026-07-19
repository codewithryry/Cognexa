from datetime import datetime

from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    plan: str = "community"

    class Config:
        from_attributes = True


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str | None = None
    chunks: int | None = None
    preview: str | None = None
    size_bytes: int | None = None
    page_count: int | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: str
    password: str | None = None


class SettingsIn(BaseModel):
    ollama_url: str
    llm_model: str
    embedding_model: str
    chunk_size: int
    chunk_overlap: int
    theme: str
    email_notifications: bool = True
    auto_reindex_stuck: bool = False
    duplicate_detection: bool = True


class SettingsOut(SettingsIn):
    class Config:
        from_attributes = True


class IntegrationIn(BaseModel):
    provider_name: str
    api_key: str | None = None
    base_url: str | None = None
    model: str | None = None


class IntegrationOut(BaseModel):
    id: int
    provider_name: str
    base_url: str | None = None
    model: str | None = None
    connected: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class GoogleDriveFolder(BaseModel):
    id: str
    name: str


class GoogleDriveConfig(BaseModel):
    sync_deleted: bool = True
    account_email: str | None = None
    folders: list[GoogleDriveFolder] = []


class GoogleDriveFoldersIn(BaseModel):
    folders: list[GoogleDriveFolder]


class DataSourceConnectionIn(BaseModel):
    source_name: str
    credential: str | None = None
    config: GoogleDriveConfig | None = None


class DataSourceConnectionOut(BaseModel):
    id: int
    source_name: str
    connected: bool
    status: str | None = None
    status_message: str | None = None
    last_synced_at: datetime | None = None
    synced_size_bytes: int = 0
    config: GoogleDriveConfig | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class DataSourceSyncStartedOut(BaseModel):
    started: bool
    status: str


class GoogleDriveAuthorizeOut(BaseModel):
    url: str


class GoogleDrivePickerTokenOut(BaseModel):
    access_token: str
    expires_in: int


class ChatChannelIn(BaseModel):
    channel_name: str
    bot_token: str | None = None


class ChatChannelOut(BaseModel):
    id: int
    channel_name: str
    connected: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True


class DbStatusOut(BaseModel):
    connected: bool
    message: str


class PlanOut(BaseModel):
    plan: str
    max_documents: int | None
    max_storage_bytes: int | None
    document_count: int
    storage_bytes: int
    max_ai_credits: int | None = None
    ai_credits_remaining: int | None = None
    max_apps: int | None = None
    apps_connected: int = 0
    max_chat_channels: int | None = None
    chat_channels_connected: int = 0
    billing_cycle_start: datetime | None = None
    billing_cycle_end: datetime | None = None


class SubscribeIn(BaseModel):
    plan: str
    card_number: str | None = None
    card_expiry: str | None = None
    card_cvc: str | None = None


class ChatMessageOut(BaseModel):
    id: int
    question: str
    answer: str
    sources: list[str] = []
    created_at: datetime | None = None

    class Config:
        from_attributes = True

    @field_validator("sources", mode="before")
    @classmethod
    def split_sources(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [s for s in value.split(",") if s]
        return value


class ChatSessionOut(BaseModel):
    id: int
    title: str
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class ChatSessionRenameIn(BaseModel):
    title: str


class ReportOut(BaseModel):
    report: str
    sources: list[str] = []


class ReportExportIn(BaseModel):
    report: str
    sources: list[str] = []
    title: str = "Report"


class GeneratedReportOut(BaseModel):
    id: int
    session_id: int | None = None
    topic: str | None = None
    title: str
    report: str
    sources: list[str] = []
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True

    @field_validator("sources", mode="before")
    @classmethod
    def split_sources(cls, value):
        if value is None:
            return []
        if isinstance(value, str):
            return [s for s in value.split(",") if s]
        return value


class StatsOut(BaseModel):
    total_documents: int
    total_chunks: int
    questions_today: int
    storage_bytes: int
