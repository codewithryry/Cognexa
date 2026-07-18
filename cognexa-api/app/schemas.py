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


class StatsOut(BaseModel):
    total_documents: int
    total_chunks: int
    questions_today: int
    storage_bytes: int
