from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, func
from sqlalchemy.orm import relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(150), unique=True, index=True)
    password = Column(String(255))
    plan = Column(String(20), default="community")
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
    cline_api_key = Column(String(255), nullable=True)
    integration_provider = Column(String(100), default="Cline")
    integration_base_url = Column(String(255), nullable=True)
    integration_model = Column(String(100), nullable=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question = Column(Text)
    answer = Column(Text)
    sources = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
