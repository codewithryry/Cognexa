from sqlalchemy import Boolean, Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
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


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text)
    answer = Column(Text)
    sources = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
