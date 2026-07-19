from sqlalchemy import BigInteger, Boolean, Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
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

    # Set only for documents pulled in by a data source sync (e.g. Google Drive)
    # rather than a manual /upload — lets a re-sync tell "already ingested" from
    # "removed at the source" apart via external_id, without touching manual uploads.
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
    # JSON-encoded, source-specific config — e.g. for Google Drive: name,
    # primary_admin_email, my_drive_emails, shared_folder_urls, sync_deleted.
    config = Column(Text, nullable=True)
    status = Column(String(20), nullable=True)
    status_message = Column(Text, nullable=True)
    last_synced_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    # Sum of size_bytes across Documents currently synced from this
    # connection (not the account's total Drive quota) — recomputed at the
    # end of every sync.
    synced_size_bytes = Column(BigInteger, nullable=True, default=0)


class ChatChannel(Base):
    __tablename__ = "chat_channels"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    channel_name = Column(String(100), nullable=False)
    # Encrypted at rest via app.crypto.encrypt_str/decrypt_str.
    bot_token = Column(Text, nullable=True)
    bot_username = Column(String(150), nullable=True)
    # Unique per-channel path segment for its webhook URL -- doubles as the
    # bearer secret that authenticates inbound Telegram webhook calls, since
    # there's no user session on that request.
    webhook_secret = Column(String(64), nullable=True, unique=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class TelegramChatLink(Base):
    """One row per distinct Telegram chat that has messaged a connected bot.
    Keeps that chat's conversation in its own ChatSession, separate from any
    other Telegram user (or the owner's own web-app chats) hitting the same
    channel's RAG pipeline."""

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
    """A saved report. session_id set = generated from a chat session (one row per
    session, upserted on regenerate). session_id null = the user's most recent
    dataset-topic report (one row per user, upserted on regenerate)."""

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
